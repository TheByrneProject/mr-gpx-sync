import { Component, HostBinding, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { ActionEvent } from '../events/action-event';
import { TrackFile } from '../gpx/track-file';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { SecondsToTime } from '../pipes';
import { MatButton } from '@angular/material/button';
import { setFormValue } from '../forms/form-utils';
import { MatFormField, MatLabel } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

@Component({
  selector: 'mr-gpx-sync-compress',
  imports: [
    MatCard,
    MatCardContent,
    SecondsToTime,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatButton,
    MatCardActions,
    MatProgressSpinner
  ],
  template: `
    <div class="action-title">Compress</div>
    <mat-card class="mb-1 overflow-auto">
      <mat-card-content>
        <div class="mb-1">
          <span class="me-5"></span>Compression will automatically reduce the length of a course. If it is 59:00 and you
          need to get it down
          to fit a 58:30 video, this will go through and find the points with the slowest pace and reduce its duration
          by a second at a time. It iterates in this fashion until it hits 58:30.
        </div>
        <div class="d-flex mb-3">
          <div class="w-25 label">Current Duration</div>
          <div>{{ duration | secToTime }}</div>
        </div>
        <form [formGroup]="form" class="d-flex align-items-center justify-content-between">
          <div class="label me-5">
            New Duration
          </div>
          <mat-form-field class="w-100px" appearance="fill">
            <mat-label>H</mat-label>
            <input type="number" matInput formControlName="h"/>
          </mat-form-field>
          <mat-form-field class="w-100px" appearance="fill">
            <mat-label>M</mat-label>
            <input type="number" matInput formControlName="m"/>
          </mat-form-field>
          <mat-form-field class="w-100px" appearance="fill">
            <mat-label>S</mat-label>
            <input type="number" matInput formControlName="s"/>
          </mat-form-field>
        </form>
      </mat-card-content>
    </mat-card>
    <mat-card>
      <mat-card-actions>
        <button mat-raised-button color="primary" (click)="cancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="compress()">Compress
          <mat-spinner *ngIf="loading"></mat-spinner>
        </button>
      </mat-card-actions>
    </mat-card>
  `
})
export class CompressComponent implements OnInit {

  @HostBinding('class') classes: string = 'p-1 d-flex flex-column w-100';

  loading: boolean = false;

  duration: number = 0;

  form: FormGroup = new FormGroup({
    h: new FormControl('', [Validators.required, Validators.min(0), Validators.max(59)]),
    m: new FormControl('', [Validators.required, Validators.min(0), Validators.max(59)]),
    s: new FormControl('', [Validators.required, Validators.min(0), Validators.max(59)]),
  });

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.track$.subscribe((track: TrackFile) => {
      if (this.loading) {
        this.loading = false;
      }

      this.duration = track.getTrack().duration;

      const h = Math.floor(this.duration / 3600.0);
      const hr = this.duration % 3600;
      const m = Math.floor(hr / 60.0);
      const mh = hr % 60;
      const s = mh;
      setFormValue(this.form, 'h', h);
      setFormValue(this.form, 'm', m);
      setFormValue(this.form, 's', s);
    });
  }

  cancel(): void {
    this.mrGpxSyncService.action$.next(new ActionEvent());
  }

  compress(): void {
    this.loading = true;
    const v: any = this.form.getRawValue();

    const result: boolean = this.mrGpxSyncService.compress(v.h * 3600 + v.m * 60 + v.s);
    if (!result) {
      this.loading = false;
    }
    this.mrGpxSyncService.action$.next(new ActionEvent());
  }
}
