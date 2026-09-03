import { Component, HostBinding, OnInit, EventEmitter, Output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { DecimalPipe } from '@angular/common';
import { SecondsToTime } from '../../pipes';
import { Settings, TrackFile } from '../../gpx';
import { MrGpxSyncService } from '../../services';
import { TrackEvent } from '../../events';

@Component({
  selector: 'mr-gpx-sync-track-info-view',
  standalone: true,
  template: `
    <div class="d-flex flex-column h-100">
      <div class="d-flex justify-content-between align-items-center p-2 border-bottom">
        <div class="label">Track Information</div>
        <button class="btn btn-ghost sm" (click)="showEdit.emit()" title="Edit track">
          <fa-icon [icon]="['fas', 'pencil']" size="sm"></fa-icon>
        </button>
      </div>
      <div class="flex-grow-1 d-flex flex-column gap-2 p-2">
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Name</div>
          <div class="xs">{{ track.fileName }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Total Distance</div>
          <div class="xs">{{ getDistance() | number: '1.2-2' }} {{ settings.distanceUnits }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Total Time</div>
          <div class="xs">{{ getDuration() | secToTime : 'hhmmss' }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Avg Velocity</div>
          <div class="xs">{{ getAvgVelocity() | number: '1.2-2' }} {{ settings.paceUnits }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Total Points</div>
          <div class="xs">{{ getTotalPoints() }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Min Elevation</div>
          <div class="xs">{{ settings.getElevationAsDisplay(getMinElevation()) }} {{ '(' + settings.eleUnits + ')' }}</div>
        </div>
        <div class="d-flex p-2">
          <div class="w-25 align-items-center xs label">Max Elevation</div>
          <div class="xs">{{ settings.getElevationAsDisplay(getMaxElevation()) }} {{ '(' + settings.eleUnits + ')' }}</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .label {
      min-width: 5rem;
      font-weight: 600;
      color: white;
    }
    .border-bottom {
      border-bottom: 1px solid rgba(255, 255, 255, 0.3);
    }
    .xs {
      color: white;
    }
    .btn-ghost {
      color: white;
    }
  `],
  imports: [SecondsToTime, FaIconComponent, DecimalPipe]
})
export class TrackInfoViewComponent implements OnInit {
  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column';
  @Output() showEdit = new EventEmitter<void>();

  track: TrackFile = new TrackFile();
  settings: Settings = new Settings();

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.track$.subscribe((event: TrackEvent) => {
      this.track = event.track;
    });
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }

  getDistance(): number {
    const track = this.track.getTrack();
    return this.settings.metric ? track.distance / 1000 : track.distance / 1609.34;
  }

  getDuration(): number {
    return this.track.getTrack().duration;
  }

  getAvgVelocity(): number {
    const track = this.track.getTrack();
    if (track.duration === 0) return 0;
    const distanceMeters = track.distance;
    const durationSeconds = track.duration;
    // Return pace in minutes per km (or per mile)
    if (this.settings.metric) {
      return (durationSeconds / 60.0) * (1.0 / distanceMeters) * 1000.0;
    } else {
      return (durationSeconds / 60.0) * (1.0 / distanceMeters) * 1609.34;
    }
  }

  getTotalPoints(): number {
    return this.track.getTrack().trkPts.length;
  }

  getMinElevation(): number {
    const track = this.track.getTrack();
    if (track.trkPts.length === 0) return 0;
    return Math.min(...track.trkPts.map(p => p.ele));
  }

  getMaxElevation(): number {
    const track = this.track.getTrack();
    if (track.trkPts.length === 0) return 0;
    return Math.max(...track.trkPts.map(p => p.ele));
  }
}
