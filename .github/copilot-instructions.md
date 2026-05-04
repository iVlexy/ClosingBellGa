# LivelyFencing Application — Copilot Instructions

## Project Overview
Full-stack business management app for a fencing/exterior contracting company.
- **API**: ASP.NET Core 8, PostgreSQL + pgvector, EF Core (EnsureCreated, NO migrations), Cloudflare Zero Trust JWT auth
- **UI**: Angular 19 standalone components, Angular Material (green theme `#1B5E20`), hosted via nginx
- **Infra**: Kubernetes (single node `kube`), namespace `livelyfencing`, local registry `localhost:5000`
- **Domains**: `livelyfencing.com` (UI) · `api.livelyfencing.com` (API) — proxied through Cloudflare
- **SSH**: `ethan@192.168.86.127`, repo at `~/LF-CQ`

---

## Repository Structure
```
~/LF-CQ/
├── docker/
│   ├── Dockerfile.api          # dotnet SDK 8 → aspnet 8 runtime, port 8080
│   ├── Dockerfile.ui           # node:22-alpine → nginx:alpine, port 80
│   └── nginx.conf
├── k8s/
│   ├── api/deployment.yaml     # image: localhost:5000/lf-api:latest
│   └── ui/deployment.yaml      # image: localhost:5000/lf-ui:latest
└── src/
    ├── LivelyFencing.API/
    │   ├── Controllers/        # One controller per resource
    │   ├── Data/AppDbContext.cs
    │   ├── Domain/
    │   │   ├── Entities/Entities.cs    # ALL entities in one file
    │   │   └── Enums/Enums.cs          # ALL enums in one file
    │   ├── Infrastructure/
    │   │   ├── Auth/           # CloudflareJwtMiddleware.cs, AuthorizationPolicies.cs
    │   │   ├── AI/             # OllamaQuoteService.cs (pgvector similarity)
    │   │   └── Email/          # SendGridEmailService.cs
    │   └── Program.cs
    └── LivelyFencing.UI/
        ├── public/             # favicon.ico, favicon.svg (fence design)
        └── src/app/
            ├── app.component.ts     # Root: sidenav, nav links, dark mode toggle, impersonation
            ├── app.routes.ts        # All routes with authGuard()
            ├── app.config.ts
            ├── core/
            │   ├── guards/auth.guard.ts
            │   ├── interceptors/cf-jwt.interceptor.ts   # Attaches CF_Authorization cookie as Bearer
            │   └── services/
            │       ├── api.service.ts      # ALL HTTP calls
            │       ├── auth.service.ts     # currentUser, roles, impersonation
            │       └── theme.service.ts    # Dark mode (localStorage key: 'lf-dark')
            └── features/
                ├── admin/          # user-management.component.ts
                ├── budgets/
                ├── contractors/
                ├── customers/
                ├── expenses/
                ├── help/           # help.component.ts (workflow docs)
                ├── jobs/
                ├── landing/        # landing.component.ts (public marketing page)
                ├── leads/          # leads.component.ts (contact request management)
                ├── quotes/
                ├── reports/
                └── unauthorized/
```

---

## Authentication & Authorization

### Cloudflare Zero Trust
- All requests go through Cloudflare → CF sets `CF_Authorization` (HttpOnly cookie)
- Angular interceptor (`cf-jwt.interceptor.ts`) reads the cookie and adds `Authorization: Bearer <token>`
- `CloudflareJwtMiddleware` validates the JWT against Cloudflare's JWKS endpoint
- Signing keys are cached for 1 hour (`_cachedSigningKeys`)
- On first login, user record is auto-created in `Users` table with role `Customer`

### Bypass paths (no auth required)
```csharp
path.StartsWith("/health")
path.StartsWith("/swagger")
path == "/contact" && method == "POST"   // ← MUST be exact match + POST only
context.Request.Method == "OPTIONS"
```
**CRITICAL**: Adding a new public endpoint requires adding it to this bypass AND removing `[Authorize]`. Do NOT use `path.StartsWith("/contact")` — that would bypass auth for GET/PATCH too.

### Authorization Policies (`AuthorizationPolicies.cs`)
| Policy | Roles |
|--------|-------|
| `Admin` | Admin |
| `AdminOrSales` | Admin, Sales |
| `AdminOrAccountant` | Admin, Accountant |
| `Internal` | Admin, Sales, Accountant, FieldWorker |
| `AnyRole` | all 5 roles incl. Customer |

### Roles
`Admin` · `Sales` · `Accountant` · `FieldWorker` · `Customer`

### Angular Auth
- `auth.hasRole('Admin','Sales')` — role check for template visibility
- `auth.isAdmin()` / `auth.isInternal()` — convenience checks
- `auth.realIsAdmin` — true even during impersonation
- `auth.isImpersonating` — active impersonation
- Impersonated role stored in `BehaviorSubject`, propagates via `impersonatedRole$`
- Customer role → redirects to `/` (landing), not `/unauthorized`

### `authGuard()` usage in routes
```typescript
canActivate: [authGuard(['Admin', 'Sales'])]   // pass allowed roles array
```

---

## Database

### Connection
- PostgreSQL in pod `postgres-0`, namespace `livelyfencing`
- User: `lfuser`, DB: `livelyfencing`
- Injected via k8s secret `api-secret` → `ConnectionStrings__DefaultConnection`

### EF Core Setup
- Uses `EnsureCreated()` — **NOT migrations**
- `EnsureCreated` only creates the schema on first run. **New entities added after initial setup will NOT create new tables automatically.**
- **To add a new table for an existing DB**: manually run SQL via kubectl exec:
  ```bash
  kubectl exec -n livelyfencing postgres-0 -- psql -U lfuser -d livelyfencing -c "CREATE TABLE IF NOT EXISTS \"TableName\" (...)"
  ```
- pgvector extension enabled (`HasPostgresExtension("vector")`)
- `JobEmbedding.Embedding` column type: `vector(768)`

### Soft Delete Pattern
All major entities have `IsDeleted`, `DeletedAt`, `DeletedByEmail`.
Global query filters in `OnModelCreating` automatically exclude soft-deleted records.
Entities with soft delete: `Customer`, `Job`, `Quote`, `Contractor`, `ContractorPayment`, `Budget`, `Expense`.

### All Entities (in `Domain/Entities/Entities.cs`)
`User` · `Customer` · `Job` · `JobEmbedding` · `Quote` · `QuoteLineItem` · `Contractor` · `ContractorPayment` · `Budget` · `BudgetLineItem` · `AuditLog` · `Expense` · `ContactRequest`

### All Enums (in `Domain/Enums/Enums.cs`)
`UserRole` · `FencingType` · `JobStatus` · `QuoteStatus` · `LineItemCategory` · `TaxIdType` · `AuditAction` · `ExpenseCategory`

### ContactRequests Table
Created manually (not via EnsureCreated). Columns: `Id uuid PK`, `Name text`, `Email text`, `Phone text`, `Message text`, `CreatedAt timestamptz`, `Contacted boolean`.

---

## API Conventions

### Controller Pattern
```csharp
[ApiController]
[Route("resource-name")]          // plural, kebab-case
[Authorize(Policy = AuthorizationPolicies.Internal)]  // class-level default
public class ResourceController : ControllerBase
{
    // Override per-method with more specific policies:
    [Authorize(Policy = AuthorizationPolicies.AdminOrSales)]
}
```

### DTOs
Record types defined at the bottom of each controller file:
```csharp
public record ResourceRequest(string Name, ...);
```

### Datetime handling
Always store UTC: `DateTime.UtcNow`. For incoming `DateTime` from clients, always call `DateTime.SpecifyKind(value, DateTimeKind.Utc)`.

### JSON
- Enums serialized as strings (`JsonStringEnumConverter`)
- Circular references ignored (`ReferenceHandler.IgnoreCycles`)

### PDF Generation
QuestPDF (Community license). Used for quote PDF export. License set in `Program.cs`.

### AI Quotes
`OllamaQuoteService` — uses pgvector cosine similarity on `JobEmbedding` to find similar past jobs, then calls Ollama (local pod) to generate quote line items.

### Email
`SendGridEmailService` — SendGrid. Config keys: `SendGrid:ApiKey`, `SendGrid:FromEmail`, `App:AdminEmail`.

---

## UI Conventions

### Components
All components are **standalone** Angular 19. No NgModules. Always import all needed Material modules directly in the component's `imports` array.

### Signals
Use Angular `signal()` and `signal.set()` / `signal.update()` for reactive state. Not RxJS Subject for local component state.

### API Service
ALL HTTP calls go through `core/services/api.service.ts`. Base URL comes from `environment.ts`. Never call `HttpClient` directly in a component.

### Material Theme
- Primary palette: `mat.$green-palette`
- Tertiary: `mat.$orange-palette`
- Dark mode toggled by adding `dark-mode` class to `<html>` element
- Dark mode preference stored in `localStorage` key `'lf-dark'`
- `ThemeService.apply()` must be called in `AppComponent.ngOnInit()`

### Sidenav
- Background: `#1B5E20` (dark green)
- Header background: `#2E7D32`
- All text/icons must use `color: white !important` — Angular Material MDC overrides need `::ng-deep .mdc-list-item__primary-text` and `::ng-deep .mat-mdc-list-item .mat-icon`
- Active link: `.active-link` with left border `#A5D6A7`
- Dark mode toggle button (moon/sun) top-right of header

### Route Guards
```typescript
// In app.routes.ts — pattern used throughout:
{ path: 'leads', loadComponent: () => import(...).then(m => m.LeadsComponent), canActivate: [authGuard(['Admin', 'Sales'])] }
```

### Impersonation
Admin can "View as" any role via dropdown in sidenav footer.
- `Customer` impersonation → navigate to `/`
- All other roles → navigate to `/dashboard`
- Stop impersonation → navigate to `/dashboard`

---

## Build & Deployment

### Standard Deploy Sequence (after any code change)
```bash
# On remote server (ethan@192.168.86.127):
cd ~/LF-CQ

# API only:
docker build -f docker/Dockerfile.api -t localhost:5000/lf-api:latest .
docker push localhost:5000/lf-api:latest
kubectl rollout restart deploy/api -n livelyfencing
kubectl rollout status deploy/api -n livelyfencing --timeout=90s

# UI only:
docker build -f docker/Dockerfile.ui -t localhost:5000/lf-ui:latest .
docker push localhost:5000/lf-ui:latest
kubectl rollout restart deploy/ui -n livelyfencing
kubectl rollout status deploy/ui -n livelyfencing --timeout=90s
```

### Kubernetes
- Namespace: `livelyfencing`
- Pods: `api-*`, `ui-*`, `postgres-0`, `cloudflared-*`, `ollama-0`
- Registry: `localhost:5000` (local Docker registry)
- Secrets: `api-secret` (contains `CONNECTION_STRING`, CF keys, SendGrid keys)
- `imagePullPolicy: Always` — new pushes are picked up on rollout restart

### Angular Build Output
Built to `/dist/browser` inside the container. Served by nginx from `/usr/share/nginx/html`.
`favicon.svg` and `favicon.ico` are in `public/` and copied automatically.

---

## Making Changes — Patterns to Follow

### Adding a New API Endpoint to Existing Controller
1. Add method to the controller with appropriate `[Authorize(Policy = ...)]`
2. Add DTO record at bottom of controller file if needed
3. Add corresponding method to `api.service.ts` on the UI
4. Rebuild and deploy API (UI if `api.service.ts` changed)

### Adding a Completely New Resource
1. Add entity class to `Domain/Entities/Entities.cs`
2. Add enum values to `Domain/Enums/Enums.cs` if needed
3. Add `DbSet<Entity>` to `AppDbContext.cs`
4. Add `OnModelCreating` config in `AppDbContext.cs`
5. Create `Controllers/ResourceController.cs`
6. **Manually create the DB table** (EnsureCreated won't add it):
   ```bash
   kubectl exec -n livelyfencing postgres-0 -- psql -U lfuser -d livelyfencing -c "CREATE TABLE IF NOT EXISTS \"TableName\" (...)"
   ```
7. Create Angular feature component in `features/resource/`
8. Add route to `app.routes.ts` with `authGuard`
9. Add nav link to `app.component.ts` sidenav with `*ngIf="auth.hasRole(...)"`
10. Add API service methods to `api.service.ts`

### Modifying Files via SSH (PowerShell limitation)
**NEVER try to use multi-line Python in a PowerShell SSH one-liner** — PowerShell mangles quotes.
Always:
1. Create a `.py` script locally with `create_file` tool
2. `scp` it to `/tmp/` on the remote
3. `ssh ethan@192.168.86.127 "python3 /tmp/script.py"`
4. Clean up with `rm /tmp/*.py` before committing

### Git Workflow
```bash
cd ~/LF-CQ
git add -A
git commit -m "feat: description"
git push origin main
```
Remote: `github.com:iVlexy/LF-CQ.git`

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `relation "TableName" does not exist` | New entity added after EnsureCreated ran | Manually `CREATE TABLE` via kubectl exec |
| `No DefaultChallengeScheme` (500) | Bypass path too broad (e.g. `StartsWith("/contact")`) lets auth-required methods skip JWT | Make bypass exact: `path == "/contact" && method == "POST"` |
| UI shows old favicon after deploy | Browser/Cloudflare caches `/favicon.ico` regardless of `<link>` tag | Replace the actual `.ico` file content; purge Cloudflare cache |
| Dark mode not applying on load | `theme.apply()` not called in `ngOnInit` | Ensure `ThemeService.apply()` is first line in `AppComponent.ngOnInit()` |
| Angular Material icons/text not white in sidenav | MDC encapsulation overrides inherited color | Use `::ng-deep .mdc-list-item__primary-text` and `!important` |

---

## Feature Map

| Route | Component | Roles |
|-------|-----------|-------|
| `/` | LandingComponent | Public (internal users redirected to `/dashboard`) |
| `/dashboard` | DashboardComponent | Internal |
| `/customers` | CustomerListComponent | Admin, Sales, Accountant |
| `/leads` | LeadsComponent | Admin, Sales |
| `/jobs` | JobListComponent | Internal |
| `/quotes` | QuoteListComponent | Admin, Sales, Accountant |
| `/contractors` | ContractorListComponent | Admin, Accountant |
| `/budgets` | BudgetListComponent | Admin, Accountant |
| `/reports` | ReportsComponent | Admin, Accountant |
| `/expenses` | ExpenseListComponent | Admin, Accountant |
| `/help` | HelpComponent | Internal |
| `/admin/users` | UserManagementComponent | Admin (non-impersonating) |
