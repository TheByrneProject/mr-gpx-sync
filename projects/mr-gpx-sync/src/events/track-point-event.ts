import { TrackPoint } from '../gpx/track-point';

export class TrackPointEvent {

  p: TrackPoint | undefined;
  source: string;

  constructor(p: TrackPoint | undefined = undefined, source: string = '') {
    this.p = p;
    this.source = source;
  }
}
