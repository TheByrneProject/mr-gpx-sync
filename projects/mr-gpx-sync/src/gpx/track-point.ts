import Point from 'ol/geom/Point';
import { Moment } from 'moment';
import { Coordinate } from 'ol/coordinate';

import { TrackElement } from './track-element';

export class TrackPoint extends TrackElement {

  id: number = 0;
  point: Point = new Point([]);
  t: number = 0;
  dx: number = 0;
  dt: number = 0;
  v: number = 0;
  joinPoint: boolean = false;

  static createFromTrackElement(e: TrackElement, i: number): TrackPoint {
    const p: TrackPoint = new TrackPoint();

    p.id = i;
    p.lon = e.lon;
    p.lat = e.lat;
    p.ele = e.ele;
    p.date = e.date;
    p.point = new Point([p.lon, p.lat]);
    p.extensions = e.extensions;
    return p;
  }

  static from(old: TrackPoint): TrackPoint {
    const p: TrackPoint = new TrackPoint();
    p.id = old.id;
    p.point = new Point([old.lon, old.lat]);
    p.t = old.t;
    p.dx = old.dx;
    p.dt = old.dt;
    p.v = old.v;
    p.lon = old.lon;
    p.lat = old.lat;
    p.ele = old.ele;
    p.date = old.date;
    p.extensions = old.extensions;
    return p;
  }

  static override createFromCoordinate(c: Coordinate): TrackPoint {
    const p: TrackPoint = new TrackPoint();
    p.lon = c[0];
    p.lat = c[1];
    p.point = new Point([p.lon, p.lat]);
    return p;
  }

  reset(): void {
    this.dx = 0;
    this.dt = 0;
    this.v = 0;
  }

  setLonLat(lon: number, lat: number): void {
    this.lon = lon;
    this.lat = lat;
    this.point = new Point([lon, lat]);
  }

  updateTime(endTime: Moment, dt: number): void {
    this.date = endTime.clone().add(this.t + dt, 's');
  }
}
