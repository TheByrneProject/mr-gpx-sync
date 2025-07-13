import { TrackFile } from '../gpx/track-file';

export class Undo {

  index: number = 0;
  history: TrackFile[] = [];

}
