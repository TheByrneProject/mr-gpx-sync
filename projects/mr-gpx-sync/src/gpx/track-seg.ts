
import Point from 'ol/geom/Point';
import { Dayjs } from 'dayjs';

import { TrackPoint } from './track-point';
import { TrackElement } from './track-element';
import { calcDistance, calcPace } from './calc';
import { GpxEvent } from '../events/gpx-event';
import { secondsToTime } from '../pipes/sec-to-time';
import { Settings } from './settings';

export class TrackSeg {

  trkPts: TrackPoint[] = [];
  slowPts: TrackPoint[] = [];

  eleGain: number = 0;
  eleLoss: number = 0;
  duration: number = 0;
  durationDisplay: string = '00:00';
  distance: number = 0;
  v: number = 0;
  minV: number = 0;
  maxV: number = 0;

  timeFormat: string = 'mm:ss';
  droppedPoints: number = 0;

  static from(old: TrackSeg): TrackSeg {
    const track: TrackSeg = new TrackSeg();
    track.eleGain = old.eleGain;
    track.eleLoss = old.eleLoss;
    track.duration = old.duration;
    track.durationDisplay = old.durationDisplay;
    track.distance = old.distance;
    track.v = old.v;
    track.timeFormat = old.timeFormat;
    track.droppedPoints = old.droppedPoints;
    track.minV = old.minV;
    track.maxV = old.maxV;

    track.trkPts = [];
    for (let o of old.trkPts) {
      track.trkPts.push(TrackPoint.from(o));
    }
    track.slowPts = [];
    for (let s of old.slowPts) {
      track.slowPts.push(TrackPoint.from(s));
    }
    return track;
  }

  parseTrkSeg(trkSeg: Element): void {
    let e1: TrackElement;
    let e2: TrackElement;
    let trkPt: Element | null;
    let nextPt: Element | null;

    let lastDupliate: boolean = false;
    let startPoint: TrackPoint = new TrackPoint();

    for (let i = 0; i < trkSeg.children.length - 1; i++) {
      trkPt = trkSeg.children.item(i);
      nextPt = trkSeg.children.item(i + 1);
      if (!trkPt || !nextPt) {
        throw new Error('No trkseg[i] or trkseg[i+1] found!');
      }

      try {
        e1 = TrackElement.createFromElement(trkPt);
        e2 = TrackElement.createFromElement(nextPt);
      } catch (error: any) {
        throw new Error(error.message);
      }

      while (e1.lon === e2.lon && e1.lat === e2.lat && i < trkSeg.children.length - 2) {
        this.droppedPoints++;
        i++;
        e2 = TrackElement.createFromElement(trkSeg.children.item(i + 1));
      }
      if (e1.lon === e2.lon && e1.lat === e2.lat && i === trkSeg.children.length - 2) {
        this.droppedPoints++;
        lastDupliate = true;
      }

      this.trkPts.push(TrackPoint.createFromTrackElement(e1, i));
      if (i === 0) {
        startPoint = this.trkPts[0];
      }
    }

    // Last Point
    e1 = TrackElement.createFromElement(trkSeg.children.item(trkSeg.children.length - 1));
    if (lastDupliate) {
      this.getEnd().date = e1.date;
    } else {
      this.trkPts.push(TrackPoint.createFromTrackElement(e1, trkSeg.children.length - 1));
    }

    this.resetIds();
    this.calcTrack();
  }

  resetIds(): void {
    for (let i = 0; i < this.trkPts.length; i++) {
      this.trkPts[i].id = i;
    }
  }

  /**
   * With the date, lat, lon and ele set, do the basic calculations per track point.
   */
  calcTrack(): void {
    const p0: TrackPoint = this.trkPts[0];
    let p1: TrackPoint;
    let p2: TrackPoint;
    let dx: number;
    let dt: number;
    let de: number;

    this.eleGain = 0;
    this.eleLoss = 0;
    this.distance = 0;

    for (let i = 0; i < this.trkPts.length - 1; i++) {
      p1 = this.trkPts[i];
      p2 = this.trkPts[i + 1];

      de = p2.ele - p1.ele;
      if (de > 0) {
        this.eleGain += de;
      } else if (de < 0) {
        this.eleLoss += de;
      }
      dx = calcDistance(p1.lon, p1.lat, p2.lon, p2.lat);
      if (Number.isNaN(dx)) {
        this.trkPts.splice(i, 1);
        i--;
        continue;
      }
      this.distance += dx;
      dt = p2.date.diff(p1.date, 'second');

      p1.t = i === 0 ? 0 : p1.date.diff(p0.date, 'second');
      p1.dx = dx;
      p1.dt = dt;
      p1.v = calcPace(dt, dx);

      if (p1.v < this.minV) {
        this.minV = p1.v;
      }
      if (p1.v > this.maxV) {
        this.maxV = p1.v;
      }

      console.log(p1.t + ' ' + p1.dx + ' ' + p1.dt + ' ' + p1.v);
    }

    // The last point of the track has a zero delta for time and distance.
    this.trkPts[this.trkPts.length - 1].t = this.trkPts[this.trkPts.length - 1].date.diff(p0.date, 'second');

    this.setDuration(this.trkPts[this.trkPts.length - 1].date.diff(p0.date, 'second'));
  }

  analyze(props: Settings): void {
    this.slowPts = [];

    for (const p of this.trkPts) {
      if (p.v > props.slowThreshold) {
        this.slowPts.push(p);
      }
    }

    this.slowPts.sort((a: TrackPoint, b: TrackPoint) => {
      return b.v - a.v;
    });
  }

  setDuration(duration: number): void {
    this.duration = duration;
    this.timeFormat = this.duration > 3600 ? 'hhmmss' : 'mmss';
    this.durationDisplay = secondsToTime(this.duration, this.timeFormat);
    this.v = (this.duration / 60.0) * (1.0 / this.distance) * 1000.0;
  }

  isEmpty(): boolean {
    return this.trkPts.length > 1;
  }

  getStartTime(): Dayjs {
    return this.trkPts[0].date;
  }

  getEndTime(): Dayjs {
    return this.trkPts[this.trkPts.length - 1].date;
  }

  get(id: number): TrackPoint | undefined {
    return this.trkPts.find((p: TrackPoint) => p.id === id);
  }

  getPrevious(p: TrackPoint): TrackPoint | undefined {
    const i: number = this.trkPts.findIndex((e: TrackPoint) => e.id === p.id);
    return i === 0 ? undefined : this.trkPts[i - 1];
  }

  getNext(p: TrackPoint): TrackPoint | undefined {
    const i: number = this.trkPts.findIndex((e: TrackPoint) => e.id === p.id);
    return i === this.trkPts.length - 1 ? undefined : this.trkPts[i + 1];
  }

  getStart(): TrackPoint {
    return this.trkPts[0];
  }

  getEnd(): TrackPoint {
    return this.trkPts[this.trkPts.length - 1];
  }

  getClosestPoint(time: number): TrackPoint | undefined {
    if (this.trkPts.length === 0) {
      return undefined;
    }
    const p1: TrackPoint | undefined = this.trkPts.find((o: TrackPoint) => o.t >= time);
    if (!p1) {
      return this.trkPts[0];
    }
    if (p1.id === 0) {
      return p1;
    }
    const p0: TrackPoint = this.trkPts[p1.id];
    const t1: number = p1.t - time;
    const t0: number = time - p0.t;
    if (t1 >= t0) {
      return p0;
    } else {
      return p1;
    }
  }

  getClosestPointLonLat(lon: number, lat: number): TrackPoint {
    let distance: number = -1;
    let closest: TrackPoint = new TrackPoint();

    for (let p of this.trkPts) {
      const d: number = calcDistance(lon, lat, p.lon, p.lat);
      if (distance === -1 || d < distance) {
        distance = d;
        closest = p;
      }
    }

    return closest;
  }

  getPreviousByTime(time: number): TrackPoint | undefined {
    if (this.trkPts.length === 0) {
      return undefined;
    }
    const p1: TrackPoint | undefined = this.trkPts.find((o: TrackPoint) => o.t >= time);
    if (!p1) {
      return this.trkPts[0];
    }
    // If start point or is equal to the time
    if (p1.id === 0 || p1.t === time) {
      return p1;
    }
    return this.getPrevious(p1);
  }

  getNextByTime(time: number): TrackPoint | undefined {
    if (this.trkPts.length === 0) {
      return undefined;
    }
    const p1: TrackPoint | undefined = this.trkPts.find((o: TrackPoint) => o.t >= time);
    if (!p1) {
      return this.trkPts[this.trkPts.length - 1];
    }
    // If end point or is equal to the time
    if (p1.id === this.trkPts.length - 1 || p1.t === time) {
      return p1;
    }
    return this.getNext(p1);
  }

  getSubTrackByTimes(t0: number, t1: number): TrackPoint[] | undefined {
    let p: TrackPoint | undefined = this.getPreviousByTime(t0);
    let n: TrackPoint | undefined = this.getNextByTime(t1);
    if (p && n) {
      return this.trkPts.slice(p.id, n.id + 1);
    } else {
      return undefined;
    }
  }

  getSubTrackByIds(i0: number, i1: number): TrackPoint[] {
    if (i0 < i1) {
      return this.trkPts.slice(i0, i1 + 1);
    } else {
      return this.trkPts.slice(i1, i0 + 1);
    }
  }

  /**
   * Shift time starting from the point after p.
   *
   * @param p1 Selected point
   * @param dt Either positive or negative.
   */
  shiftTime(p1: TrackPoint | undefined, dt: number): void {
    if (p1) {
      let process: boolean = false;
      let oneSecond: boolean = false;

      this.setDuration(this.duration += dt);

      if (p1.dt === 1) {
        oneSecond = true;
        this.trkPts.splice(p1.id, 1);
      }

      for (const p of this.trkPts) {
        if (process) {
          p.t += dt;
          p.date = p.date.add(dt, 'second');
        } else if ((!oneSecond && p1.id === p.id) || (oneSecond && p1.id + 1 === p.id)) {
          process = true;
          p.dt += dt;
          p.v = calcPace(p.dt, p.dx);
        }
      }
    } else {
      for (const p of this.trkPts) {
        p.date = p.date.add(dt, 'second');
      }
    }
  }

  compress(newDuration: number): boolean {
    if (this.duration < newDuration) {
      return false;
    }

    let p: TrackPoint | undefined;

    while (newDuration < this.duration) {
      p = undefined;
      for (let i = 0; i < this.trkPts.length - 1; i++) {
        if (!p) {
          p = this.trkPts[i];
        } else if (p.v < this.trkPts[i].v) {
          p = this.trkPts[i];
        }
      }
      if (p) {
        this.shiftTime(p, -1);
      }
    }

    return true;
  }

  delete(points: TrackPoint[]): GpxEvent {
    try {
      console.log('delete');
      console.log(points);
      console.log(this.trkPts);
      this.trkPts.splice(points[0].id, points.length);
      this.resetIds();
      this.calcTrack();
      console.log(this.trkPts);
    } catch (error) {
      return GpxEvent.createEvent('Delete Point failed', false, error);
    }

    return GpxEvent.createEvent(`Deleted point id=${points[0].id} at time=${points[0].t}`);
  }

  interpolate(p: TrackPoint): GpxEvent {
    if (p.id < 2) {
      return GpxEvent.createEvent('Failed to interpolate.', false, new Error('Id must be more than 2 points from the start/end'));
    }

    let x0: number = +this.trkPts[p.id - 1].lon;
    let x1: number = +this.trkPts[p.id].lon;
    let x2: number = +this.trkPts[p.id + 1].lon;
    let x3: number = +this.trkPts[p.id + 2].lon;
    const y0: number = +this.trkPts[p.id - 1].lat;
    const y1: number = +this.trkPts[p.id].lat;
    const y2: number = +this.trkPts[p.id + 1].lat;
    const y3: number = +this.trkPts[p.id + 2].lat;

    // a = 2 - 1
    // b = 3 - 0
    // c = a - b
    let xa: number = x2 - x1;
    let ya: number = y2 - y1;
    let x: number = x1 + xa;
    let y: number = y1 + ya;

    let newP: TrackPoint = new TrackPoint();
    newP.ele = (this.trkPts[p.id].ele + this.trkPts[p.id + 1].ele) / 2.0;
    newP.lon = x;
    newP.lat = y;
    newP.point = new Point([x, y]);
    newP.extensions = p.extensions;
    let dt: number = this.trkPts[p.id + 1].date.diff(this.trkPts[p.id].date, 'second');
    dt = Math.floor(dt / 2.0);
    newP.date = p.date.add(dt, 'second');
    // console.log(dt + ' ' + x + ' ' + y + ' ' + a0 + ' ' + a1 + ' ' + a2 + ' ' + a3);

    this.trkPts.splice(p.id + 1, 0, newP);
    this.resetIds();
    this.calcTrack();

    for (let tp of this.trkPts) {
      if (tp.date === newP.date) {
        newP = tp;
      }
    }

    return GpxEvent.createDataEvent('', true, TrackPoint.from(newP));
  }

  /**
   * https://gist.github.com/talespaiva/128980e3608f9bc5083b
   */
  interpolate2(p: TrackPoint): GpxEvent {
    if (p.id < 2) {
      return GpxEvent.createEvent('Failed to interpolate.', false, new Error('Id must be more than 2 points from the start/end'));
    }

    let x0: number = +this.trkPts[p.id - 1].lon;
    let x1: number = +this.trkPts[p.id].lon;
    let x2: number = +this.trkPts[p.id + 1].lon;
    let x3: number = +this.trkPts[p.id + 2].lon;
    const y0: number = +this.trkPts[p.id - 1].lat;
    const y1: number = +this.trkPts[p.id].lat;
    const y2: number = +this.trkPts[p.id + 1].lat;
    const y3: number = +this.trkPts[p.id + 2].lat;
    const x: number = (x1 + x2) / 2.0;
    while (x0 === x1 || x0 === x2 || x0 === x3) {
      x0 = x0 + 0.000001;
    }
    while (x1 === x0 || x1 === x2 || x1 === x3) {
      x1 = x1 + 0.000001;
    }
    while (x2 === x0 || x2 === x1 || x2 === x3) {
      x2 = x2 + 0.000001;
    }
    while (x3 === x0 || x3 === x1 || x3 === x2) {
      x3 = x3 + 0.000001;
    }
    const a0: number = y0 * (x - x1) * (x - x2) * (x - x3) / ((x0 - x1) * (x0 - x2) * (x0 - x3));
    const a1: number = y1 * (x - x0) * (x - x2) * (x - x3) / ((x1 - x0) * (x1 - x2) * (x1 - x3));
    const a2: number = y2 * (x - x0) * (x - x1) * (x - x3) / ((x2 - x0) * (x2 - x1) * (x2 - x3));
    const a3: number = y3 * (x - x0) * (x - x1) * (x - x2) / ((x3 - x0) * (x3 - x1) * (x3 - x2));
    const y: number = a0 + a1 + a2 + a3;
    console.log('x ' + x0 + ' ' + x1 + ' ' + x2 + ' ' + x3 + '       ' + x + '    ' + (+x1 + +x2) + '     ' + (x1 + x2) / 2.0);
    console.log('y ' + y0 + ' ' + y1 + ' ' + y2 + ' ' + y3);

    let newP: TrackPoint = new TrackPoint();
    newP.ele = (this.trkPts[p.id].ele + this.trkPts[p.id + 1].ele) / 2.0;
    newP.lon = x;
    newP.lat = y;
    newP.point = new Point([x, y]);
    newP.extensions = p.extensions;
    let dt: number = this.trkPts[p.id + 1].date.diff(this.trkPts[p.id].date, 'second');
    dt = Math.floor(dt / 2.0);
    newP.date = p.date.add(dt, 'second');
    console.log(dt + ' ' + x + ' ' + y + ' ' + a0 + ' ' + a1 + ' ' + a2 + ' ' + a3);

    this.trkPts.splice(p.id + 1, 0, newP);
    this.resetIds();
    this.calcTrack();

    for (let tp of this.trkPts) {
      if (tp.date === newP.date) {
        newP = tp;
      }
    }

    return GpxEvent.createDataEvent('', true, TrackPoint.from(newP));
  }

  updatePoint(u: TrackPoint): GpxEvent {
    try {
      const p: TrackPoint | undefined = this.trkPts.find((o: TrackPoint) => o.id === u.id);
      if (p) {
        p.lat = u.lat;
        p.lon = u.lon;
        p.ele = u.ele;
        p.point = new Point([u.lon, u.lat]);
      }
      this.calcTrack();
    } catch (error) {
      return GpxEvent.createEvent('Update Point failed', false, error);
    }

    return GpxEvent.createEvent(`Updated point id=${u.id} at time=${u.t}`);
  }

  appendTrackSeg(trkSeg: TrackSeg, newDt: number): void {
    const oldDt: number = trkSeg.getStartTime().diff(this.getEndTime(), 'second');
    const dt: number = newDt - oldDt;
    trkSeg.shiftTime(undefined, dt);
    this.trkPts = [...this.trkPts, ...trkSeg.trkPts];
  }

  split(p: TrackPoint, before: boolean): void {
    if (before) {
      this.trkPts = this.trkPts.slice(0, p.id + 1);
    } else {
      this.trkPts = this.trkPts.slice(p.id);
    }
    this.getEnd().reset();
    this.resetIds();
    this.calcTrack();
  }

  /**
   * Auto adjust the speed of the track so that it is as consistent as possible while forcing
   * the given reference points to have the specified times. The overall track duration is kept
   * the same as it was before (start and end times are unchanged unless explicitly included as
   * reference points).
   *
   * Between consecutive reference points (including the implicit start/end), point times are
   * redistributed proportionally to the cumulative distance so the velocity is as constant as
   * possible within that span. Points that end up less than `minGap` seconds apart are removed
   * so that no unrealistic velocity spikes are introduced.
   *
   * @param refs Reference points with the id of an existing track point and the desired time
   *   (in seconds from the start of the track).
   * @param minGap Minimum allowed time (seconds) between consecutive points, defaults to 3.
   */
  autoAdjustSpeed(refs: { id: number, t: number }[], minGap: number = 3, settings: Settings = new Settings()): GpxEvent {
    try {
      if (this.trkPts.length < 2) {
        return GpxEvent.createEvent('Auto adjust speed failed.', false, new Error('Track has too few points.'));
      }

      const startId: number = this.trkPts[0].id;
      const endId: number = this.trkPts[this.trkPts.length - 1].id;

      // Merge user references with the forced start (t=0) and end (t=duration) points.
      const refMap: Map<number, number> = new Map<number, number>();
      refMap.set(startId, 0);
      refMap.set(endId, this.duration);
      for (const r of refs) {
        if (r.id === startId || r.id === endId) {
          continue;
        }
        refMap.set(r.id, r.t);
      }

      const sortedRefs: { id: number, t: number }[] = Array.from(refMap.entries())
        .map(([id, t]) => ({ id, t }))
        .sort((a, b) => a.id - b.id);

      for (let i = 0; i < sortedRefs.length - 1; i++) {
        if (sortedRefs[i].t >= sortedRefs[i + 1].t) {
          return GpxEvent.createEvent('Auto adjust speed failed.', false, new Error('Reference point times must increase in order.'));
        }
      }

      // Cumulative distance for every point in the track.
      const cumDist: number[] = new Array(this.trkPts.length).fill(0);
      for (let i = 1; i < this.trkPts.length; i++) {
        cumDist[i] = cumDist[i - 1] + this.trkPts[i - 1].dx;
      }

      const startDate: Dayjs = this.trkPts[0].date;
      const newTimes: number[] = new Array(this.trkPts.length).fill(0);

      for (let r = 0; r < sortedRefs.length - 1; r++) {
        const refA = sortedRefs[r];
        const refB = sortedRefs[r + 1];
        const distA: number = cumDist[refA.id];
        const distB: number = cumDist[refB.id];
        const distSpan: number = distB - distA;
        const timeSpan: number = refB.t - refA.t;

        for (let i = refA.id; i <= refB.id; i++) {
          if (i === refA.id) {
            newTimes[i] = refA.t;
          } else if (i === refB.id) {
            newTimes[i] = refB.t;
          } else if (distSpan > 0) {
            const frac: number = (cumDist[i] - distA) / distSpan;
            newTimes[i] = refA.t + frac * timeSpan;
          } else {
            // No distance between reference points; distribute evenly over time.
            const frac: number = (i - refA.id) / (refB.id - refA.id);
            newTimes[i] = refA.t + frac * timeSpan;
          }
        }
      }

      for (let i = 0; i < this.trkPts.length; i++) {
        this.trkPts[i].date = startDate.add(Math.round(newTimes[i]), 'second');
      }

      // Remove points that are too close in time to the previous kept point, unless they are
      // reference points (which must keep their assigned time).
      const refIds: Set<number> = new Set<number>(sortedRefs.map((r) => r.id));
      const kept: TrackPoint[] = [this.trkPts[0]];
      for (let i = 1; i < this.trkPts.length; i++) {
        const p: TrackPoint = this.trkPts[i];
        const last: TrackPoint = kept[kept.length - 1];
        const dt: number = p.date.diff(last.date, 'second');

        if (dt < minGap && !refIds.has(p.id) && i !== this.trkPts.length - 1) {
          // Drop this point to open up a larger time delta.
          continue;
        }
        kept.push(p);
      }

      this.trkPts = kept;
      this.resetIds();
      this.calcTrack();
      this.analyze(settings);
    } catch (error) {
      return GpxEvent.createEvent('Auto adjust speed failed.', false, error);
    }

    return GpxEvent.createEvent('Auto adjusted speed.');
  }
}
