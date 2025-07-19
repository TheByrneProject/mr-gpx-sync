import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Clipboard } from '@angular/cdk/clipboard';

import { BehaviorSubject, Subject } from 'rxjs';
import { Moment } from 'moment';
import { Coordinate } from 'ol/coordinate';

import { TrackPoint } from '../gpx/track-point';
import { Undo } from '../events/undo';
import { Settings } from '../gpx/settings';
import { GpxEvent } from '../events/gpx-event';
import { ActionEvent } from '../events/action-event';
import { TrackPointEvent } from '../events/track-point-event';
import { TrackFile } from '../gpx/track-file';
import { TrackSeg } from '../gpx/track-seg';
import { Track } from '../gpx/track';
import { ParseError } from '../error/parse.error';
import { MrGpxSyncEvent } from '../events/mr-gpx-sync.event';

/**
 * Only service for this application.  Stores all subjects used to send and listen for events.
 */
@Injectable({
  providedIn: 'root'
})
export class MrGpxSyncService {

  settings$: BehaviorSubject<Settings> = new BehaviorSubject<Settings>(new Settings());
  syncAction$: BehaviorSubject<MrGpxSyncEvent> = new BehaviorSubject<MrGpxSyncEvent>(new MrGpxSyncEvent());

  action$: BehaviorSubject<ActionEvent> = new BehaviorSubject<ActionEvent>(new ActionEvent());

  track$: BehaviorSubject<TrackFile> = new BehaviorSubject<TrackFile>(new TrackFile());
  selectedPoint$: BehaviorSubject<TrackPointEvent> = new BehaviorSubject<TrackPointEvent>(new TrackPointEvent());
  mapPoint$: BehaviorSubject<TrackPointEvent> = new BehaviorSubject<TrackPointEvent>(new TrackPointEvent());
  error$: Subject<ParseError> = new Subject<ParseError>();

  metric: boolean = true;

  id: number = 0;
  undo$: BehaviorSubject<Undo> = new BehaviorSubject<Undo>(new Undo());
  loading$: Subject<boolean> = new Subject<boolean>();

  videoData: BehaviorSubject<any> = new BehaviorSubject<any>(undefined);

  constructor(private snackBar: MatSnackBar,
              private clipboard: Clipboard) {
    let localSettings: Settings = JSON.parse(<string>localStorage.getItem('com.thebyrneproject.mrgpxsync.settings'));
    if (localSettings) {
      let settings: Settings = new Settings();
      settings = Object.assign(settings, localSettings);
      this.settings$.next(settings);
    }

    this.action$.subscribe((event: ActionEvent) => {
      if (event.name === 'open-video') {
        this.videoData.next(event.data);
      }
    });
  }

  log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    if (level === 'info') {
      console.info(message);
    } else if (level === 'warn') {
      console.warn(message);
    } else if (level === 'error') {
      console.error(message);
    }
  }

  setSelectedPoint(p: TrackPoint, source: string = ''): void {
    this.log('setSelectedPoint: ' + p.id + ' ' + source);
    this.selectedPoint$.next(new TrackPointEvent(TrackPoint.from(p), source));
  }

  setSelectedPointClosestTo(c: Coordinate, source: string = ''): void {
    this.log('setSelectedPointClosestTo: ' + c[0] + ', ' + c[1] + ' ' + source);

    const p: TrackPoint = this.track$.getValue().getTrack().getClosestPointLonLat(c[0], c[1]);
    this.selectedPoint$.next(new TrackPointEvent(TrackPoint.from(p), source));
  }

  setMapPoint(p: TrackPoint, source: string = ''): void {
    // this.clipboard.copy(JSON.stringify(p));
    this.mapPoint$.next(new TrackPointEvent(TrackPoint.from(p), source));
  }

  setMetric(metric: boolean): void {
    let settings: Settings = this.settings$.getValue();
    settings.setMetric(metric);
    localStorage.setItem('com.thebyrneproject.mrgpxsync.settings', JSON.stringify(settings));
    this.settings$.next(settings);
  }

  setPaceMinPer(paceMinPer: boolean): void {
    let settings: Settings = this.settings$.getValue();
    settings.setPaceMinPer(paceMinPer);
    localStorage.setItem('com.thebyrneproject.mrgpxsync.settings', JSON.stringify(settings));
    this.settings$.next(settings);
  }

  reset(): void {
    this.track$.next(new TrackFile());
    this.undo$.next(new Undo());
    this.action$.next(new ActionEvent('close-video'));
  }

  getId(): number {
    this.id += 1;
    return this.id;
  }

  setTrack(track: TrackFile): void {
    track.id = this.getId();

    const undo: Undo = this.undo$.getValue();
    undo.history = [TrackFile.from(track), ...undo.history.slice(undo.index)];
    undo.index = 0;
    this.undo$.next(undo);

    this.log('setTrack: undo.index=' + undo.index + ', id=' + track.id);
    this.selectedPoint$.next(new TrackPointEvent());
    this.track$.next(track);
  }

  setTrackSeg(trackSeg: TrackSeg): void {
    let track: TrackFile = this.track$.getValue();
    trackSeg.analyze(this.settings$.getValue());
    track.tracks[0].trkSegs = [trackSeg];
    this.setTrack(track);
  }

  undo(): void {
    this.log('undo');

    let undo: Undo = this.undo$.getValue();
    if (undo.index < undo.history.length - 1) {
      undo.index++;
      this.log('undo: undo.index=' + undo.index + ', id=' + undo.history[undo.index].id);
      this.track$.next(TrackFile.from(undo.history[undo.index]));
      this.selectedPoint$.next(new TrackPointEvent());
      this.undo$.next(undo);
    }
  }

  redo(): void {
    let undo: Undo = this.undo$.getValue();
    if (undo.index > 0) {
      undo.index--;
      this.track$.next(undo.history[undo.index]);
      this.selectedPoint$.next(new TrackPointEvent());
    }
  }

  openGpx(file: File, appendMode?: string): void {
    let track: TrackFile = new TrackFile();
    track.fileName = file.name;
    let reader: FileReader = new FileReader();

    reader.onload = () => {
      const parseError = this.parseGpx(reader.result as string, file.name, appendMode);
      if (parseError) {
        this.error$.next(parseError);
      }
    };

    reader.readAsText(file);
  }

  openClipboard(appendMode?: string): void {
    navigator.clipboard.readText().then((data: string) => {
      const parseError = this.parseGpx(data, 'clipboard', appendMode);
      if (parseError) {
        this.error$.next(parseError);
      }
    });
  }

  parseGpx(fileText: string, fileName: string = 'untitled.gpx', appendMode?: string): ParseError {
    this.log(`fileName: ${fileName}, appendMode: ${appendMode}`);
    let parseError: ParseError | undefined;
    if (!appendMode) {
      this.reset();
    }

    this.log('parseGpx.start: ' + appendMode);
    let parser: DOMParser = new DOMParser();

    let newTrackFile: TrackFile = new TrackFile();
    newTrackFile.fileName = fileName;
    try {
      parseError = newTrackFile.parseGpx(parser.parseFromString(fileText, 'text/xml'));
      if (parseError) {
        return parseError;
      }
      newTrackFile.getTrack().analyze(this.settings$.getValue());

      if (newTrackFile.getTrack().droppedPoints > 0) {
        this.openSnackBar('Points were dropped due to duplicate lat/lon in succession.');
      }
    } catch (error: any) {
      this.openSnackBar(error.message);
    }

    if (!newTrackFile.loaded) {
      this.log('!track.loaded: Open Wizard');
      this.action$.next(new ActionEvent('action-open-wizard', {appendMode: appendMode, trackFile: newTrackFile}));
      return new ParseError();
    }

    this.log('parseGpx.done');
    if (appendMode) {
      this.log('track.loaded: Open Append Wizard');
      this.action$.next(new ActionEvent(appendMode + '-track', {trackFile: newTrackFile}));
    } else {
      this.log('track.loaded: Open Track Wizard');
      this.setTrack(newTrackFile);
    }

    return new ParseError();
  }

  appendPoint(appendTrackPoint: TrackPoint, dt: number): void {
    const trackFile: TrackFile = this.track$.getValue();
    const track: TrackSeg = trackFile.getTrack();
    track.getEnd().dt = dt;
    appendTrackPoint.date = track.getEnd().date.clone().add(dt, 's');
    track.trkPts.push(appendTrackPoint);
    track.resetIds();
    track.calcTrack();
    track.analyze(this.settings$.getValue());
    this.setTrack(trackFile);
  }

  prependPoint(prependTrackPoint: TrackPoint, dt: number): void {
    const trackFile: TrackFile = this.track$.getValue();
    const track: TrackSeg = trackFile.getTrack();
    prependTrackPoint.dt = dt;
    prependTrackPoint.date = track.getStart().date.clone().subtract(dt, 's');
    track.trkPts = [prependTrackPoint, ...track.trkPts];
    track.resetIds();
    track.calcTrack();
    track.analyze(this.settings$.getValue());
    this.setTrack(trackFile);
  }

  appendTrack(appendTrackSeg: TrackSeg, dt: number): void {
    this.log(`appendTrack: ${dt}`);

    const trackFile: TrackFile = this.track$.getValue();
    const track: TrackSeg = trackFile.getTrack();
    const endTime: Moment = track.getEndTime();
    for (let trkPt of appendTrackSeg.trkPts) {
      trkPt.updateTime(endTime, dt);
      track.trkPts.push(trkPt);
    }
    track.resetIds();
    track.calcTrack();
    track.analyze(this.settings$.getValue());
    this.setTrack(trackFile);
  }

  prependTrack(prependTrackSeg: TrackSeg, dt: number): void {
    this.log(`prependTrack: ${dt}`);

    let trkPts: TrackPoint[] = prependTrackSeg.trkPts;
    const trackFile: TrackFile = this.track$.getValue();
    const track: TrackSeg = trackFile.getTrack();
    const endTime: Moment = prependTrackSeg.getEndTime();
    for (let trkPt of track.trkPts) {
      trkPt.updateTime(endTime, dt);
      trkPts.push(trkPt);
    }
    track.trkPts = trkPts;
    track.resetIds();
    track.calcTrack();
    track.analyze(this.settings$.getValue());
    this.setTrack(trackFile);
  }

  mergeTrackFile(trackFile: TrackFile, data: any): TrackFile {
    let newTrkSeg: TrackSeg = new TrackSeg();
    let trkSegs: TrackSeg[] = [];
    let dts: number[] = [];
    let name: string = 'untitled';
    for (let i = 0; i < trackFile.tracks.length; i++) {
      for (let j = 0; j < trackFile.tracks[i].trkSegs.length; j++) {
        if (data[`trkseg-${i}-${j}`]) {
          if (name === 'untitled' && trackFile.tracks[i].name !== 'untitled') {
            name = trackFile.tracks[i].name;
          }
          trkSegs.push(trackFile.tracks[i].trkSegs[j]);
          dts.push(data[`dt-${i}-${j}`]);
        }
      }
    }
    newTrkSeg = trkSegs[0];
    for (let i = 1; i < trkSegs.length; i++) {
      newTrkSeg.appendTrackSeg(trkSegs[i], dts[i - 1]);
    }

    let newTrackFile: TrackFile = new TrackFile();
    newTrackFile.fileName = trackFile.fileName;
    let newTrack: Track = new Track();
    newTrack.name = name;
    newTrack.trkSegs.push(newTrkSeg);
    newTrackFile.tracks.push(newTrack);
    newTrackFile.tracks[0].trkSegs[0].resetIds();
    newTrackFile.tracks[0].trkSegs[0].calcTrack();
    return newTrackFile;
  }

  openTrackFile(newTrackFile: TrackFile): void {
    newTrackFile.loaded = true;
    this.setTrack(newTrackFile);
  }

  openSnackBar(msg: string = ''): void {
    this.snackBar.open(msg, 'Dismiss', {
      horizontalPosition: 'end',
      verticalPosition: 'top',
      duration: 5000
    });

    console.error(msg);
  }

  /**
   * Shift time starting from the point after p.
   *
   * @param p1 Selected Point
   * @param dt Either positive or negative.
   */
  shiftTime(p1: TrackPoint, dt: number): void {
    this.log('shiftTime');
    let track: TrackFile = this.track$.getValue();
    track.getTrack().shiftTime(p1, dt);
    this.setTrack(track);
  }

  compress(newDuration: number): boolean {
    this.log('compress');
    let track: TrackFile = this.track$.getValue();
    const result: boolean = track.getTrack().compress(newDuration);
    this.setTrack(track);
    return result;
  }


  delete(points: TrackPoint[]): GpxEvent {
    this.log('delete: pSize=' + points.length);
    let track: TrackFile = this.track$.getValue();
    const result: GpxEvent = track.getTrack().delete(points);
    if (result.success) {
      if (points[0].id === 0) {
        //this.selectedPoint$.next(new TrackPointEvent(TrackPoint.from(track.getTrack().get(points[points.length - 1].id + 1))));
        let p: TrackPoint = points[points.length - 1];
        let p2: TrackPoint | undefined = track.getTrack().get(p.id + 1);
        if (p2) {
          this.selectedPoint$.next(new TrackPointEvent(TrackPoint.from(p2)));
        }
      } else {
        this.selectedPoint$.next(new TrackPointEvent(TrackPoint.from(points[0])));
      }
      this.setTrack(track);
    } else {
      this.openSnackBar(result.message);
    }
    return result;
  }

  interpolate(point: TrackPoint): GpxEvent {
    this.log('interpolate');
    let track: TrackFile = this.track$.getValue();
    const result: GpxEvent = track.getTrack().interpolate(point);
    if (result.success) {
      this.selectedPoint$.next(new TrackPointEvent(result.data));
      this.setTrack(track);
    } else {
      this.openSnackBar(result.message);
    }
    return result;
  }

  updatePoint(point: TrackPoint): GpxEvent {
    this.log('updatePoint');
    let track: TrackFile = this.track$.getValue();
    const result: GpxEvent = track.getTrack().updatePoint(point);
    if (result.success) {
      this.setTrack(track);
      this.openSnackBar(result.message);
    } else {
      this.openSnackBar(result.message);
    }
    return result;
  }

  /**
   * Sync GPX track with video timestamp
   */
  syncGpxTrack(gpxData: string, videoTimestamp: number): void {
    console.log('Syncing GPX track with video at timestamp:', videoTimestamp);
    console.log('GPX data length:', gpxData.length);
    // TODO: Implement actual sync logic
  }

  /**
   * Parse GPX data
   */
  parseGpxData(gpxContent: string): any {
    console.log('Parsing GPX data:', gpxContent.substring(0, 100) + '...');
    // TODO: Implement GPX parsing logic
    return {};
  }
}
