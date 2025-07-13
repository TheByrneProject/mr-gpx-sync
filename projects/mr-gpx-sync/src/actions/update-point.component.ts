import { Component, HostBinding, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { TrackPoint } from '../gpx/track-point';
import { Settings } from '../gpx/settings';
import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { calcDistance } from '../gpx/calc';
import { GpxEvent } from '../events/gpx-event';
import { ActionEvent } from '../events/action-event';
import { TrackPointEvent } from '../events/track-point-event';
import { MatCard, MatCardActions, MatCardContent, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatInput, MatLabel } from '@angular/material/input';
import { setFormValue } from '../forms/form-utils';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'mr-gpx-sync-update-point',
  template: `
    <div class="action-title">Update Point</div>
    <div class="mb-1 y-auto p-1 d-flex flex-column">
      <mat-card class="mb-1">
        <mat-card-title>Current Point</mat-card-title>
        <mat-card-content class="card-values">
          <ng-container *ngIf="p1">
            <div class="card-row">
              <div class="w-25 label">Lon / Lat</div>
              <div>{{ p1?.lon }}, {{ p1?.lat }}</div>
            </div>
            <div class="card-row">
              <div class="w-25 label">Elevation</div>
              <div>{{ settings.getElevationAsDisplay(p1?.ele) }}</div>
            </div>
          </ng-container>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-title class="d-flex">
          <div class="me-5">New Values</div>
          <button mat-button color="primary" (click)="reset()">Reset</button>
          <button mat-button color="primary" (click)="paste()">Paste From Map</button>
        </mat-card-title>
        <mat-card-content class="card-values">
          <form [formGroup]="form" class="d-flex">
            <mat-form-field class="" appearance="fill">
              <mat-label>Latitude</mat-label>
              <input type="number" matInput formControlName="lat"/>
            </mat-form-field>
            <mat-form-field class="" appearance="fill">
              <mat-label>Longitude</mat-label>
              <input type="number" matInput formControlName="lon"/>
            </mat-form-field>
            <mat-form-field class="" appearance="fill">
              <mat-label>Elevation</mat-label>
              <input type="number" matInput formControlName="ele"/>
            </mat-form-field>
          </form>
          <div class="card-row">
            <div class="w-50 label">Distance Before</div>
            <div>{{ d0 ? settings.getShortDistanceDisplay(d0) + ' ' + settings.shortDistanceUnits : '-' }}</div>
          </div>
          <div class="card-row">
            <div class="w-50 label">Distance After</div>
            <div>{{ d2 ? settings.getShortDistanceDisplay(d2) + ' ' + settings.shortDistanceUnits : '-' }}</div>
          </div>
          <div class="card-row">
            <div class="w-50 label">Loss/Gain to Previous</div>
            <div>{{ e0 ? (e0 - e1).toFixed(1) + ' ' + settings.eleUnits : '-' }}</div>
          </div>
          <div class="card-row">
            <div class="w-50 label">Loss/Gain to Next</div>
            <div>{{ e2 ? (e2 - e1).toFixed(1) + ' ' + settings.eleUnits : '-' }}</div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
    <mat-card>
      <mat-card-actions>
        <button mat-raised-button color="primary" (click)="cancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="update()" [disabled]="!form.valid">Update
          <mat-spinner *ngIf="loading"></mat-spinner>
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  imports: [
    MatCard,
    MatCardTitle,
    MatCardContent,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatCardActions,
    MatProgressSpinner,
    MatButton,
    MatInput
  ],
  styles: []
})
export class UpdatePointComponent implements OnInit {

  @HostBinding('class') classes: string = 'd-flex flex-column w-100';

  p0!: TrackPoint | undefined;
  p1!: TrackPoint | undefined;
  p2!: TrackPoint | undefined;
  d0!: number;
  d2!: number;
  e0!: number;
  e1!: number;
  e2!: number;
  settings!: Settings;
  loading: boolean = false;

  form: FormGroup = new FormGroup({
    lon: new FormControl('', [Validators.required, Validators.pattern('^(\\+|-)?((\\d((\\.)|\\.\\d{1,36})?)|(0*?\\d\\d((\\.)|\\.\\d{1,36})?)|(0*?1[0-7]\\d((\\.)|\\.\\d{1,36})?)|(0*?180((\\.)|\\.0{1,36})?))$')]),
    lat: new FormControl('', [Validators.required, Validators.pattern('^(\\+|-)?((\\d((\\.)|\\.\\d{1,36})?)|(0*?[0-8]\\d((\\.)|\\.\\d{1,36})?)|(0*?90((\\.)|\\.0{1,36})?))$')]),
    ele: new FormControl('', [Validators.required, Validators.pattern('^^\\d{1,5}(\\.\\d+)?$')])
  });

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
      this.init();
    });

    this.mrGpxSyncService.action$.subscribe((e: ActionEvent) => {
      this.p1 = this.mrGpxSyncService.track$.getValue().getTrack().get(e.data[0].id);
      this.init();
    });

    this.mrGpxSyncService.mapPoint$.subscribe((p: TrackPointEvent) => {
      if (p.p?.lat && p.p?.lon) {
        setFormValue(this.form, 'lon', p.p.lon);
        setFormValue(this.form, 'lat', p.p.lat);
        this.setChanges();
      }
    });
  }

  init(): void {
    if (!this.p1) {
      return;
    }

    this.p0 = this.mrGpxSyncService.track$.getValue().getTrack().getPrevious(this.p1);
    this.p2 = this.mrGpxSyncService.track$.getValue().getTrack().getNext(this.p1);

    this.reset();
    this.form.valueChanges.subscribe((values: any) => {
      this.setChanges();
    });
  }

  cancel(): void {
    this.mrGpxSyncService.action$.next(new ActionEvent());
  }

  reset(): void {
    if (this.p1) {
      setFormValue(this.form, 'lon', this.p1.lon);
      setFormValue(this.form, 'lat', this.p1.lat);
      setFormValue(this.form, 'ele', this.settings.getElevation(this.p1.ele));
      this.setChanges();
    }
  }

  paste(): void {
    /*navigator.clipboard.readText().then((data: string) => {
      const p: any = JSON.parse(data);
      if (p.lat && p.lon) {
        this.form.get('lon').setValue(p.lon);
        this.form.get('lat').setValue(p.lat);
        this.setChanges();
      }
    });*/
  }

  setChanges(): void {
    const v: any = this.form.getRawValue();
    this.e1 = this.settings.setElevation(v.ele);

    if (this.p0) {
      this.d0 = calcDistance(this.p0.lon, this.p0.lat, v.lon, v.lat);
      this.e0 = this.p0.ele;
    }
    if (this.p2) {
      this.d2 = calcDistance(v.lon, v.lat, this.p2.lon, this.p2.lat);
      this.e2 = this.p2.ele;
    }
  }

  update(): void {
    const v: any = this.form.getRawValue();
    if (this.p1) {
      this.p1.lon = v.lon;
      this.p1.lat = v.lat;
      this.p1.ele = this.settings.setElevation(v.ele);
      const result: GpxEvent = this.mrGpxSyncService.updatePoint(this.p1);
      if (result.success) {
        this.mrGpxSyncService.action$.next(new ActionEvent());
      }
    }
    this.loading = false;
  }
}
