import { Component, HostBinding, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';

import { Subscription, timer } from 'rxjs';
import { Moment } from 'moment';

import { Settings } from '../gpx/settings';
import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { ActionEvent } from '../events/action-event';
import { TrackFile } from '../gpx/track-file';
import { Track } from '../gpx/track';
import { TrackSeg } from '../gpx/track-seg';
import { Colors } from '../utils/colors';
import { calcPacePoint } from '../gpx/calc';
import { MatCheckbox } from '@angular/material/checkbox';
import { DecimalPipe } from '@angular/common';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardActions } from '@angular/material/card';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/input';

@Component({
  selector: 'mr-gpx-sync-open-wizard',
  imports: [
    ReactiveFormsModule,
    MatIcon,
    MatCheckbox,
    DecimalPipe,
    MatFormField,
    MatLabel,
    MatCard,
    MatCardActions,
    MatButton,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose
  ],
  template: `
    <div class="d-flex">
      <div class="action-title">Open Wizard</div>
      <mat-icon class="ms-auto me-0" (click)="openInfo()">info</mat-icon>
    </div>
    <div [formGroup]="form" class="mb-1 overflow-auto p-1 d-flex flex-column flex-grow-1">
      <ng-container *ngIf="trackFile && trackFile.tracks.length > 0">
        <ng-container *ngFor="let trk of trackFile.tracks; index as i;">
          <div class="d-flex flex-column">
            <mat-checkbox formControlName="trk-{{i}}" style="color: {{getColor(i, 0, 1)}};">{{ trk.name }}
            </mat-checkbox>
            <ng-container *ngFor="let trkSeg of trk.trkSegs; index as j;">
              <div class="d-flex flex-row ms-5 align-items-center">
                <mat-checkbox formControlName="trkseg-{{i}}-{{j}}"
                              (change)="showChanged($event, i, j)"
                              class="me-3"
                              style="color: {{getColor(i, j, trk.trkSegs.length)}};">Seg {{ j }}
                </mat-checkbox>
                <ng-container *ngIf="getTrkSegForm(i, j).value && !isLast(i, j)">
                  <mat-form-field class="" appearance="fill">
                    <mat-label>Time delta to next segment</mat-label>
                    <input type="number" matInput formControlName="dt-{{i}}-{{j}}" (change)="dtChanged($event, i, j)"/>
                  </mat-form-field>
                  <div>Pace: {{ pace['trkseg-' + i + '-' + j] | number : '1.0-1' }} {{ settings.paceUnits }}</div>
                </ng-container>
              </div>
            </ng-container>
          </div>
        </ng-container>
      </ng-container>
    </div>
    <mat-card>
      <mat-card-actions>
        <button mat-raised-button color="primary" (click)="cancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="open()"
                [disabled]="!form.valid">{{ appendMode ? (appendMode === 'append' ? 'Merge and Continue Append' : 'Merge and Continue Prepend') : 'Open' }}
        </button>
      </mat-card-actions>
    </mat-card>

    <ng-template #infoTemplate>
      <h1 mat-dialog-title>Info - Open Wizard</h1>
      <div mat-dialog-content>
        <div class="p-1 d-flex flex-column">
          <div>
            <span class="me-5"></span>This app generates a gpx with one track and one segment. If you open a file with
            multiple tracks and multiple
            segments, you will be expected to merge it.
          </div>
          <div>
            <span class="me-5"></span>The tracks and their segments will be ordered based upon the time of their first
            point.
            All will be selected by default. If the file contains other tracks you don't intend to import, then uncheck
            those.
          </div>
          <div>
            <span class="me-5"></span>The time delta between the last time of the segment and the first time of the next
            (selected) segment
            is provided in an input along with the pace. This time can be adjusted if it is too fast or slow. For
            example,
            if two segments were created because taking a break in recording, the time delta might be several minutes,
            but
            this can be adjusted to a few seconds to make the pace match how the video was edited together.
          </div>
          <div>
            <span class="me-5"></span>All tracks and segments are shown on the map. Each track is shown with a different
            color
            and each segment is shown in different shades of that color, the first being the brightest then getting
            darker.
          </div>
        </div>
      </div>
      <div mat-dialog-actions>
        <button mat-button [mat-dialog-close]="" cdkFocusInitial>Close</button>
      </div>
    </ng-template>
  `
})
export class OpenWizardComponent implements OnInit {

  @HostBinding('class') classes: string = 'd-flex flex-column w-100';

  @ViewChild('infoTemplate') infoTemplate!: TemplateRef<any>;

  settings!: Settings;
  trackFile!: TrackFile;

  form: FormGroup = new FormGroup({});
  pace: any = {};
  appendMode!: string;
  lastId: number = 0;
  subscription!: Subscription;

  constructor(private mrGpxSyncService: MrGpxSyncService,
              public dialog: MatDialog) {}

  ngOnInit(): void {
    this.mrGpxSyncService.log(`OpenWizardComponent.ngOnInit`);

    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });

    this.subscription = this.mrGpxSyncService.action$.subscribe((action: ActionEvent) => {
      /*if (this.lastId === action.data.trackFile.id) {
        this.mrGpxSyncService.log(`OpenWizardComponent.init.action.subscribe: TrackFile already loaded`);
        return;
      }
      action.data.trackFile.id = this.mrGpxSyncService.getId();*/

      this.mrGpxSyncService.log(`OpenWizardComponent.init.action.subscribe: append=${action.data?.appendMode}`);
      this.appendMode = action.data?.appendMode;
      this.trackFile = action.data?.trackFile;
      this.init();
      this.mrGpxSyncService.loading$.next(false);
    });
  }

  getName(name: string, i: number): string {
    return name + i.toString();
  }

  init(): void {
    if (!this.trackFile) {
      return;
    }
    this.mrGpxSyncService.log(`OpenWizardComponent.init: nTracks=${this.trackFile.tracks.length}`);

    this.trackFile.tracks.sort((a: Track, b: Track) => {
      let startTime: moment.Moment | undefined = a.getStartTime();
      if (startTime) {
        return startTime.isBefore(b.getStartTime()) ? -1 : 1;
      } else {
        return 0;
      }
    });

    this.form = new FormGroup({});
    for (let i = 0; i < this.trackFile.tracks.length; i++) {
      if (this.trackFile.tracks[i].name === 'untitled') {
        this.trackFile.tracks[i].name = 'Track ' + i;
      }
      this.trackFile.tracks[i].trkSegs.sort((a: TrackSeg, b: TrackSeg) => {
        return a.getStartTime().isBefore(b.getStartTime()) ? -1 : 1;
      });

      this.form.addControl('trk-' + i, new FormControl(true));

      for (let j = 0; j < this.trackFile.tracks[i].trkSegs.length; j++) {
        this.form.addControl('trkseg-' + i + '-' + j, new FormControl(true));
        this.pace['trkseg-' + i + '-' + j] = '';
      }
    }
    for (let i = 0; i < this.trackFile.tracks.length; i++) {
      for (let j = 0; j < this.trackFile.tracks[i].trkSegs.length; j++) {
        let dt = 0;
        const ij2: number[] | undefined = this.getNextVisible(this.trackFile, i, j);
        if (ij2) {
          const next = this.trackFile.tracks[ij2[0]].trkSegs[ij2[1]];
          const startTime = next.getStartTime();
          const prev = this.trackFile.tracks[i].trkSegs[j];
          dt = startTime.diff(prev.getEndTime(), 's');
          this.pace['trkseg-' + i + '-' + j] = calcPacePoint(dt, prev.getEnd().point, next.getStart().point);
        }
        this.form.addControl('dt-' + i + '-' + j, new FormControl(dt));
      }
    }

    this.form.valueChanges.subscribe((values) => {
      this.updateFormValues(values);
    });
  }

  getNextSegmentStartTime(trackFile: TrackFile, i: number, j: number): moment.Moment | undefined {
    do {
      j = j + 1;
      if (j === trackFile.tracks[i].trkSegs.length) {
        i = i + 1;
        if (i === trackFile.tracks.length) {
          return undefined;
        }
        j = 0;
      }
      try {
        const show = this.form.get('trkseg-' + i + '-' + j)?.value;
        if (show) {
          return trackFile.tracks[i].trkSegs[j].getStartTime();
        } else {
          continue;
        }
      } catch (error) {
        return undefined;
      }
    } while (true);
  }

  updateFormValues(values: any): void {
    if (!this.trackFile) {
      return;
    }
    for (let i = 0; i < this.trackFile.tracks.length; i++) {
      let formControl = this.form.get('trk-' + i);
      if (formControl && !formControl.value) {
        for (let j = 0; j < this.trackFile.tracks[i].trkSegs.length; j++) {
          if (this.form.get('trkseg-' + i + '-' + j)?.value) {
            formControl = this.form.get('trkseg-' + i + '-' + j);
            if (formControl) {
              formControl.setValue(false);
            }
            formControl = this.form.get('dt-' + i + '-' + j);
            if (formControl) {
              formControl.setValue(0);
            }
          }
        }
      }
    }
  }

  getColor(i: number, j: number, J: number): string {
    const c: number[] = Colors.getColor(i, j, J);
    return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
  }

  dtChanged(v: any, i: number, j: number): void {
    const next: number[] | undefined = this.getNextVisible(this.trackFile, i, j);
    let formControl = this.form.get(`dt-${i}-${j}`);
    if (formControl && next) {
      this.pace[`trkseg-${i}-${j}`] = calcPacePoint(formControl.value,
        this.trackFile.tracks[i].trkSegs[j].getEnd().point,
        this.trackFile.tracks[next[0]].trkSegs[next[1]].getStart().point);
    }
  }

  showChanged(v: any, i: number, j: number): void {
    if (v.checked) {
      // Set previous dt and dt for this point
      const prev: number[] | undefined = this.getPreviousVisible(this.trackFile, i, j);
      if (prev) {
        const endTime: Moment = this.trackFile.tracks[prev[0]].trkSegs[prev[1]].getEndTime();
        this.getDtForm(prev[0], prev[1]).setValue(this.trackFile.tracks[i].trkSegs[j].getStartTime().diff(endTime, 's'));
      }
      const next: number[] | undefined = this.getNextVisible(this.trackFile, i, j);
      if (next) {
        const startTime: Moment = this.trackFile.tracks[next[0]].trkSegs[next[1]].getStartTime();
        this.getDtForm(i, j).setValue(startTime.diff(this.trackFile.tracks[i].trkSegs[j].getEndTime(), 's'));
      }
    } else {
      // Set previous dt for next point and 0 this point
      this.getDtForm(i, j).setValue(0);

      const prev: number[] | undefined = this.getPreviousVisible(this.trackFile, i, j);
      if (prev) {
        const endTime: Moment = this.trackFile.tracks[prev[0]].trkSegs[prev[1]].getEndTime();
        const next: number[] | undefined = this.getNextVisible(this.trackFile, i, j);
        if (next) {
          const startTime: Moment = this.trackFile.tracks[next[0]].trkSegs[next[1]].getStartTime();
          this.getDtForm(prev[0], prev[1]).setValue(startTime.diff(endTime, 's'));
        }
      }
    }
  }

  getDtForm(i: number, j: number): FormControl {
    return this.form.get('dt-' + i + '-' + j) as FormControl;
  }

  getTrkSegForm(i: number, j: number): FormControl {
    return this.form.get('trkseg-' + i + '-' + j) as FormControl;
  }

  getPreviousVisible(trackFile: TrackFile, i: number, j: number): [number, number] | undefined {
    do {
      j = j - 1;
      if (j === -1) {
        i = i - 1;
        if (i === -1) {
          return undefined;
        }
        j = trackFile.tracks[i].trkSegs.length - 1;
      }

      try {
        const show = this.getTrkSegForm(i, j).value;
        if (show) {
          return [i, j];
        } else {
          continue;
        }
      } catch (error) {
        return undefined;
      }
    } while (true);
  }

  getNextVisible(trackFile: TrackFile, i: number, j: number): [number, number] | undefined {
    do {
      j = j + 1;
      if (j === trackFile.tracks[i].trkSegs.length) {
        i = i + 1;
        if (i === trackFile.tracks.length) {
          return undefined;
        }
        j = 0;
      }
      try {
        const show = this.getTrkSegForm(i, j).value;
        if (show) {
          return [i, j];
        } else {
          continue;
        }
      } catch (error) {
        return undefined;
      }
    } while (true);
  }

  isLast(i: number, j: number): boolean {
    return i === this.trackFile.tracks.length - 1 && j === this.trackFile.tracks[i].trkSegs.length - 1;
  }

  cancel(): void {
    this.mrGpxSyncService.action$.next(new ActionEvent());
  }

  open(): void {
    this.mrGpxSyncService.loading$.next(true);

    timer(25).subscribe(() => {
      if (this.appendMode) {
        this.mrGpxSyncService.action$.next(new ActionEvent(
          this.appendMode + '-track', {trackFile: this.mrGpxSyncService.mergeTrackFile(this.trackFile, this.form.getRawValue())}));
      } else {
        this.mrGpxSyncService.openTrackFile(this.mrGpxSyncService.mergeTrackFile(this.trackFile, this.form.getRawValue()));
        this.mrGpxSyncService.action$.next(new ActionEvent());
      }
    });
  }

  openInfo(): void {
    const dialogRef = this.dialog.open(this.infoTemplate, {
      minWidth: '50vw'
    });
    dialogRef.afterClosed().subscribe();
  }
}
