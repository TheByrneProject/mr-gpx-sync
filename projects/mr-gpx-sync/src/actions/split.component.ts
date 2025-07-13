import { Component, HostBinding, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { TrackPoint } from '../gpx/track-point';
import { Settings } from '../gpx/settings';
import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { ActionEvent } from '../events/action-event';
import { TrackSeg } from '../gpx/track-seg';
import { MatCard, MatCardActions, MatCardContent } from '@angular/material/card';
import { DecimalPipe } from '@angular/common';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { setFormValue } from '../forms/form-utils';

@Component({
  selector: 'mr-gpx-sync-split',
  template: `
    <div class="action-title">Split</div>
    <div class="mb-1 y-auto p-1 d-flex flex-column">
      <mat-card class="mb-1">
        <mat-card-content class="card-values">
          <form [formGroup]="form" class="d-flex flex-column">
            <mat-button-toggle-group formControlName="keepBefore" class="me-auto mb-3" aria-label="Font Style">
              <mat-button-toggle [value]="true">Keep Before</mat-button-toggle>
              <mat-button-toggle [value]="false">Keep After</mat-button-toggle>
            </mat-button-toggle-group>

            <div class="d-flex">
              <div class="col-3">New Distance</div>
              <div>{{ distance ? (settings.getDistance(distance) | number : '1.0-2') + ' ' + settings.distanceUnits : '-' }}</div>
            </div>
            <div class="d-flex">
              <div class="col-3">New Duration</div>
              <div>{{ duration ? duration : '-' }}</div>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
    <mat-card>
      <mat-card-actions>
        <button mat-raised-button color="primary" (click)="cancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="split()" [disabled]="!form.valid">Split
          <mat-spinner *ngIf="loading"></mat-spinner>
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  imports: [
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    MatButtonToggleGroup,
    DecimalPipe,
    MatCardActions,
    MatProgressSpinner,
    MatButtonToggle
  ],
  styles: []
})
export class SplitComponent implements OnInit {

  @HostBinding('class') classes: string = 'd-flex flex-column w-100';

  p!: TrackPoint | undefined;
  track!: TrackSeg;
  duration!: string;
  distance!: number;
  settings!: Settings;
  loading: boolean = false;

  form: FormGroup = new FormGroup({
    keepBefore: new FormControl('true'),
  });

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
      this.init();
    });

    this.mrGpxSyncService.action$.subscribe((e: ActionEvent) => {
      if (this.loading) {
        this.loading = false;
      }
      if (!e.data) {
        return;
      }

      this.track = this.mrGpxSyncService.track$.getValue().getTrack();
      this.p = this.track.get(e.data[0].id);
      this.init();
    });
  }

  init(): void {
    if (!this.p) {
      return;
    }

    setFormValue(this.form, 'keepBefore', this.p.id > this.track.trkPts.length / 2);

    this.update();
    this.form.valueChanges.subscribe((values: any) => {
      this.update();
    });
  }

  cancel(): void {
    this.mrGpxSyncService.action$.next(new ActionEvent());
  }

  update(): void {
    let seg: TrackSeg = TrackSeg.from(this.track);
    if (this.p) {
      seg.split(this.p, this.form.getRawValue().keepBefore);
    }
    this.distance = seg.distance;
    this.duration = seg.durationDisplay;
  }

  split(): void {
    this.loading = true;
    if (this.p) {
      this.track.split(this.p, this.form.getRawValue().keepBefore);
    }
    this.mrGpxSyncService.setTrackSeg(this.track);
    this.mrGpxSyncService.action$.next(new ActionEvent());
  }
}
