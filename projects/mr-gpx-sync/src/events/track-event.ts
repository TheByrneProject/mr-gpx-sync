import {TrackFile} from '../gpx';

export class TrackEvent {
  track: TrackFile = new TrackFile();
  data: any = {};
  source: string = '';

  constructor(track: TrackFile = new TrackFile(), data: any = {}, source: string = '') {
    this.track = track;
    this.data = data;
    this.source = source;
  }

  getTrack(): TrackFile {
    return this.track;
  }
}
