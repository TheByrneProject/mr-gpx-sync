import { Component, EventEmitter, HostBinding, OnDestroy, OnInit, Output } from '@angular/core';
import { MrGpxSyncService } from '../../services';
import { TrackSeg, TrackPoint } from '../../gpx';
import { Subscription } from 'rxjs';
import { ActionEvent } from '../../events/action-event';
import { calcDistance, calcPace } from '../../gpx/calc';
import { MrGpxSyncD3Map } from '../gpx/d3-map.component';
import { Settings } from '../../gpx/settings';
import { TrackFile } from '../../gpx/track-file';
import { DecimalPipe } from '@angular/common';
import Point from 'ol/geom/Point';

@Component({
  selector: 'mr-gpx-sync-draw-track',
  standalone: true,
  template: `
    <div class="d-flex flex-column ww-600">
      <div class="d-flex p-2">
        <div class="w-50">
          <mr-gpx-sync-d3-map style="height:400px"></mr-gpx-sync-d3-map>
        </div>
        <div class="w-50 p-2 d-flex flex-column">
          <div class="sm label">Old Distance</div>
          <div class="mb-2">{{ oldDistance | number:'1.0-2' }} m</div>
          <div class="sm label">New Distance</div>
          <div class="mb-2">{{ newDistance | number:'1.0-2' }} m</div>
          <div class="sm label">Old Pace</div>
          <div class="mb-2">{{ oldPaceDisplay }}</div>
          <div class="sm label">New Pace</div>
          <div class="mb-2">{{ newPaceDisplay }}</div>

          <div class="mt-auto d-flex justify-content-end gap-2">
            <button class="btn btn-secondary btn-sm" (click)="cancel()">Cancel</button>
            <button class="btn btn-primary btn-sm" (click)="save()">Save</button>
          </div>
        </div>
      </div>
    </div>
  `,
  imports: [DecimalPipe, MrGpxSyncD3Map]
})
export class DrawTrackComponent implements OnInit, OnDestroy {

  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column ww-600';
  @Output('cancel') cancelOutput = new EventEmitter<boolean>();

  settings: Settings;
  actionSub: Subscription;
  selSub: Subscription;

  originalTrackFile: TrackFile;
  workingSeg: TrackSeg;
  startPointId: number = 0;
  startPoint!: TrackPoint;
  endPoint!: TrackPoint;
  segmentDuration: number = 0;

  oldDistance: number = 0;
  newDistance: number = 0;
  oldPaceDisplay: string = '';
  newPaceDisplay: string = '';

  newPoints: TrackPoint[] = [];

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.selSub = this.mrGpxSyncService.selectedPoint$.subscribe((e: any) => {
      if (e.p?.length > 0) {
        const p = e.p[0] as TrackPoint;
        this.startPointId = p.id;
        this.startPoint = p;
        this.originalTrackFile = TrackFile.from(this.mrGpxSyncService.getTrackFile());
        this.workingSeg = TrackSeg.from(this.mrGpxSyncService.getTrack());
        this.endPoint = this.workingSeg.get(this.startPointId + 1) as TrackPoint;
        if (!this.endPoint) {
          throw new Error('Draw track requires a selected point with a following track point.');
        }

        this.segmentDuration = this.endPoint.date.diff(this.startPoint.date, 'second');
        this.oldDistance = calcDistance(this.startPoint.lon, this.startPoint.lat, this.endPoint.lon, this.endPoint.lat);
        this.newDistance = this.oldDistance;
        this.oldPaceDisplay = this.mrGpxSyncService.settings$.getValue().getPaceDisplay(calcPace(this.segmentDuration, this.oldDistance));
        this.newPaceDisplay = this.oldPaceDisplay;
        this.newPoints = [];
        this.mrGpxSyncService.action$.next(new ActionEvent('clear-overlay'));
      }
    });

    this.actionSub = this.mrGpxSyncService.action$.subscribe((action: ActionEvent) => {
      if (action.name === 'map-click' && this.startPoint && this.endPoint) {
        const lon = action.data.lon;
        const lat = action.data.lat;
        const np: TrackPoint = new TrackPoint();
        np.lon = lon;
        np.lat = lat;
        np.ele = this.startPoint.ele;
        np.point = new Point([lon, lat]);

        this.newPoints.push(np);

        const fullPath = this.buildDrawPath();
        this.newDistance = this.computeDistance(fullPath);
        const newPace = calcPace(this.segmentDuration, this.newDistance);
        this.newPaceDisplay = this.mrGpxSyncService.settings$.getValue().getPaceDisplay(newPace);

        this.mrGpxSyncService.action$.next(new ActionEvent('draw-overlay', { points: fullPath }));
      }
    });
  }

  buildDrawPath(): TrackPoint[] {
    return [this.startPoint, ...this.newPoints, this.endPoint];
  }

  computeMergedPoints(): TrackPoint[] {
    const original = this.workingSeg.trkPts.slice();
    const insertAt = this.startPointId + 1;
    const before = original.slice(0, insertAt);
    const after = original.slice(insertAt + 1);
    return [...before, ...this.newPoints, this.endPoint, ...after];
  }

  computeDistance(points: TrackPoint[]): number {
    let d = 0;
    for (let i = 0; i < points.length - 1; i++) {
      d += calcDistance(points[i].lon, points[i].lat, points[i + 1].lon, points[i + 1].lat);
    }
    return d;
  }

  interpolateDrawnTrack(intervalSeconds: number): TrackPoint[] {
    const path = this.buildDrawPath();
    if (path.length < 2 || this.segmentDuration <= 0) {
      return [];
    }

    const segmentLengths: number[] = [];
    let totalDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const segment = calcDistance(path[i].lon, path[i].lat, path[i + 1].lon, path[i + 1].lat);
      segmentLengths.push(segment);
      totalDistance += segment;
    }

    if (totalDistance <= 0) {
      return [];
    }

    const lastTime = Math.max(this.segmentDuration - intervalSeconds, intervalSeconds);
    const times: number[] = [];
    for (let t = intervalSeconds; t <= lastTime; t += intervalSeconds) {
      times.push(t);
    }
    if (times.length === 0 && lastTime > 0) {
      times.push(lastTime);
    } else if (times.length > 0 && times[times.length - 1] < lastTime) {
      times.push(lastTime);
    }

    const cumulativeDistances = [0];
    let cumulative = 0;
    for (let len of segmentLengths) {
      cumulative += len;
      cumulativeDistances.push(cumulative);
    }

    const interpolated: TrackPoint[] = [];
    for (const time of times) {
      const targetDistance = (time / this.segmentDuration) * totalDistance;
      let segmentIndex = 0;
      while (segmentIndex < segmentLengths.length - 1 && cumulativeDistances[segmentIndex + 1] < targetDistance) {
        segmentIndex++;
      }

      const segmentStart = path[segmentIndex];
      const segmentEnd = path[segmentIndex + 1];
      const segmentStartDistance = cumulativeDistances[segmentIndex];
      const localDistance = targetDistance - segmentStartDistance;
      const segmentLength = segmentLengths[segmentIndex];
      const fraction = segmentLength > 0 ? localDistance / segmentLength : 0;

      const lon = segmentStart.lon + (segmentEnd.lon - segmentStart.lon) * fraction;
      const lat = segmentStart.lat + (segmentEnd.lat - segmentStart.lat) * fraction;
      const ele = segmentStart.ele + (segmentEnd.ele - segmentStart.ele) * fraction;
      const date = this.startPoint.date.add(time, 'second');

      const np = new TrackPoint();
      np.lon = lon;
      np.lat = lat;
      np.ele = ele;
      np.date = date;
      np.point = new Point([lon, lat]);
      interpolated.push(np);
    }

    return interpolated;
  }

  cancel(): void {
    this.mrGpxSyncService.setTrack(this.originalTrackFile);
    this.mrGpxSyncService.action$.next(new ActionEvent('clear-overlay'));
    this.cancelOutput.emit(true);
  }

  save(): void {
    if (!this.startPoint || !this.endPoint) {
      return;
    }

    const interpolated = this.interpolateDrawnTrack(8);
    const originalPoints = this.workingSeg.trkPts.slice();
    const before = originalPoints.slice(0, this.startPointId + 1);
    const after = originalPoints.slice(this.startPointId + 1);

    this.workingSeg.trkPts = [...before, ...interpolated, ...after];
    this.workingSeg.resetIds();
    this.workingSeg.calcTrack();
    this.workingSeg.analyze(this.mrGpxSyncService.settings$.getValue());
    this.mrGpxSyncService.setTrackSeg(this.workingSeg);
    this.mrGpxSyncService.action$.next(new ActionEvent('clear-overlay'));
    this.cancelOutput.emit(true);
  }

  ngOnDestroy(): void {
    if (this.actionSub) { this.actionSub.unsubscribe(); }
    if (this.selSub) { this.selSub.unsubscribe(); }
    this.mrGpxSyncService.action$.next(new ActionEvent('clear-overlay'));
  }
}
