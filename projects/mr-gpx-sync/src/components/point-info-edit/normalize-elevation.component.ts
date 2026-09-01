import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { MrGpxSyncService } from '../../services';
import { TrackFile } from '../../gpx/track-file';
import { TrackPoint } from '../../gpx';
import { ActionEvent } from '../../events/action-event';

@Component({
  selector: 'mr-gpx-sync-normalize-elevation',
  standalone: true,
  template: `
    <div class="d-flex flex-column gap-3 p-2">
      <div>
        <div class="sm label">Current average elevation</div>
        <div class="mb-2">{{ averageElevation }} m</div>
      </div>

      <div>
        <div class="sm label">Normalize to</div>
        <input
          type="number"
          [value]="targetElevation"
          (input)="setTargetElevation($event)"
          class="input">
      </div>

      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-secondary btn-sm" (click)="cancel()">Cancel</button>
        <button class="btn btn-primary btn-sm" (click)="save()">Save</button>
      </div>
    </div>
  `,
  styles: [`
    .input {
      width: 6rem;
      padding: 0.35rem 0.5rem;
      border: 1px solid rgba(128, 128, 128, 0.5);
      border-radius: 0.25rem;
      background: rgba(255, 255, 255, 0.9);
    }
  `]
})
export class NormalizeElevationComponent implements OnInit {
  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column ww-400';
  @Output('cancel') cancelOutput = new EventEmitter<boolean>();

  originalTrackFile: TrackFile;
  averageElevation: number = 0;
  targetElevation: number = 0;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    const trackFile = this.mrGpxSyncService.getTrackFile();
    this.originalTrackFile = TrackFile.from(trackFile);
    const points: TrackPoint[] = trackFile.getTrack().trkPts;
    if (points.length === 0) {
      this.averageElevation = 0;
      this.targetElevation = 0;
      return;
    }

    const totalElevation = points.reduce((sum: number, point: TrackPoint) => sum + point.ele, 0);
    this.averageElevation = Math.round(totalElevation / points.length);
    this.targetElevation = this.averageElevation;
  }

  setTargetElevation(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (!Number.isNaN(value)) {
      this.targetElevation = Math.round(value);
    }
  }

  cancel(): void {
    this.mrGpxSyncService.setTrack(this.originalTrackFile);
    this.cancelOutput.emit(true);
  }

  save(): void {
    const trackSeg = this.mrGpxSyncService.getTrack();
    trackSeg.trkPts.forEach((point: TrackPoint) => {
      point.ele = this.targetElevation;
    });
    trackSeg.calcTrack();
    trackSeg.analyze(this.mrGpxSyncService.settings$.getValue());
    this.mrGpxSyncService.setTrackSeg(trackSeg);
    this.cancelOutput.emit(true);
  }
}
