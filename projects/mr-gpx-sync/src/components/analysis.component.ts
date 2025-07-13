import { Component, HostBinding, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { TrackPoint } from '../gpx/track-point';
import { Settings } from '../gpx/settings';
import { TrackPointEvent } from '../events/track-point-event';
import { TrackFile } from '../gpx/track-file';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell, MatHeaderCellDef,
  MatHeaderRow,
  MatRow, MatRowDef,
  MatTable
} from '@angular/material/table';
import { SecondsToTime } from '../pipes';
import { setFormValue } from '../forms/form-utils';
import { MatFormField, MatLabel } from '@angular/material/input';

@Component({
  selector: 'mr-gpx-sync-analysis-sync',
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatCell,
    SecondsToTime,
    MatHeaderRow,
    MatRow,
    MatCellDef,
    MatHeaderCellDef,
    MatRowDef
  ],
  template: `
    <form [formGroup]="form" class="d-flex align-items-center justify-content-between">
      <div class="label">Slowest Points</div>
      <mat-form-field class="" appearance="fill">
        <mat-label>Pace Threshold ({{ settings.paceUnits }})</mat-label>
        <input type="number" matInput formControlName="slowThreshold"/>
      </mat-form-field>
    </form>
    <div class="flex-grow-1 y-auto">
      <table mat-table [dataSource]="slowPoints" class="w-100">
        <ng-container matColumnDef="time">
          <th mat-header-cell *matHeaderCellDef>Time</th>
          <td mat-cell *matCellDef="let element">{{ element.t | secToTime : track.getTrack().timeFormat }}</td>
        </ng-container>
        <ng-container matColumnDef="pace">
          <th mat-header-cell *matHeaderCellDef>Pace {{ settings.paceUnits }}</th>
          <td mat-cell *matCellDef="let element">{{ settings.getPaceDisplay(element.v) }}</td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row
            [id]="'analysis-p-' + row.id"
            *matRowDef="let row; columns: displayedColumns;"
            [class.selected]="selectedPoint?.id === row.id"
            (click)="selectRow(row)"></tr>
      </table>
    </div>
  `
})
export class AnalysisComponent implements OnInit {

  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column h-100 p-1';

  track: TrackFile = new TrackFile();
  slowPoints: TrackPoint[] = [];
  displayedColumns: string[] = ['time', 'pace'];

  selectedPoint!: TrackPoint;
  settings!: Settings;

  form: FormGroup = new FormGroup({
    slowThreshold: new FormControl('', [Validators.required, Validators.min(1)])
  });

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      if (!this.settings) {
        this.settings = settings;
        setFormValue(this.form, 'slowThreshold', this.settings.getPace(settings.slowThreshold).toPrecision(3));
      }
    });

    this.mrGpxSyncService.track$.subscribe((track: TrackFile) => {
      this.track = track;
      this.slowPoints = track.getTrack().slowPts;
    });

    this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      if (e.source !== 'analysis' && e?.p) {
        this.scrollTo(e.p);
      }
      if (e?.p) {
        this.selectedPoint = e.p;
      }
    });

    this.form.valueChanges.subscribe((value: any) => {
      if (value
          && value.slowThreshold
          && (this.settings.paceMinPer ? value.slowThreshold > this.track.getTrack().v : value.slowThreshold < this.track.getTrack().v)
          && value.slowThreshold > 0.0
          && value.slowThreshold < 100.0) {
        this.settings.slowThreshold = this.settings.setPace(value.slowThreshold);
        this.track.getTrack().analyze(this.settings);
        this.slowPoints = this.track.getTrack().slowPts;
        this.mrGpxSyncService.settings$.next(this.settings);
      }
    });
  }

  selectRow(p: TrackPoint): void {
    this.selectedPoint = p;
    this.mrGpxSyncService.selectedPoint$.next(new TrackPointEvent(p, 'analysis'));
  }

  scrollTo(p: TrackPoint): void {
    if (p) {
      const e = document.getElementById('analysis-p-' + p.id);
      if (e) {
        e.scrollIntoView();
      }
    }
  }
}
