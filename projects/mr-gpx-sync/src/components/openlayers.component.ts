import {
  AfterViewInit,
  Component,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';

import { Subscription, timer } from 'rxjs';
import Map from 'ol/Map';
import View from 'ol/View';
import VectorLayer from 'ol/layer/Vector';
import TileLayer from 'ol/layer/Tile';
import Projection from 'ol/proj/Projection';
import Feature from 'ol/Feature';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import { fromLonLat, toLonLat } from 'ol/proj';
import { circular } from 'ol/geom/Polygon';
import { OSM, Vector } from 'ol/source';
import { LineString } from 'ol/geom';
import { Circle, Fill, Stroke, Style } from 'ol/style';
import { extend } from 'ol/extent';

import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { TrackPoint } from '../gpx/track-point';
import { TrackPointEvent } from '../events/track-point-event';
import { TrackFile } from '../gpx/track-file';
import { ActionEvent } from '../events/action-event';
import { Colors } from '../utils/colors';
import { Coordinate } from 'ol/coordinate';

export enum MapSelectMode {
  FREE_SELECT,
  POINT_SELECT
}

@Component({
  selector: 'mr-gpx-sync-openlayers-sync',
  template: `
    <div [id]="target" class="w-100 h-100"></div>
  `,
  styles: [`
    ::ng-deep .ol-viewport {
      border-radius: 0.25rem;
      color: black;
    }
  `]
})
export class OpenLayersComponent implements AfterViewInit, OnChanges, OnDestroy, OnInit {

  fill = new Fill({
    color: [180, 0, 0, 0.15]
  });

  stroke = new Stroke({
    color: [180, 0, 0, 1],
    width: 1
  });

  overlayStyle = new Style({
    image: new Circle({
      fill: this.fill,
      stroke: this.stroke,
      radius: 8
    }),
    fill: this.fill,
    stroke: this.stroke
  });

  map: Map = new Map({});
  vectorSource = new Vector({});
  overlaySource = new Vector({});
  overlay: VectorLayer = new VectorLayer({
    source: this.overlaySource,
    style: this.overlayStyle
  });
  tileLayer: TileLayer = new TileLayer({
    source: new OSM()
  });
  primaryLayer!: VectorLayer | undefined;
  secondaryLayers: VectorLayer[] = [];

  primaryTrack: TrackPoint[] = [];
  secondaryTracks: any[] = [];
  selectedPoints: TrackPoint[] = [];

  subscription!: Subscription;
  lastAction!: ActionEvent;
  selectedSize: number = 25;
  pointSize: number = 1;
  manualZoom: boolean = false;
  trackChanged: boolean = false;
  overlayChanged: boolean = false;
  xy: [number, number] = [1, 1];
  resolution: number = 1;
  extent!: [number, number, number, number];

  mode: MapSelectMode = MapSelectMode.POINT_SELECT;

  @Input()
  target: string = 'map';

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.track$.subscribe((trackFile: TrackFile) => {
      if (trackFile.loaded) {
        this.mrGpxSyncService.log(`OpenLayersComponent.track$.subscribe.loaded: ${trackFile.tracks.length}`);
        /*this.clearAll();
        this.loadTrack(trackFile.getTrack().trkPts);
        this.addOverlay();*/
        this.loadTrack(trackFile.getTrack().trkPts);
        this.render();
        this.map.updateSize();
      } else if (trackFile.getTrack().trkPts.length > 1) {
        this.mrGpxSyncService.log(`OpenLayersComponent.track$.subscribe.!loaded: ${trackFile.tracks.length}`);
        this.loadTrackFile(trackFile, trackFile.tracks.length === 1 && trackFile.tracks[0].trkSegs.length === 1);
        this.render();
        this.map.updateSize();
      }
    });

    this.subscription = this.mrGpxSyncService.action$.subscribe((action: ActionEvent) => {
      this.mrGpxSyncService.log(`OpenLayersComponent.action$.subscribe: action=${action.name}`);

      if (action.name && action.name.startsWith('action-')) {
        this.mode = MapSelectMode.FREE_SELECT;
      } else {
        this.mode = MapSelectMode.POINT_SELECT;
      }

      if (!action.data || !action.data.trackFile) {
        return;
      }

      try {
        this.lastAction = action;
        const trackFile: TrackFile = action.data.trackFile;
        if (!action.name) {
          this.loadTrack(this.mrGpxSyncService.track$.getValue().getTrack().trkPts);
          this.render();
          this.map.updateSize();
        } else if (action.name.indexOf('action-end-track') !== -1) {
          this.loadTrack(this.mrGpxSyncService.track$.getValue().getTrack().trkPts);
          this.loadTrackFile(action.data.trackFile, false);
          this.render();
          this.map.updateSize();
        } else if (action.name === 'action-open-wizard') {
          this.clearAll();
          this.loadTrackFile(action.data.trackFile, trackFile.tracks.length === 1 && trackFile.tracks[0].trkSegs.length === 1);
          this.render();
          this.map.updateSize();
        }
      } catch (error) {
        console.error(error);
        this.mrGpxSyncService.log(JSON.stringify(action), 'error');
      }
      this.mrGpxSyncService.loading$.next(false);
    });
    this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      if (e.p) {
        this.selectPoint(e.p, e.source);
      }
    });
    this.mrGpxSyncService.mapPoint$.subscribe((e: TrackPointEvent) => {
      if (e.p && e.source !== 'map') {
        this.selectPoint(e.p, e.source);
      }
    });
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.map.setTarget(this.target);
    timer(2500).subscribe(() => {
      this.map.updateSize();
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.map.setTarget(this.target);
    this.map.updateSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.map.setTarget(this.target);
    this.map.updateSize();
  }

  selectPoint(p: TrackPoint, source: string = ''): void {
    if (!p) {
      return;
    }

    this.mrGpxSyncService.log('openlayers.selectPoint: ' + p.lon + ', ' + p.lat);
    this.selectedPoints = [p];
    this.render(source === 'video');
  }

  private initMap(): void {
    this.map = new Map({
      target: this.target,
      layers: [
        this.tileLayer,
        this.overlay
      ],
      view: new View({
        center: fromLonLat([0, 0]),
        zoom: 14
      })
    });

    this.map.on('singleclick', (event: MapBrowserEvent<UIEvent>) => {
      this.mrGpxSyncService.log('singleClick: ' + this.mode + ' ' + toLonLat(event.coordinate));

      if (this.mode === MapSelectMode.FREE_SELECT) {
        this.mrGpxSyncService.log('singleClick: free');
        this.selectPoint(TrackPoint.createFromCoordinate(toLonLat(event.coordinate)), 'map');
        this.mrGpxSyncService.setMapPoint(TrackPoint.createFromCoordinate(toLonLat(event.coordinate)), 'map');
      } else {
        this.mrGpxSyncService.log('singleClick: pt');
        this.mrGpxSyncService.setSelectedPointClosestTo(toLonLat(event.coordinate));
      }
    });
    this.map.on('dblclick', (event: MapBrowserEvent<UIEvent>) => {
      // this.map.getView().fit(this.vector.getSource().getExtent(), {size: this.map.getSize(), padding: [25, 25, 25, 25]});
    });
    this.map.on('moveend', (event: any) => {
      if (this.primaryTrack.length > 0 || this.secondaryTracks.length > 0) {
        this.setSizeXR(event.map.getSize()[0], event.map.getSize()[1], event.map.getView().getResolution());
      }
    });
  }

  setSizeXR(x: number, y: number, r: number): void {
    if (!this.manualZoom) {
      this.xy = [x * r, y * r];
      this.resolution = r;
      this.selectedSize = Math.ceil(x * 0.025 * r);
      this.pointSize = Math.ceil(x * 0.0025 * r);
      this.render();
    }
  }

  clearAll(): void {
    if (this.primaryLayer) {
      this.map.removeLayer(this.primaryLayer);
      this.primaryLayer = undefined;
    }
    for (let layer of this.secondaryLayers) {
      this.map.removeLayer(layer);
    }
    this.secondaryLayers = [];
  }

  addOverlay(): void {
    this.map.removeLayer(this.overlay);
    this.map.addLayer(this.overlay);
  }

  loadTrack(trkPts: TrackPoint[], primary: boolean = true): void {
    this.trackChanged = true;

    if (primary) {
      this.primaryTrack = trkPts;
      this.secondaryTracks = [];
    } else {
      this.primaryTrack = [];
      this.secondaryTracks = [{trkPts: trkPts, i: 0, j: 0}];
    }
  }

  loadTrackFile(trackFile: TrackFile, primary: boolean = true): void {
    this.trackChanged = true;

    if (primary) {
      this.primaryTrack = trackFile.getTrack().trkPts;
      this.secondaryTracks = [];
    } else {
      this.primaryTrack = [];
      this.secondaryTracks = [];

      for (let i = 0; i < trackFile.tracks.length; i++) {
        for (let j = 0; j < trackFile.tracks[i].trkSegs.length; j++) {
          this.secondaryTracks.push({trkPts: trackFile.tracks[i].trkSegs[j].trkPts, i: i, j: j, J: trackFile.tracks[i].trkSegs.length});
        }
      }
    }
  }

  render(followMe: boolean = false): void {
    if (this.overlay) {
      this.map.removeLayer(this.overlay);
    }
    if (this.primaryLayer) {
      this.map.removeLayer(this.primaryLayer);
    }
    for (let layer of this.secondaryLayers) {
      this.map.removeLayer(layer);
    }
    this.secondaryLayers = [];

    let extent: [number, number, number, number] = [0, 0, 0, 0];
    if (this.primaryTrack.length > 0) {
      extent = this.drawTrackSeg(this.primaryTrack, true, this.getStyle(true), '', extent);
    }
    for (let trackData of this.secondaryTracks) {
      extent = this.drawTrackSeg(trackData.trkPts, false, this.getStyle(false, trackData.i, trackData.j), '', extent);
    }
    if (this.overlay) {
      this.drawOverlay();
    }

    if (this.trackChanged && extent) {
      this.map.getView().fit(extent, {size: this.map.getSize(), padding: [25, 25, 25, 25]});
      this.trackChanged = false;
      this.extent = extent;
    } else if (followMe && this.selectedPoints.length === 1) {
      let p: Coordinate = fromLonLat([this.selectedPoints[0].lon, this.selectedPoints[0].lat]);
      this.extent = [p[0] - this.xy[0] / 2.0, p[1] - this.xy[1] / 2.0, p[0] + this.xy[0] / 2.0, p[1] + this.xy[1] / 2.0];
      this.manualZoom = true;
      this.map.getView().fit(this.extent, {size: this.map.getSize(), padding: [25, 25, 25, 25]});
      timer(100).subscribe(() => {
        this.manualZoom = false;
      });
    }
  }

  drawOverlay(): void {
    this.mrGpxSyncService.log('openlayers.drawOverlay: ' + this.selectedPoints.length);

    this.overlaySource.clear();
    for (let p of this.selectedPoints) {
      let feature = new Feature({});
      const circle = circular(p.point.getCoordinates(), this.selectedSize, 18);
      feature.setGeometry(circle);
      this.overlaySource.addFeature(feature);

      if (this.resolution < 0.5) {
        feature = new Feature({});
        const c = circular(p.point.getCoordinates(), this.pointSize, 8);
        feature.setGeometry(c);
        this.overlaySource.addFeature(feature);
      }
    }

    this.overlaySource.getFeatures().forEach((element) => {
      const currentProjection = new Projection({code: 'EPSG:4326'});
      const newProjection = this.tileLayer.getSource().getProjection();

      // @ts-ignore
      element.getGeometry().transform(currentProjection, newProjection);
    });

    this.map.addLayer(this.overlay);
  }

  drawTrackSeg(trkPts: TrackPoint[],
               primary: boolean,
               style: Style,
               mode: string,
               extent: [number, number, number, number]): [number, number, number, number] {
    let feature;
    let source = new Vector({});
    let vector: VectorLayer = new VectorLayer({
      source: source,
      style: style
    });

    for (let k = 1; k < trkPts.length; k++) {
      feature = new Feature({});
      if (this.resolution < 1.0) {
        const c = circular(trkPts[k].point.getCoordinates(), this.pointSize, 8);
        feature.setGeometry(c);
        source.addFeature(feature);
      }

      const line = new LineString([trkPts[k - 1].point.getCoordinates(), trkPts[k].point.getCoordinates()]);
      feature = new Feature({});
      feature.setGeometry(line);
      source.addFeature(feature);
    }

    feature = new Feature({});
    const circle = circular(trkPts[0].point.getCoordinates(), this.selectedSize, 18);
    feature.setGeometry(circle);
    source.addFeature(feature);

    source.getFeatures().forEach((element) => {
      const currentProjection = new Projection({code: 'EPSG:4326'});
      const newProjection = this.tileLayer.getSource().getProjection();

      // @ts-ignore
      element.getGeometry().transform(currentProjection, newProjection);
    });

    if (primary) {
      this.primaryLayer = vector;
    } else {
      this.secondaryLayers.push(vector);
    }
    this.map.addLayer(vector);

    if (!extent) {
      extent = vector.getSource().getExtent();
    } else {
      extend(extent, vector.getSource().getExtent());
    }
    return extent;
  }

  getStyle(primary: boolean, i: number = 0, j: number = 0): Style {
    let color: number[] = [];
    if (primary) {
      color = [0, 0, 0, 1];
    } else {
      color = Colors.getColor(i, j, this.secondaryTracks[i].J);
    }
    let fColor = color.slice();
    fColor[3] = 0.25;

    return new Style({
      image: new Circle({
        fill: this.fill,
        stroke: this.stroke,
        radius: 8
      }),
      fill: new Fill({
        color: fColor
      }),
      stroke: new Stroke({
        color: color,
        width: 1
      })
    });
  }
}
