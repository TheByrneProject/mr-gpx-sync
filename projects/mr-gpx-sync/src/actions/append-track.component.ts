import { Component, HostBinding, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';

import { timer } from 'rxjs';

import { Settings } from '../gpx/settings';
import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { ActionEvent } from '../events/action-event';
import { TrackFile } from '../gpx/track-file';
import { calcDistancePoint, calcPacePoint } from '../gpx/calc';
import { DecimalPipe } from '@angular/common';
import { SecondsToTime } from '../pipes';
import { MatCard, MatCardActions } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { setFormValue } from '../forms/form-utils';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel } from '@angular/material/input';

@Component({
  selector: 'mr-gpx-sync-append-track-wizard',
  imports: [
    MatIcon,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    DecimalPipe,
    SecondsToTime,
    MatCard,
    MatCardActions,
    MatButton,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose
  ],
  template: `
    <div class="d-flex flex-grow-0">
      <div class="action-title">{{ appendTitle }} Track Wizard</div>
      <mat-icon class="ms-auto me-0" (click)="openInfo()">info</mat-icon>
    </div>
    <div [formGroup]="form" class="mb-1 overflow-auto p-1 d-flex flex-column flex-grow-1">
      <div class="d-flex align-items-center m-2">
        <mat-form-field class="me-5" appearance="fill">
          <mat-label>Time delta to next segment</mat-label>
          <input type="number" matInput formControlName="dt" (change)="dtChanged()"/>
        </mat-form-field>
        <div>Pace: {{ pace | number : '1.0-1' }} {{ settings.paceUnits }}</div>
      </div>
      <div class="d-flex m-2">
        Distance Between: {{ settings.getShortDistance(dx) | number : '1.0-1' }} {{ settings.shortDistanceUnits }}
      </div>
      <div class="d-flex m-2">
        <div class="w-50">Old
          Distance: {{ settings.getDistance(trackFile.getTrack().distance) | number : '1.0-2' }} {{ settings.distanceUnits }}
        </div>
        <div class="w-50">New
          Distance: {{ settings.getDistance(trackFile.getTrack().distance + dx + newTrackFile.getTrack().distance) | number : '1.0-2' }} {{ settings.distanceUnits }}
        </div>
      </div>
      <div class="d-flex m-2">
        <div class="w-50">Old Duration: {{ trackFile.getTrack().duration | secToTime : 'hhmmss' : true }}</div>
        <div class="w-50">New
          Duration: {{ trackFile.getTrack().duration + dt + newTrackFile.getTrack().duration | secToTime : 'hhmmss' : true }}
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
export class AppendTrackComponent implements OnInit {

  @HostBinding('class') classes: string = 'd-flex flex-column w-100';

  @ViewChild('infoTemplate') infoTemplate!: TemplateRef<any>;

  settings!: Settings;
  trackFile!: TrackFile;
  newTrackFile!: TrackFile;

  dt: number = 4;
  dx!: number;
  pace!: number;
  appendMode!: string;
  appendTitle: string = 'Append';
  form: FormGroup = new FormGroup({
    dt: new FormControl(this.dt, Validators.required)
  });

  constructor(private mrGpxSyncService: MrGpxSyncService,
              public dialog: MatDialog) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });

    this.mrGpxSyncService.action$.subscribe((action: ActionEvent) => {
      if (action.name && action.name.indexOf('action-end-track') !== -1) {
        this.mrGpxSyncService.log(`AppendTrackComponent.action.subscribe: name=${action.name}`);
        this.appendMode = action.name;
        this.trackFile = this.mrGpxSyncService.track$.getValue();
        this.newTrackFile = action.data?.trackFile;

        if (!this.newTrackFile) {
          this.mrGpxSyncService.log('No track file on event!', 'warn');
          return;
        }

        if (action.name === 'append-track') {
          this.appendTitle = 'Append';
          this.dx = calcDistancePoint(this.trackFile.getTrack().getEnd().point, this.newTrackFile.getTrack().getStart().point);
        } else if (action.name === 'prepend-track') {
          this.appendTitle = 'Prepend';
          this.dx = calcDistancePoint(this.newTrackFile.getTrack().getEnd().point, this.trackFile.getTrack().getStart().point);
        }

        this.updatePace(this.dt);

        setFormValue(this.form, 'dt', this.dt);
      }
    });
  }

  dtChanged(): void {
    let formControl = this.form.get('dt');
    if (formControl) {
      this.dt = formControl.value;
    }
    this.updatePace(this.dt);
  }

  updatePace(dt: number): void {
    if (this.appendMode === 'append-track') {
      this.pace = calcPacePoint(dt, this.trackFile.getTrack().getEnd().point, this.newTrackFile.getTrack().getStart().point);
    } else if (this.appendMode === 'prepend-track') {
      this.pace = calcPacePoint(dt, this.newTrackFile.getTrack().getEnd().point, this.trackFile.getTrack().getStart().point);
    }
  }

  cancel(): void {
    this.mrGpxSyncService.action$.next(new ActionEvent());
  }

  append(): void {
    this.mrGpxSyncService.loading$.next(true);

    timer(25).subscribe(() => {
      if (this.appendMode.indexOf('append') !== -1) {
        this.mrGpxSyncService.appendTrack(this.newTrackFile.getTrack(), this.form.getRawValue().dt);
      } else {
        this.mrGpxSyncService.prependTrack(this.newTrackFile.getTrack(), this.form.getRawValue().dt);
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
