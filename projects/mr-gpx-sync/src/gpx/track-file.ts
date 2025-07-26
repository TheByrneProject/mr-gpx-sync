import { Track } from './track';
import { TrackSeg } from './track-seg';
import { ParseError } from '../error/parse.error';

export class TrackFile {

  tracks: Track[] = [];

  id: number = 0;
  loaded: boolean = false;
  fileName: string = 'untitled.gpx';

  static from(old: TrackFile): TrackFile {
    const track: TrackFile = new TrackFile();
    track.id = old.id;
    track.loaded = old.loaded;
    track.fileName = old.fileName;

    track.tracks = [];
    for (let o of old.tracks) {
      track.tracks.push(Track.from(o));
    }
    return track;
  }

  getTrack(): TrackSeg {
    if (this.tracks.length === 0 || this.tracks[0].trkSegs.length === 0) {
      return new TrackSeg();
    }
    return this.tracks[0].trkSegs[0];
  }

  parseGpx(gpx: Document): ParseError | undefined {
    this.loaded = false;

    try {
      const trks: HTMLCollectionOf<Element> = gpx.getElementsByTagName('trk');

      if (!trks || trks.length === 0) {
        return new ParseError('No <trk> elements', new XMLSerializer().serializeToString(gpx));
      }

      for (let i = 0; i < trks.length; i++) {
        const trk = new Track();
        trk.parseTrk(trks[i]);
        this.tracks.push(trk);
      }

      // Loaded only if only one track and one segment, otherwise go to open wizard
      this.loaded = this.tracks.length === 1 && this.tracks[0].trkSegs.length === 1;
    } catch (error: any) {
      console.error(error);
      return new ParseError(error, new XMLSerializer().serializeToString(gpx));
    }

    return undefined;
  }

  writeGpx(gpxName: string = 'untitled.gpx'): Document {
    const gpxFile: Document = document.implementation.createDocument(null, null, null);

    const gpx: Element = gpxFile.createElement('gpx');
    gpx.setAttribute('xmlns', 'http://www.topografix.com/GPX/1/1');
    gpx.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
    gpx.setAttribute('xsi:schemaLocation', 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd http://www.garmin.com/xmlschemas/GpxExtensions/v3 http://www.garmin.com/xmlschemas/GpxExtensionsv3.xsd http://www.garmin.com/xmlschemas/TrackPointExtension/v1 http://www.garmin.com/xmlschemas/TrackPointExtensionv1.xsd');
    gpx.setAttribute('xmlns:gpxtpx', 'http://www.garmin.com/xmlschemas/TrackPointExtension/v1');
    gpx.setAttribute('xmlns:gpxx', 'http://www.garmin.com/xmlschemas/GpxExtensions/v3');
    gpx.setAttribute('creator', 'thebyrneproject.com');
    gpx.setAttribute('version', '1.1');

    const trk: Element = gpxFile.createElement('trk');
    const trkseg: Element = gpxFile.createElement('trkseg');

    const name: Element = gpxFile.createElement('name');
    name.textContent = this.fileName;
    trk.appendChild(name);

    for (const p of this.tracks[0].trkSegs[0].trkPts) {
      const trkpt: Element = gpxFile.createElement('trkpt');
      const ele: Element = gpxFile.createElement('ele');
      const time: Element = gpxFile.createElement('time');

      trkpt.setAttribute('lat', p.lat.toString());
      trkpt.setAttribute('lon', p.lon.toString());
      ele.textContent = p.ele.toString();
      time.textContent = p.date.format('YYYY-MM-DD[T]kk:mm:ss[Z]');

      trkpt.appendChild(ele);
      trkpt.appendChild(time);
      if (p.extensions) {
        trkpt.appendChild(p.extensions);
      }
      trkseg.appendChild(trkpt);
    }

    trk.appendChild(trkseg);

    gpx.appendChild(trk);
    gpxFile.appendChild(gpx);
    return gpxFile;
  }
}
