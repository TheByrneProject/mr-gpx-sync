import { Component, HostBinding, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { MrGpxSyncService } from '../../services';
import { TrackFile, TrackPoint, TrackSeg } from '../../gpx';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { fromLonLat } from 'ol/proj';
import { XYZ } from 'ol/source';
import { scaleLinear, select } from 'd3';
import { Extent } from 'ol/extent';
import {Subscription, timer} from 'rxjs';
import { take } from 'rxjs/operators';
import { TrackPointEvent } from '../../events/track-point-event';
import { ActionEvent } from '../../events/action-event';
import { TrackEvent } from '../../events';

@Component({
  selector: 'mr-gpx-sync-d3-map',
  standalone: true,
  template: `
    <div id="d3-map" class="w-100 h-100" style="position: relative;"></div>
  `,
  styles: [`
    ::ng-deep .ol-viewport {
      border-radius: 0.25rem;
      color: black;
    }
  `]
})
export class MrGpxSyncD3Map implements OnInit, OnDestroy {

  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column';

  mapTilerKey: string = 'yZgFodMh6CXLihTwXGo8';

  map!: Map;

  primaryTrack: TrackSeg = new TrackSeg();
  secondaryTracks: any[] = [];
  selectedPoints: TrackPoint[] = [];

  trackEvent: TrackEvent = new TrackEvent();
  firstRender: boolean = true;
  trackChanged: boolean = false;
  svg: any;
  gSelectedPoints: any;
  features: any; // GeoJSON features converted from primaryTrack
  renderSubscription: Subscription;

  constructor(private el: ElementRef,
              private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit() {
    this.setMap();

    this.mrGpxSyncService.action$.subscribe((action: ActionEvent) => {
      if (action.name === 'set-map-type') {
        this.setMap(action.data.mapType);
        this.render();
      }
    });

    // Subscribe to track changes
    this.mrGpxSyncService.track$.subscribe((event: TrackEvent) => {
      this.trackEvent = event;
      if (event.track.loaded) {
        this.mrGpxSyncService.log(`D3MapComponent.track$.subscribe.loaded: ${event.track.tracks.length}`);
        this.loadTrack(event.track.getTrack());
      }

      /* else if (trackFile.getTrack().trkPts.length > 1) {
        this.mrGpxSyncService.log(`D3MapComponent.track$.subscribe.!loaded: ${trackFile.tracks.length}`);
        if (this.map) {
          this.map.updateSize();
        }
        this.render();
      }*/
    });
    this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      if (e.p?.length > 0) {
        this.selectedPoints = e.p;
        this.renderSelectedPoints();
      } else {
        this.selectedPoints = [];
        this.renderSelectedPoints();
      }
    });
  }

  setMap(type: string = 'topo'): void {
    this.el.nativeElement.querySelector('#d3-map').innerHTML = '';

    let url: string;
    if (type === 'topo') {
      url = `https://api.maptiler.com/maps/outdoor-v2/256/{z}/{x}/{y}@2x.png?key=${this.mapTilerKey}`;
    } else if (type === 'satellite') {
      url = `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${this.mapTilerKey}`;
    } else {
      url = `https://api.maptiler.com/maps/openstreetmap/{z}/{x}/{y}.jpg?key=${this.mapTilerKey}`;
    }

    let view: View;
    if (this.map) {
      view = this.map.getView();
    } else {
      view = new View({
        center: fromLonLat([-110, 41]), // Default center (longitude, latitude)
        zoom: 12,
      });
    }

    this.map = new Map({
      target: 'd3-map',
      layers: [
        new TileLayer({
          source: new XYZ({
            url: url,
            tileSize: 512,
            crossOrigin: 'anonymous'
          })
        }),
      ],
      view: view
    });

    this.map.updateSize();

    // Add event listeners for map view changes to update SVG overlay
    this.map.getView().on('change:center', () => this.render());
    this.map.getView().on('change:resolution', () => this.render());
    this.map.getView().on('change:rotation', () => this.render());
    this.map.on('click', () => {});

    if (this.primaryTrack.trkPts.length > 0) {
      this.renderDelay();
    }
  }

  loadTrack(trkSeg: TrackSeg, primary: boolean = true): void {
    this.trackChanged = true;

    if (primary) {
      this.primaryTrack = trkSeg;
      this.secondaryTracks = []
    } else {
      this.primaryTrack = new TrackSeg();
      this.secondaryTracks = [{trkPts: trkSeg.trkPts, i: 0, j: 0}];
    }

    if (this.firstRender || this.trackEvent.data.recenter) {
      this.fitMapToTrack();
      this.map.updateSize();
    }

    this.renderDelay();

    this.firstRender = false;
  }

  /**
   * Fit the map view to the bounds of the current track
   */
  fitMapToTrack(): void {
    if (!this.primaryTrack || this.primaryTrack.trkPts.length === 0) {
      return;
    }

    // Calculate bounds from track points
    let minLon = this.primaryTrack.trkPts[0].lon;
    let maxLon = this.primaryTrack.trkPts[0].lon;
    let minLat = this.primaryTrack.trkPts[0].lat;
    let maxLat = this.primaryTrack.trkPts[0].lat;

    this.primaryTrack.trkPts.forEach(point => {
      minLon = Math.min(minLon, point.lon);
      maxLon = Math.max(maxLon, point.lon);
      minLat = Math.min(minLat, point.lat);
      maxLat = Math.max(maxLat, point.lat);
    });

    // Convert to map projection coordinates
    const bottomLeft = fromLonLat([minLon, minLat]);
    const topRight = fromLonLat([maxLon, maxLat]);

    // Create properly typed extent array [minX, minY, maxX, maxY]
    const extent: Extent = [
      bottomLeft[0],
      bottomLeft[1],
      topRight[0],
      topRight[1]
    ];
    console.log(this.map.getView().getZoom());
    console.log(this.map.getView().calculateExtent());

    // Fit the view to the extent with appropriate settings
    this.map.getView().fit(extent, {
      size: this.map.getSize(),
      padding: [20, 20, 20, 20]
    });
    this.map.getView().setZoom(14);
    console.log(this.map.getView().calculateExtent());
  }

  renderDelay(): void {
    if (this.renderSubscription) {
      this.renderSubscription.unsubscribe();
    }

    this.renderSubscription = timer(100).subscribe(() => {
      this.render();
    });
  }

  render(): void {
    if (!this.primaryTrack || this.primaryTrack.trkPts.length === 0) {
      return;
    }

    // Check if map is ready
    const size: any = this.map.getSize();
    if (!size) {
      return;
    }

    // Remove any existing SVG overlay
    select('#d3-map').select('svg').remove();

    // Create SVG overlay on top of the OpenLayers map
    this.svg = select('#d3-map')
      .append('svg')
      .attr('width', size[0])
      .attr('height', size[1])
      .style('position', 'absolute')
      .style('top', '0')
      .style('left', '0')
      .style('pointer-events', 'none')
      .style('z-index', '1');

    let gradient: any = this.svg.append('defs').append('radialGradient').attr('id', 'red-gradient');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(255, 0, 0, 0.1)');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(255, 0, 0, 0.75)');

    this.gSelectedPoints = this.svg.append('g').attr('id', 'selected-points');

    let extent: Extent = this.map.getView().calculateExtent(this.map.getSize());

    // Create SVG path string
    let pathData: [number, number, number][] = [];
    let pathString = '';
    this.primaryTrack.trkPts.forEach((point: TrackPoint, i: number) => {
      let p: [number, number] = this.lonLatToPixel(point.lon, point.lat);

      const coordinate = fromLonLat([point.lon, point.lat]);
      if (coordinate[0] > extent[0] && coordinate[0] < extent[2] && coordinate[1] > extent[1] && coordinate[1] < extent[3]) {
        pathData.push([p[0], p[1], i]);
      }

      if (i === 0) {
        pathString += `M ${p[0]} ${p[1]}`;
      } else {
        pathString += ` L ${p[0]} ${p[1]}`;
      }
    });

    // Add path to SVG
    const pathElement = this.svg.append('path')
      .attr('class', 'track')
      .attr('d', pathString)
      .style('fill', 'none')
      .style('stroke', '#0066cc')
      .style('stroke-width', 4)
      .style('opacity', 1.0);

    const cr: number = Math.max(3, Math.min(8, this.el.nativeElement.offsetWidth / 250.0));
    let self = this;
    let scaleColor = scaleLinear([this.primaryTrack.minV, this.primaryTrack.maxV], ['green', 'red']);

    // @ts-ignore
    if (this.map.getView().getResolution() && this.map.getView().getResolution() < 1.0) {
      this.svg.append('g')
        .selectAll()
        .data(pathData)
        .enter()
        .append('circle')
        .attr('cx', function(d: any, i: number) { return d[0]; })
        .attr('cy', function(d: any, i: number) { return d[1]; })
        .attr('r', cr)
        .style('fill', function(d: any, i: number) { return `${scaleColor(self.primaryTrack.trkPts[i].v)}`; })
        .style('fill-opacity', 0.25)
        .style('stroke', function(d: any, i: number) { return `${scaleColor(self.primaryTrack.trkPts[i].v)}`; })
        .style('stroke-width', 2)
        .style('stroke-opacity', 1)
        .style('pointer-events', 'visible')
        .on('click', function(event: any, d: any) {
          if (event.shiftKey) {
            const p: TrackPoint = self.primaryTrack.trkPts[d[2]];
            self.mrGpxSyncService.appendSelectedPoint(p, 'd3-map');
          } else {
            const p: TrackPoint = self.primaryTrack.trkPts[d[2]];
            self.mrGpxSyncService.setSelectedPoint(p, 'd3-map');
          }
        });
    }

    this.renderSelectedPoints();
  }

  renderSelectedPoints(): void {
    let self = this;
    if (!this.svg) {
      return;
    }
    this.svg.select('#selected-points').remove();
    this.gSelectedPoints = this.svg.append('g').attr('id', 'selected-points');
    this.gSelectedPoints.selectAll('circle').remove();

    if (this.selectedPoints.length === 0) {
      return;
    }

    this.gSelectedPoints.selectAll('circle')
      .data(this.selectedPoints)
      .enter()
      .append('circle')
      .attr('cx', (d: any) => {
        const pixel = self.lonLatToPixel(d.lon, d.lat);
        return pixel[0];
      })
      .attr('cy', (d: any) => {
        const pixel = self.lonLatToPixel(d.lon, d.lat);
        return pixel[1];
      })
      .attr('r', 20)
      .attr('class', 'selected-pulse')
      .style('fill', 'url(#red-gradient)')
      .style('stroke', 'red')
      .style('stroke-width', 4)
      .style('opacity', 0.9);
  }

  // Helper function to convert lon/lat to pixel coordinates
  lonLatToPixel(lon: number, lat: number): [number, number] {
    const coordinate = fromLonLat([lon, lat]);
    const pixel = this.map.getPixelFromCoordinate(coordinate);

    return pixel ? [pixel[0], pixel[1]] : [0, 0];
  };

  ngOnDestroy() {
    // Clean up the map
    if (this.map) {
      this.map.setTarget(undefined);
    }
  }
}
