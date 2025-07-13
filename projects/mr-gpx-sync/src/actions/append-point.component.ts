import { Component, HostBinding, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';

import { Subscription, timer } from 'rxjs';
import Point from 'ol/geom/Point';

import { Settings } from '../gpx/settings';
import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { ActionEvent } from '../events/action-event';
import { TrackFile } from '../gpx/track-file';
import { calcDistancePoint, calcPacePoint } from '../gpx/calc';
import { TrackPoint } from '../gpx/track-point';
import { TrackPointEvent } from '../events/track-point-event';
import { DecimalPipe } from '@angular/common';
import { MatCard, MatCardActions } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { setFormValue } from '../forms/form-utils';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/input';

@Component({
  selector: 'mr-gpx-sync-append-point-wizard',
  imports: [
    MatIcon,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatFormField,
    DecimalPipe,
    MatCardActions,
    MatCard,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose
  ],
  template: `
    <div class="d-flex flex-grow-0">
      <div class="action-title">{{ appendTitle }} Point Wizard</div>
      <mat-icon class="ms-auto me-0" (click)="openInfo()">info</mat-icon>
    </div>
    <div [formGroup]="form" class="mb-1 overflow-auto p-1 d-flex flex-column flex-grow-1">
      <div class="d-flex align-items-center m-2">
        <button mat-raised-button color="primary" (click)="reset()">Reset to last point</button>
      </div>
      <div class="d-flex align-items-center m-2">
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
      </div>
      <div class="d-flex align-items-center m-2">
        <mat-form-field class="me-5" appearance="fill">
          <mat-label>Time delta to next segment</mat-label>
          <input type="number" matInput formControlName="dt"/>
        </mat-form-field>
        <div>Pace: {{ pace | number : '1.0-1' }} {{ settings.paceUnits }}</div>
      </div>
      <div class="d-flex m-2">
        <div class=w-50>
          Distance Between: {{ settings.getShortDistance(dx) | number : '1.0-1' }} {{ settings.shortDistanceUnits }}
        </div>
        <div class=w-50>
          Elevation Between: {{ oldTrkPt.ele - newTrkPt.ele | number : '1.0-1' }} {{ settings.eleUnits }}
        </div>
      </div>
    </div>
    <mat-card>
      <mat-card-actions>
        <button mat-raised-button color="primary" (click)="cancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="append()" [disabled]="!form.valid">{{ appendTitle }}</button>
      </mat-card-actions>
    </mat-card>

    <ng-template #infoTemplate>
      <h1 mat-dialog-title>Info - {{ appendTitle }} Wizard</h1>
      <div mat-dialog-content>
        <div class="p-1 d-flex flex-column">
          <div>
            <span class="me-5"></span>todo
          </div>
        </div>
      </div>
      <div mat-dialog-actions>
        <button mat-button [mat-dialog-close]="" cdkFocusInitial>Close</button>
      </div>
    </ng-template>
  `
})
export class AppendPointComponent implements OnInit {

  @HostBinding('class') classes: string = 'd-flex flex-column w-100';

  @ViewChild('infoTemplate') infoTemplate!: TemplateRef<any>;

  settings!: Settings;
  trackFile!: TrackFile;
  oldTrkPt!: TrackPoint;
  newTrkPt!: TrackPoint;

  mapUpdated: boolean = false;
  dt: number = 4;
  dx!: number;
  pace!: number;
  appendMode!: string;
  appendTitle: string = 'Append';
  form: FormGroup = new FormGroup({
    lon: new FormControl('', [Validators.required, Validators.pattern('^(\\+|-)?((\\d((\\.)|\\.\\d{1,36})?)|(0*?\\d\\d((\\.)|\\.\\d{1,36})?)|(0*?1[0-7]\\d((\\.)|\\.\\d{1,36})?)|(0*?180((\\.)|\\.0{1,36})?))$')]),
    lat: new FormControl('', [Validators.required, Validators.pattern('^(\\+|-)?((\\d((\\.)|\\.\\d{1,36})?)|(0*?[0-8]\\d((\\.)|\\.\\d{1,36})?)|(0*?90((\\.)|\\.0{1,36})?))$')]),
    ele: new FormControl('', [Validators.required, Validators.pattern('^^\\d{1,5}(\\.\\d+)?$')]),
    dt: new FormControl(this.dt, Validators.required)
  });
  subscription!: Subscription;

  constructor(private mrGpxSyncService: MrGpxSyncService,
              public dialog: MatDialog) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });

    this.mrGpxSyncService.action$.subscribe((action: ActionEvent) => {
      if (action.name && action.name.indexOf('end-point') !== -1) {
        this.mrGpxSyncService.log(`AppendTrackComponent.action.subscribe: name=${action.name}`);
        this.appendMode = action.name;
        this.trackFile = this.mrGpxSyncService.track$.getValue();

        this.dx = 1;
        if (action.name === 'action-append-point') {
          this.appendTitle = 'Append';
          this.oldTrkPt = this.trackFile.getTrack().getEnd();
          this.newTrkPt = TrackPoint.from(this.trackFile.getTrack().getEnd());
        } else if (action.name === 'action-prepend-point') {
          this.appendTitle = 'Prepend';
          this.oldTrkPt = this.trackFile.getTrack().getStart();
          this.newTrkPt = TrackPoint.from(this.trackFile.getTrack().getStart());
        }

        this.newTrkPt.setLonLat(+this.newTrkPt.lon + 0.00005, +this.newTrkPt.lat + 0.00005);
        setFormValue(this.form, 'lon', this.newTrkPt.lon);
        setFormValue(this.form, 'lat', this.newTrkPt.lat);
        setFormValue(this.form, 'ele', this.newTrkPt.ele);
        setFormValue(this.form, 'dt', this.dt);

        this.dx = calcDistancePoint(this.oldTrkPt.point, this.newTrkPt.point);
        this.updatePace(this.dt);

        if (this.subscription) {
          this.subscription.unsubscribe();
        }
        this.subscription = this.form.valueChanges.subscribe((values: any) => {
          this.formUpdated();
        });
      }
    });

    this.mrGpxSyncService.mapPoint$.subscribe((e: TrackPointEvent) => {
      if (e.p) {
        this.mapUpdated = true;
        setFormValue(this.form, 'lon', e.p.lon);
        setFormValue(this.form, 'lat', e.p.lat);
        timer(50).subscribe(() => {
          this.mapUpdated = false;
        });
      }
    });
  }

  reset(): void {
    this.newTrkPt = TrackPoint.from(this.oldTrkPt);
    setFormValue(this.form, 'lon', this.newTrkPt.lon);
    setFormValue(this.form, 'lat', this.newTrkPt.lat);
    setFormValue(this.form, 'ele', this.newTrkPt.ele);
    this.dx = calcDistancePoint(this.oldTrkPt.point, this.newTrkPt.point);
    this.updatePace(this.dt);
  }

  formUpdated(): void {
    const val = this.form.getRawValue();
    this.newTrkPt.lon = val.lon;
    this.newTrkPt.lat = val.lat;
    this.newTrkPt.point = new Point([val.lon, val.lat]);
    this.newTrkPt.ele = val.ele;
    this.dt = val.dt;
    this.dx = calcDistancePoint(this.oldTrkPt.point, this.newTrkPt.point);
    this.updatePace(this.dt);
    if (!this.mapUpdated) {
      this.mrGpxSyncService.setMapPoint(this.newTrkPt, 'append');
    }
  }

  updatePace(dt: number): void {
    this.pace = calcPacePoint(dt, this.oldTrkPt.point, this.newTrkPt.point);
  }

  cancel(): void {
    this.mrGpxSyncService.action$.next(new ActionEvent());
  }

  append(): void {
    this.mrGpxSyncService.loading$.next(true);

    timer(25).subscribe(() => {
      if (this.appendMode.indexOf('append') !== -1) {
        this.mrGpxSyncService.appendPoint(this.newTrkPt, this.form.getRawValue().dt);
      } else {
        this.mrGpxSyncService.prependPoint(this.newTrkPt, this.form.getRawValue().dt);
      }
      this.mrGpxSyncService.action$.next(new ActionEvent());
    });
  }

  openInfo(): void {
    const dialogRef = this.dialog.open(this.infoTemplate, {
      minWidth: '50vw'
    });
    dialogRef.afterClosed().subscribe();
  }
}
