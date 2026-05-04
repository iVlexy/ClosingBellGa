import { Component, OnInit, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-carousel-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSnackBarModule, MatProgressSpinnerModule,
    MatProgressBarModule, MatTooltipModule, MatTabsModule, DragDropModule],
  template: `
    <div class="cm-page">
      <div class="cm-header">
        <div>
          <h1>Carousel Images</h1>
          <span class="subtitle">{{ images.length }} image{{ images.length !== 1 ? 's' : '' }} on the homepage</span>
        </div>
        <button mat-raised-button color="primary" (click)="save()" [disabled]="saving || loading">
          <mat-icon>save</mat-icon> Save Changes
        </button>
      </div>

      <div class="cm-loading" *ngIf="loading">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!loading">
        <mat-card class="add-card">
          <mat-card-content>
            <mat-tab-group>
              <!-- Tab 1: Upload file -->
              <mat-tab label="Upload Image">
                <div class="tab-content">
                  <div class="upload-zone"
                    [class.drag-over]="isDragOver"
                    (click)="fileInput.click()"
                    (dragover)="$event.preventDefault(); isDragOver=true"
                    (dragleave)="isDragOver=false"
                    (drop)="onDrop($event)">
                    <mat-icon class="upload-icon">cloud_upload</mat-icon>
                    <p class="upload-label">Click or drag & drop an image here</p>
                    <p class="upload-hint">JPG, PNG, WebP, AVIF — uploaded directly to Cloudflare Images</p>
                    <input #fileInput type="file" accept="image/*" style="display:none" (change)="onFileSelected($event)">
                  </div>
                  <div class="upload-progress" *ngIf="uploading">
                    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                    <span class="upload-status">{{ uploadStatus }}</span>
                  </div>
                </div>
              </mat-tab>

              <!-- Tab 2: Paste URL -->
              <mat-tab label="Paste URL">
                <div class="tab-content">
                  <div class="add-row">
                    <mat-form-field appearance="outline" class="url-field">
                      <mat-label>Cloudflare Image URL</mat-label>
                      <mat-icon matPrefix>link</mat-icon>
                      <input matInput [(ngModel)]="newUrl" placeholder="https://imagedelivery.net/..." (keydown.enter)="addUrl()">
                    </mat-form-field>
                    <button mat-raised-button color="primary" (click)="addUrl()" [disabled]="!newUrl.trim()">
                      <mat-icon>add</mat-icon> Add
                    </button>
                  </div>
                </div>
              </mat-tab>
            </mat-tab-group>
          </mat-card-content>
        </mat-card>

        <!-- Image list -->
        <div class="cm-hint" *ngIf="images.length > 0">
          <mat-icon>drag_indicator</mat-icon> Drag to reorder &nbsp;·&nbsp; Changes are saved when you click Save Changes
        </div>

        <div cdkDropList class="image-grid" (cdkDropListDropped)="drop($event)">
          <div class="image-item" *ngFor="let img of images; let i = index" cdkDrag>
            <div class="drag-handle" cdkDragHandle>
              <mat-icon>drag_indicator</mat-icon>
            </div>
            <div class="img-preview-wrap">
              <img [src]="img" class="img-preview" loading="lazy" alt="Carousel image {{ i + 1 }}">
            </div>
            <div class="img-url">
              <span class="img-index">#{{ i + 1 }}</span>
              <span class="img-url-text">{{ img }}</span>
            </div>
            <button mat-icon-button color="warn" (click)="removeImage(i)" matTooltip="Remove image">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>

        <div class="empty-state" *ngIf="images.length === 0">
          <mat-icon>image_not_supported</mat-icon>
          <p>No images yet. Upload one or paste a URL above.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .cm-page { padding: 32px; max-width: 900px; }
    .cm-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .cm-header h1 { font-size: 28px; font-weight: 700; color: #1B5E20; margin: 0 0 4px; }
    .subtitle { font-size: 14px; color: #777; }
    .cm-loading { display: flex; justify-content: center; padding: 48px; }
    .add-card { margin-bottom: 24px; }
    .tab-content { padding: 20px 0 4px; }
    .upload-zone {
      border: 2px dashed #A5D6A7; border-radius: 12px; padding: 40px 24px;
      text-align: center; cursor: pointer; transition: all .2s;
      background: #F9FBE7;
    }
    .upload-zone:hover, .upload-zone.drag-over {
      border-color: #2E7D32; background: #E8F5E9;
    }
    .upload-icon { font-size: 48px; width: 48px; height: 48px; color: #2E7D32; display: block; margin: 0 auto 12px; }
    .upload-label { font-size: 16px; font-weight: 600; color: #333; margin: 0 0 6px; }
    .upload-hint { font-size: 13px; color: #888; margin: 0; }
    .upload-progress { margin-top: 16px; }
    .upload-status { font-size: 13px; color: #555; display: block; margin-top: 8px; text-align: center; }
    .add-row { display: flex; gap: 12px; align-items: flex-start; }
    .url-field { flex: 1; }
    .cm-hint { display: flex; align-items: center; gap: 6px; color: #888; font-size: 13px; margin-bottom: 12px; }
    .image-grid { display: flex; flex-direction: column; gap: 12px; }
    .image-item {
      display: flex; align-items: center; gap: 16px;
      background: #fff; border: 1px solid #E8F5E9; border-radius: 10px;
      padding: 12px 16px; box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    .image-item.cdk-drag-preview { box-shadow: 0 6px 20px rgba(0,0,0,.15); }
    .image-item.cdk-drag-placeholder { opacity: 0.3; }
    .drag-handle { cursor: grab; color: #aaa; flex-shrink: 0; }
    .drag-handle:active { cursor: grabbing; }
    .img-preview-wrap { flex-shrink: 0; }
    .img-preview { width: 90px; height: 60px; object-fit: cover; border-radius: 6px; display: block; }
    .img-url { flex: 1; min-width: 0; }
    .img-index { font-size: 11px; font-weight: 700; color: #2E7D32; display: block; margin-bottom: 2px; }
    .img-url-text { font-size: 12px; color: #666; word-break: break-all; line-height: 1.4; }
    .empty-state { text-align: center; padding: 48px; color: #aaa; }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; display: block; margin: 0 auto 12px; }
    .cdk-drop-list-dragging .image-item:not(.cdk-drag-placeholder) { transition: transform 200ms cubic-bezier(0,0,.2,1); }
  `]
})
export class CarouselManagementComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private api = inject(ApiService);
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);

  images: string[] = [];
  newUrl = '';
  loading = true;
  saving = false;
  uploading = false;
  uploadStatus = '';
  isDragOver = false;

  ngOnInit() {
    this.api.getCarouselImages().subscribe({
      next: imgs => { this.images = imgs; this.loading = false; },
      error: () => { this.snack.open('Failed to load images', 'Dismiss', { duration: 3000 }); this.loading = false; }
    });
  }

  addUrl() {
    const url = this.newUrl.trim();
    if (!url) return;
    if (!url.startsWith('http')) {
      this.snack.open('URL must start with http', 'Dismiss', { duration: 3000 });
      return;
    }
    this.images = [...this.images, url];
    this.newUrl = '';
  }

  removeImage(index: number) {
    this.images = this.images.filter((_, i) => i !== index);
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.images, event.previousIndex, event.currentIndex);
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.uploadFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.uploadFile(file);
  }

  uploadFile(file: File) {
    if (!file.type.startsWith('image/')) {
      this.snack.open('Only image files are supported', 'Dismiss', { duration: 3000 });
      return;
    }
    this.uploading = true;
    this.uploadStatus = 'Getting upload URL...';

    // Step 1: get a one-time upload URL from our backend
    this.api.getCarouselUploadUrl().subscribe({
      next: ({ uploadUrl, publicUrl }) => {
        this.uploadStatus = 'Uploading to Cloudflare...';
        // Step 2: upload directly to CF (no auth header needed — URL is pre-signed)
        const fd = new FormData();
        fd.append('file', file);
        this.http.post<any>(uploadUrl, fd).subscribe({
          next: () => {
            this.images = [...this.images, publicUrl];
            this.uploading = false;
            this.uploadStatus = '';
            if (this.fileInput?.nativeElement) this.fileInput.nativeElement.value = '';
            // Auto-save after successful upload
            this.api.updateCarouselImages(this.images).subscribe({
              next: () => this.snack.open('Image uploaded and saved!', undefined, { duration: 4000 }),
              error: () => this.snack.open('Uploaded but failed to save — click Save Changes', 'Dismiss', { duration: 5000 })
            });
          },
          error: (err) => {
            this.uploading = false;
            this.uploadStatus = '';
            this.snack.open('Upload to Cloudflare failed', 'Dismiss', { duration: 4000 });
          }
        });
      },
      error: (err) => {
        this.uploading = false;
        this.uploadStatus = '';
        const msg = err?.error?.error || 'Failed to get upload URL';
        this.snack.open(msg, 'Dismiss', { duration: 5000 });
      }
    });
  }

  save() {
    this.saving = true;
    this.api.updateCarouselImages(this.images).subscribe({
      next: () => {
        this.snack.open('Carousel saved!', undefined, { duration: 3000 });
        this.saving = false;
      },
      error: () => {
        this.snack.open('Failed to save', 'Dismiss', { duration: 3000 });
        this.saving = false;
      }
    });
  }
}
