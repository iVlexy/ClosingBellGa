import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, catchError, of, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Sales' | 'Accountant' | 'FieldWorker' | 'Customer';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private userSubject = new BehaviorSubject<CurrentUser | null>(null);
  private impersonatedRoleSubject = new BehaviorSubject<string | null>(null);
  user$ = this.userSubject.asObservable();
  impersonatedRole$ = this.impersonatedRoleSubject.asObservable();

  readonly allRoles: string[] = ['Sales', 'Accountant', 'FieldWorker', 'Customer'];

  getMe(): Observable<CurrentUser | null> {
    if (this.userSubject.value) {
      return of(this.userSubject.value);
    }
    return this.http.get<CurrentUser>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => this.userSubject.next(user)),
      catchError(() => of(null)),
      shareReplay(1)
    );
  }

  get currentUser(): CurrentUser | null {
    return this.userSubject.value;
  }

  get impersonatedRole(): string | null {
    return this.impersonatedRoleSubject.value;
  }

  get effectiveRole(): string | null {
    return this.impersonatedRole ?? this.userSubject.value?.role ?? null;
  }

  get isImpersonating(): boolean {
    return this.impersonatedRole !== null;
  }

  get realIsAdmin(): boolean {
    return this.userSubject.value?.role === 'Admin';
  }

  startImpersonation(role: string): void {
    this.impersonatedRoleSubject.next(role);
  }

  stopImpersonation(): void {
    this.impersonatedRoleSubject.next(null);
  }

  hasRole(...roles: string[]): boolean {
    const role = this.effectiveRole;
    return role ? roles.includes(role) : false;
  }

  isAdmin(): boolean { return this.hasRole('Admin'); }
  isInternal(): boolean { return this.hasRole('Admin', 'Sales', 'Accountant', 'FieldWorker'); }
}
