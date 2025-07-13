import { MrGpxSyncEvent } from './mr-gpx-sync.event';

export class NewProjectEvent extends MrGpxSyncEvent {

  gpx: boolean = false;
  video: boolean = false;
  error: boolean = false;

  constructor(s: any) {
    super(s);

    this.gpx = s?.gpx ? s.gpx : false;
    this.video = s?.video ? s.video : false;
    this.error = s?.error ? s.error : false;
  }
}
