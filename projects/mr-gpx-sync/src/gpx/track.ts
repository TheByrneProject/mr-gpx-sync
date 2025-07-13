import { Moment } from 'moment';

import { TrackSeg } from './track-seg';

export class Track {

  trkSegs: TrackSeg[] = [];

  name: string = 'untitled';

  static from(old: Track): Track {
    const track: Track = new Track();
    track.name = old.name;

    track.trkSegs = [];
    for (let o of old.trkSegs) {
      track.trkSegs.push(TrackSeg.from(o));
    }
    return track;
  }

  parseTrk(trk: Element): void {
    try {
      this.name = trk.getElementsByTagName('name')[0].textContent as string;
    } catch (error) {}

    this.trkSegs = [];

    try {
      const trkSegs: HTMLCollectionOf<Element> = trk.getElementsByTagName('trkseg');
      for (let i = 0; i < trkSegs.length; i++) {
        const trkSeg: TrackSeg = new TrackSeg();
        trkSeg.parseTrkSeg(trkSegs[i]);
        this.trkSegs.push(trkSeg);
      }
    } catch (error) {
      throw error;
    }
  }

  getStartTime(): Moment | undefined {
    let startTime: Moment | undefined = undefined;
    for (let trkSeg of this.trkSegs) {
      startTime = !startTime || trkSeg.getStartTime().isBefore(startTime) ? trkSeg.getStartTime() : startTime;
    }
    return startTime;
  }
}
