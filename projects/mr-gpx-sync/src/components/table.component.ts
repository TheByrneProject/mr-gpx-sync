import { Component, OnInit } from '@angular/core';

import { TrackPoint } from '../gpx/track-point';
import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { Settings } from '../gpx/settings';
import { TrackPointEvent } from '../events/track-point-event';
import { ActionEvent } from '../events/action-event';
import { TrackFile } from '../gpx/track-file';
import {
  MatCell,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderRow,
  MatRow,
  MatRowDef,
  MatTable
} from '@angular/material/table';
import { SecondsToTime } from '../pipes';
import { DecimalPipe } from '@angular/common';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'mr-gpx-sync-table-sync',
  template: `
    <div class="w-100 h-100 y-auto">
      <table mat-table [dataSource]="data" (contentChanged)="contentChanged()" class="flex-grow-1 w-100">
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef>ID</th>
          <td mat-cell *matCellDef="let element">{{ element.id }}</td>
        </ng-container>
        <ng-container matColumnDef="time">
          <th mat-header-cell *matHeaderCellDef>Time</th>
          <td mat-cell *matCellDef="let element">{{ element.t | secToTime : trackFile.getTrack().timeFormat }}</td>
        </ng-container>
        <ng-container matColumnDef="lonlat">
          <th mat-header-cell *matHeaderCellDef>Lon/Lat</th>
          <td mat-cell *matCellDef="let element">{{ element.lon | number : '1.1-6' }}
            , {{ element.lat | number : '1.1-6' }}
          </td>
        </ng-container>
        <ng-container matColumnDef="ele">
          <th mat-header-cell *matHeaderCellDef>Elevation ({{ settings.eleUnits }})</th>
          <td mat-cell *matCellDef="let element">{{ settings.getElevation(element.ele) | number : '1.0-1' }}</td>
        </ng-container>
        <ng-container matColumnDef="pace">
          <th mat-header-cell *matHeaderCellDef>Pace ({{ settings.paceUnits }})</th>
          <td mat-cell *matCellDef="let element">{{ settings.getPaceDisplay(element.v) }}</td>
        </ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let element">
            <div *ngIf="selectedPoint?.id !== element.id" style="width: 82px;"></div>
            <ng-container *ngIf="selectedPoint?.id === element.id">
              <button mat-raised-button color="primary" class="me-1" [matMenuTriggerFor]="actionMenu">Actions</button>
              <mat-menu #actionMenu="matMenu">
                <button mat-menu-item (click)="changeDt()">Change dt</button>
                <button mat-menu-item (click)="delete()">Delete</button>
                <button mat-menu-item (click)="interpolate()">Interpolate</button>
                <button mat-menu-item (click)="split()">Split</button>
                <button mat-menu-item (click)="updatePoint()">Update Point</button>
              </mat-menu>
            </ng-container>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row
            [id]="'table-p-' + row.id"
            *matRowDef="let row; columns: displayedColumns;"
            [class.selected]="selectedPoint?.id === row.id"
            (click)="selectRow(row)"
            style="background-color: {{getTrackPointBGColor(row)}}"></tr>
      </table>
    </div>
  `,
  imports: [
    MatTable,
    MatColumnDef,
    SecondsToTime,
    DecimalPipe,
    MatHeaderCell,
    MatCell,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatHeaderRow,
    MatRow,
    MatRowDef
  ],
  styles: [
    `
      #top-panel {
        height: 50%;
      }

      #table {
        height: 50%;
        overflow-y: auto;
      }
    `
  ]
})
export class TableComponent implements OnInit {

  trackFile: TrackFile = new TrackFile();
  data: TrackPoint[] = [];
  displayedColumns: string[] = ['id', 'time', 'lonlat', 'ele', 'pace', 'actions'];
  settings: Settings = new Settings();

  selectedPoint!: TrackPoint;

  MIN_RED_A: number = 0.1;
  MAX_RED_A: number = 0.5;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });

    this.mrGpxSyncService.action$.subscribe((action: ActionEvent) => {
      if (action.name) {
        if (action.name.indexOf('action-end-track') !== -1 || action.name === 'action-open-wizard') {
          this.trackFile = new TrackFile();
          this.data = [];
        }
      }
    });

    this.mrGpxSyncService.track$.subscribe((trackFile: TrackFile) => {
      this.trackFile = trackFile.loaded ? trackFile : new TrackFile();

      this.mrGpxSyncService.log('TableComponent.track$ Updated: n=' + this.trackFile.getTrack().trkPts.length);
      this.data = [...this.trackFile.getTrack().trkPts];
    });

    this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      if (e.source !== 'table' && e?.p) {
        this.scrollTo(e.p);
      }
      if (e?.p) {
        this.selectedPoint = e.p;
      }
    });
  }

  contentChanged(): void {
    this.mrGpxSyncService.log('TableComponent.contentChanged');
    this.mrGpxSyncService.loading$.next(false);
  }

  getTrackPointBGColor(p: TrackPoint): string {
    if (p.id === this.selectedPoint?.id) {
      return '';
    } else if (p.v > this.settings.slowThreshold && this.trackFile.getTrack().slowPts.length === 0) {
      return `rgba(255, 0, 0, 0.5)`;
    } else if (p.v > this.settings.slowThreshold && this.trackFile.getTrack().slowPts.length > 1) {
      const a: number = ((p.v - this.settings.slowThreshold) / (this.trackFile.getTrack().slowPts[0].v - this.settings.slowThreshold))
          * (this.MAX_RED_A - this.MIN_RED_A) + this.MIN_RED_A;
      return `rgba(255, 0, 0, ${a})`;
    } else {
      return 'transparent';
    }
  }

  selectRow(p: TrackPoint): void {
    this.mrGpxSyncService.selectedPoint$.next(new TrackPointEvent(p, 'table'));
  }

  scrollTo(p: TrackPoint): void {
    if (p) {
      let el: HTMLElement | null = document.getElementById('table-p-' + p.id);
      if (el) {
        el.scrollIntoView();
      }
    }
  }

  changeDt(): void {
    if (this.selectedPoint) {
      this.mrGpxSyncService.action$.next(new ActionEvent('action-change-dt', this.selectedPoint));
    } else {
      this.mrGpxSyncService.openSnackBar('No point selected!');
    }
  }

  delete(): void {
    if (this.selectedPoint) {
      this.mrGpxSyncService.delete([this.selectedPoint]);
    } else {
      this.mrGpxSyncService.openSnackBar('No point selected!');
    }
  }

  split(): void {
    if (this.selectedPoint) {
      this.mrGpxSyncService.action$.next(new ActionEvent('action-split', this.selectedPoint));
    } else {
      this.mrGpxSyncService.openSnackBar('No point selected!');
    }
  }

  interpolate(): void {
    if (this.selectedPoint) {
      this.mrGpxSyncService.interpolate(this.selectedPoint);
    } else {
      this.mrGpxSyncService.openSnackBar('No point selected!');
    }
  }

  updatePoint(): void {
    if (this.selectedPoint) {
      this.mrGpxSyncService.action$.next(new ActionEvent('action-update-point', this.selectedPoint));
    } else {
      this.mrGpxSyncService.openSnackBar('No point selected!');
    }
  }
}
