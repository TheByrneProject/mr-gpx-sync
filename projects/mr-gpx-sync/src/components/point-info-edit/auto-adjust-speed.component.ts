import { Component, EventEmitter, HostBinding, OnInit, OnDestroy, Output, ChangeDetectorRef } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MrGpxSyncService } from '../../services';
import { TrackFile, TrackPoint, TrackSeg, Settings } from '../../gpx';
import { SecondsToTime } from '../../pipes';
import { TrackPointEvent } from '../../events';

interface ReferencePoint {
  pointId: number;
  timestamp: number;
  distance: number; // Cumulative distance from start
}

@Component({
  selector: 'mr-gpx-sync-auto-adjust-speed',
  standalone: true,
  template: `
    <div class="d-flex flex-column gap-3 p-3">
      <div>
        <h5>Auto Adjust Speed</h5>
        <p class="small text-muted">Manually add reference points by selecting a point and clicking "Add Reference Point"</p>
      </div>

      <div class="selected-point-section">
        <div class="label mb-2">Currently Selected Point</div>
        @if (currentSelectedPoint) {
          <div class="selected-point-display">
            <div class="small mb-2">
              <div>Point #{{ currentSelectedPoint.id }} @ {{ (currentSelectedPointDistance | number: '1.2-2') }} km</div>
              <div>Time: {{ currentSelectedPoint.t | secToTime : 'hhmmss' }}</div>
            </div>
            <button class="btn btn-primary btn-sm" (click)="addCurrentPoint()" [disabled]="isPointAlreadyAdded()">
              <fa-icon [icon]="['fas', 'plus']"></fa-icon>
              Add Reference Point
            </button>
          </div>
        } @else {
          <div class="text-muted small">Click on a point in the map to select it, then click "Add Reference Point"</div>
        }
      </div>

      <div class="reference-points-container">
        <div class="label mb-2">Reference Points ({{ referencePoints.length }})</div>
        @if (referencePoints.length === 0) {
          <div class="text-muted small">No reference points selected yet.</div>
        }
        @for (ref of referencePoints; track ref.pointId; let i = $index) {
          <div class="d-flex gap-2 mb-2 align-items-center">
            <div class="flex-grow-1 small">
              Point {{ ref.pointId }} @ {{ (ref.distance | number: '1.2-2') }} km: {{ ref.timestamp | secToTime : 'hhmmss' }}
            </div>
            <input
              type="text"
              class="input time-input"
              [value]="formatTimeInput(ref.timestamp)"
              (change)="updateReferencePointTime(i, $event)"
              placeholder="HH:MM:SS">
            <button class="btn btn-sm btn-outline-danger" (click)="removeReferencePoint(i)">
              <fa-icon [icon]="['fas', 'trash']"></fa-icon>
            </button>
          </div>
        }
      </div>

      <div class="track-info">
        <div class="small">
          <div>Total Distance: <strong>{{ totalDistance | number: '1.2-2' }} km</strong></div>
          <div>Total Duration: <strong>{{ totalDuration | secToTime : 'hhmmss' }}</strong></div>
          <div>Target Pace: <strong>{{ targetPace | number: '1.2-2' }} min/km</strong></div>
          <div>Total Points: <strong>{{ totalPoints }}</strong></div>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-secondary btn-sm" (click)="cancel()">Cancel</button>
        <button class="btn btn-primary btn-sm" [disabled]="referencePoints.length < 1" (click)="process()">
          Process
        </button>
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
      font-size: 0.85rem;
    }

    .time-input {
      width: 4.5rem;
    }

    .selected-point-section {
      border: 2px solid rgba(100, 150, 255, 0.5);
      border-radius: 0.25rem;
      padding: 0.5rem;
      background: rgba(100, 150, 255, 0.1);
    }

    .selected-point-display {
      background: rgba(255, 255, 255, 0.8);
      padding: 0.5rem;
      border-radius: 0.25rem;
    }

    .reference-points-container {
      max-height: 250px;
      overflow-y: auto;
      border: 1px solid rgba(128, 128, 128, 0.3);
      border-radius: 0.25rem;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.5);
    }

    .track-info {
      border: 1px solid rgba(128, 128, 128, 0.3);
      border-radius: 0.25rem;
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.5);
    }

    h5 {
      margin-bottom: 0.5rem;
      font-size: 1rem;
    }

    .label {
      font-weight: 600;
      font-size: 0.9rem;
    }
  `],
  imports: [
    FaIconComponent,
    FormsModule,
    DecimalPipe,
    SecondsToTime
  ]
})
export class AutoAdjustSpeedComponent implements OnInit, OnDestroy {
  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column ww-600';
  @Output('cancel') cancelOutput = new EventEmitter<boolean>();

  referencePoints: ReferencePoint[] = [];
  currentSelectedPoint: TrackPoint | null = null;
  currentSelectedPointDistance: number = 0;
  originalTrackFile: TrackFile;
  trackFile: TrackFile;
  totalDistance: number = 0;
  totalDuration: number = 0;
  targetPace: number = 0;
  totalPoints: number = 0;
  private selectedPointSubscription: any;

  constructor(
    private mrGpxSyncService: MrGpxSyncService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.trackFile = this.mrGpxSyncService.getTrackFile();
    this.originalTrackFile = TrackFile.from(this.trackFile);

    const track = this.trackFile.getTrack();
    this.totalDistance = track.distance / 1000; // Convert to km
    this.totalDuration = track.duration;
    this.targetPace = (track.duration / 60.0) * (1.0 / track.distance) * 1000.0;
    this.totalPoints = track.trkPts.length;

    // Listen for point selections and just track the current selection
    this.selectedPointSubscription = this.mrGpxSyncService.selectedPoint$.subscribe((event: TrackPointEvent) => {
      if (event.p && event.p.length > 0) {
        const point = event.p[0] as TrackPoint;
        this.currentSelectedPoint = point;
        this.currentSelectedPointDistance = this.calculateCumulativeDistance(point.id);
        this.changeDetectorRef.markForCheck();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.selectedPointSubscription) {
      this.selectedPointSubscription.unsubscribe();
    }
  }

  isPointAlreadyAdded(): boolean {
    if (!this.currentSelectedPoint) {
      return false;
    }
    return this.referencePoints.some(ref => ref.pointId === this.currentSelectedPoint!.id);
  }

  addCurrentPoint(): void {
    if (this.currentSelectedPoint && !this.isPointAlreadyAdded()) {
      this.referencePoints.push({
        pointId: this.currentSelectedPoint.id,
        timestamp: this.currentSelectedPoint.t,
        distance: this.currentSelectedPointDistance
      });
      this.referencePoints.sort((a, b) => a.pointId - b.pointId);
      this.changeDetectorRef.markForCheck();
    }
  }

  private calculateCumulativeDistance(pointId: number): number {
    const track = this.trackFile.getTrack();
    let distance = 0;
    for (let i = 0; i < pointId && i < track.trkPts.length; i++) {
      distance += track.trkPts[i].dx;
    }
    return distance / 1000; // Convert to km
  }

  removeReferencePoint(index: number): void {
    this.referencePoints.splice(index, 1);
    this.changeDetectorRef.markForCheck();
  }

  formatTimeInput(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  parseTimeInput(timeStr: string): number {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseInt(parts[2], 10);
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  }

  updateReferencePointTime(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const newTimestamp = this.parseTimeInput(input.value);
    if (newTimestamp >= 0) {
      this.referencePoints[index].timestamp = newTimestamp;
    }
  }

  cancel(): void {
    this.mrGpxSyncService.setTrack(this.originalTrackFile);
    this.cancelOutput.emit(true);
  }

  process(): void {
    if (this.referencePoints.length < 1) {
      return;
    }

    const track = this.trackFile.getTrack();
    const points = track.trkPts;

    // Create a list of anchor points (start, reference points, end)
    const anchors: Array<{ pointId: number; timestamp: number }> = [
      { pointId: 0, timestamp: 0 }
    ];

    for (const ref of this.referencePoints) {
      anchors.push({ pointId: ref.pointId, timestamp: ref.timestamp });
    }

    anchors.push({ pointId: points.length - 1, timestamp: this.totalDuration });

    // Remove duplicates and sort
    const anchorMap = new Map<number, number>();
    for (const anchor of anchors) {
      anchorMap.set(anchor.pointId, anchor.timestamp);
    }

    const sortedAnchors = Array.from(anchorMap.entries())
      .map(([pointId, timestamp]) => ({ pointId, timestamp }))
      .sort((a, b) => a.pointId - b.pointId);

    // Adjust times between anchors
    for (let i = 0; i < sortedAnchors.length - 1; i++) {
      const startAnchor = sortedAnchors[i];
      const endAnchor = sortedAnchors[i + 1];

      this.adjustSegmentTimes(points, startAnchor.pointId, endAnchor.pointId, startAnchor.timestamp, endAnchor.timestamp);
    }

    // Remove points that are too close
    this.removeClosePoints(points);

    // Recalculate track
    track.resetIds();
    track.calcTrack();
    track.analyze(this.mrGpxSyncService.settings$.getValue());
    this.mrGpxSyncService.setTrackSeg(track);
    this.cancelOutput.emit(true);
  }

  private adjustSegmentTimes(
    points: TrackPoint[],
    startPointId: number,
    endPointId: number,
    startTime: number,
    endTime: number
  ): void {
    // Find actual indices in the points array
    let startIdx = -1;
    let endIdx = -1;

    for (let i = 0; i < points.length; i++) {
      if (points[i].id === startPointId) startIdx = i;
      if (points[i].id === endPointId) endIdx = i;
    }

    if (startIdx === -1 || endIdx === -1 || startIdx >= endIdx) {
      return;
    }

    // Calculate total distance in segment
    let totalDistance = 0;
    for (let i = startIdx; i < endIdx; i++) {
      totalDistance += points[i].dx;
    }

    if (totalDistance === 0) {
      // If no distance, distribute time evenly
      const timePerPoint = (endTime - startTime) / (endIdx - startIdx);
      for (let i = startIdx; i <= endIdx; i++) {
        points[i].t = startTime + (i - startIdx) * timePerPoint;
      }
      return;
    }

    // Target velocity for consistent speed
    const targetVelocity = (endTime - startTime) / totalDistance;

    // Assign times proportionally to distance
    points[startIdx].t = startTime;
    let currentTime = startTime;

    for (let i = startIdx; i < endIdx; i++) {
      const pointDistance = points[i].dx;
      const pointTime = pointDistance * targetVelocity;
      currentTime += pointTime;
      if (i < endIdx) {
        points[i + 1].t = Math.min(currentTime, endTime);
      }
    }

    // Ensure end point has the correct time
    points[endIdx].t = endTime;
  }

  private removeClosePoints(points: TrackPoint[]): void {
    let i = 0;
    while (i < points.length - 1) {
      const currentPoint = points[i];
      const nextPoint = points[i + 1];
      const timeDiff = Math.abs(nextPoint.t - currentPoint.t);

      // If points are less than 3 seconds apart, remove the next point
      if (timeDiff < 3 && i < points.length - 2) {
        points.splice(i + 1, 1);
      } else {
        i++;
      }
    }
  }
}

