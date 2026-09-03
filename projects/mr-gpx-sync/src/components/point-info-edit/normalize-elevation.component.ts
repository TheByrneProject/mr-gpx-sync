import { Component, EventEmitter, HostBinding, OnInit, Output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MrGpxSyncService } from '../../services';
import { TrackFile, Settings } from '../../gpx';
import { TrackPoint } from '../../gpx';

@Component({
  selector: 'mr-gpx-sync-normalize-elevation',
  standalone: true,
  template: `
    <div class="d-flex flex-column gap-3 p-2">
      <div>
        <div class="sm label">Current average elevation</div>
        <div class="mb-2 text-white">{{ averageElevationDisplay | number: '1.1-1' }} {{ settings.eleUnits }}</div>
      </div>

      <div>
        <div class="sm label">Normalize to ({{ settings.eleUnits }})</div>
        <input
          type="number"
          [value]="targetElevationDisplay"
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
      border: 1px solid rgba(255, 255, 255, 0.5);
      border-radius: 0.25rem;
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }
    .input::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
    .label {
      color: white;
      font-weight: 600;
    }
    .text-white {
      color: white;
    }
  `],
  imports: [DecimalPipe]
})
export class NormalizeElevationComponent implements OnInit {
  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column ww-400';
  @Output('cancel') cancelOutput = new EventEmitter<boolean>();

  originalTrackFile: TrackFile;
  settings: Settings = new Settings();
  
  // Store values in meters internally
  averageElevationMeters: number = 0;
  targetElevationMeters: number = 0;
  
  // Display values (converted to current units)
  averageElevationDisplay: number = 0;
  targetElevationDisplay: number = 0;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    const trackFile = this.mrGpxSyncService.getTrackFile();
    this.originalTrackFile = TrackFile.from(trackFile);
    
    // Get current settings
    this.settings = this.mrGpxSyncService.settings$.getValue();
    
    const points: TrackPoint[] = trackFile.getTrack().trkPts;
    if (!points || points.length === 0) {
      this.averageElevationMeters = 0;
      this.targetElevationMeters = 0;
      this.updateDisplayValues();
      return;
    }

    // Calculate average elevation in meters
    let totalElevation = 0;
    let validCount = 0;
    for (const point of points) {
      if (point && typeof point.ele === 'number' && !Number.isNaN(point.ele)) {
        totalElevation += point.ele;
        validCount++;
      }
    }

    if (validCount === 0) {
      console.warn('No valid elevation points found');
      this.averageElevationMeters = 0;
      this.targetElevationMeters = 0;
    } else {
      this.averageElevationMeters = totalElevation / validCount;
      this.targetElevationMeters = this.averageElevationMeters;
    }
    
    this.updateDisplayValues();
  }

  private updateDisplayValues(): void {
    // Convert meters to display units
    this.averageElevationDisplay = this.settings.getElevation(this.averageElevationMeters);
    this.targetElevationDisplay = this.settings.getElevation(this.targetElevationMeters);
  }

  setTargetElevation(event: Event): void {
    const input = event.target as HTMLInputElement;
    const displayValue = Number(input.value);
    if (!Number.isNaN(displayValue)) {
      // Convert from display units to meters
      this.targetElevationMeters = this.settings.setElevation(displayValue);
      this.targetElevationDisplay = displayValue;
    }
  }

  cancel(): void {
    this.mrGpxSyncService.setTrack(this.originalTrackFile);
    this.cancelOutput.emit(true);
  }

  save(): void {
    const trackSeg = this.mrGpxSyncService.getTrack();
    trackSeg.trkPts.forEach((point: TrackPoint) => {
      point.ele = Math.round(this.targetElevationMeters);
    });
    trackSeg.calcTrack();
    trackSeg.analyze(this.mrGpxSyncService.settings$.getValue());
    this.mrGpxSyncService.setTrackSeg(trackSeg);
    this.cancelOutput.emit(true);
  }
}
