import { Component, ElementRef, HostBinding, HostListener, OnInit, ViewChild } from '@angular/core';

import * as d3 from 'd3';

import { TrackPoint } from '../gpx/track-point';
import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { Settings } from '../gpx/settings';
import { TrackPointEvent } from '../events/track-point-event';
import { ActionEvent } from '../events/action-event';
import { TrackFile } from '../gpx/track-file';
import { DecimalPipe } from '@angular/common';
import { SecondsToTime } from '../pipes';

@Component({
  selector: 'mr-gpx-sync-chart',
  template: `
    @if (data && data.length > 0) {
      <div class="d-flex m-2" style="margin-left: 70px !important;">
        <!--
        <mat-icon [matMenuTriggerFor]="pointMenu" class="me-3">my_location</mat-icon>
        <mat-menu #pointMenu="matMenu">
          <button (click)="changeDt()" [disabled]="selectedPoints.length !== 1">Change Dt</button>
          <button (click)="interpolate()" [disabled]="selectedPoints.length !== 1">Interpolate After
            (beta)
          </button>
          <button (click)="split()" [disabled]="selectedPoints.length !== 1">Split</button>
          <button (click)="updatePoint()" [disabled]="selectedPoints.length !== 1">Update Position
          </button>
          <mat-divider></mat-divider>
          <button (click)="delete()" [disabled]="selectedPoints.length === 0">Delete</button>
        </mat-menu>

        <mat-icon [matMenuTriggerFor]="chartMenu" class="me-3">show_chart</mat-icon>
        <mat-menu #chartMenu="matMenu">
          <button (click)="compress()">Compress</button>
        </mat-menu>
        -->
      </div>
      <div class="d-flex flex-row flex-nowrap h-50">
        <div #zoomChart class="w-100 h-100 d-block"></div>
        <!--
      <div class="w-25 h-100 y-auto">
        <table mat-table [dataSource]="tableData" (contentChanged)="contentChanged()" class="flex-grow-1 w-100">
          <ng-container matColumnDef="time">
            <th mat-header-cell *matHeaderCellDef>Time</th>
            <td mat-cell *matCellDef="let element">{{ element.t | secToTime : trackFile.getTrack().timeFormat }}</td>
          </ng-container>
          <ng-container matColumnDef="ele">
            <th mat-header-cell *matHeaderCellDef>Elev</th>
            <td mat-cell *matCellDef="let element">{{ settings.getElevation(element.ele) | number : '1.0-1' }}</td>
          </ng-container>
          <ng-container matColumnDef="pace">
            <th mat-header-cell *matHeaderCellDef>Pace</th>
            <td mat-cell *matCellDef="let element">{{ settings.getPaceDisplay(element.v) }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row
              [id]="'table-p-' + row.id"
              *matRowDef="let row; columns: displayedColumns;"
              [class.selected]="isSelected(row.id)"
              (click)="selectPoint(row)"></tr>
        </table>
      </div>
        -->
      </div>
      <div #fullChart class="w-100 h-50 d-block"></div>
    }
  `,
  imports: [
    DecimalPipe,
    SecondsToTime
  ],
  styles: [`
      #top-panel {
        height: 50%;
      }

      #table {
        height: 50%;
        overflow-y: auto;
      }
  `]
})
export class ChartComponent implements OnInit {

  @HostBinding('class') classes: string = 'flex-column';

  fullChart!: ElementRef<any>;
  fullSvg: any;
  fullX: any;
  fullEle: any;
  fullV: any;
  fullWidth: any;
  fullHeight: any;

  zoomChart!: ElementRef<any>;
  zoomSvg: any;
  zoomX: any;
  zoomV: any;
  zoomEle: any;
  zoomWidth: any;
  zoomHeight: any;

  brush: any;
  zoomSize: number = 0.05;

  trackFile: TrackFile = new TrackFile();
  data: TrackPoint[] = [];
  settings: Settings = new Settings();

  initialized: boolean = false;
  clickEvent: boolean = false;
  internalZoom: boolean = true;
  selectedPoints: TrackPoint[] = [];

  MIN_RED_A: number = 0.1;
  MAX_RED_A: number = 0.5;

  tableData: TrackPoint[] = [];
  displayedColumns: string[] = ['time', 'ele', 'pace'];

  brushX0: number = 0;
  brushX1: number = 0;
  brushT: number = 0;

  isSelected(id: number): boolean {
    return this.selectedPoints.find((p: TrackPoint) => p.id === id) !== undefined;
  }

  /**
   * Elevation function for d3 Y function (considers units).
   */
  elevation: (p: TrackPoint) => number = (p: TrackPoint) => {
    return this.settings.getElevation(p.ele);
  }

  /**
   * Pace function for d3 Y function (considers units).
   */
  pace: (p: TrackPoint) => number = (p: TrackPoint) => {
    if (p.v === 0) {
      return 0.0;
    }
    return this.settings.getPace(p.v);
  }

  /**
   * Click listener for d3 points representing a trackPoint.
   */
  pointClick: (event: any, p: any) => void = (event, p) => {
    if (p) {
      this.selectPoint(p, true, event);
    }
  }

  /**
   * Mouseover listener for d3 points representing a trackPoint.  Styling for hover.
   */
  pointHover: (event: any, p: any) => void = (event, p) => {
    this.zoomSvg.select('#' + event.target.id)
      .attr('fill', 'orange');
  }

  /**
   * Mouseout listener for d3 points representing a trackPoint.  Reverse hover styling.
   */
  pointOut: (event: any, p: any) => void = (event, p) => {
    this.zoomSvg.select('#' + event.target.id)
      .attr('fill', 'darkgreen');
  }

  /**
   * Draws the zoom svg upon brush movement which is called upon init.  Draw elevation and pace.
   */
  updateZoom: (x0: number, x1: number) => void = (x0: number, x1: number) => {
    if (Math.abs(this.brushX0 - x0) <= 1 && Math.abs(this.brushX1 - x1) <= 1) {
      this.internalZoom = true;
      return;
    }
    this.brushX0 = x0;
    this.brushX1 = x1;
    this.mrGpxSyncService.log('chart.updateZoom: ' + this.internalZoom);

    if (this.internalZoom && !this.clickEvent) {
      this.zoomSize = (x1 - x0) / this.fullWidth;
      const t: number = Math.floor(this.fullX.invert((x1 + x0) / 2.0));
      const p: TrackPoint | undefined = this.trackFile.getTrack().getClosestPoint(t);
      if (this.initialized
          && p
          && (!this.mrGpxSyncService.selectedPoint$.value.p || p.id !== this.mrGpxSyncService.selectedPoint$.value.p.id)) {
        this.selectedPoints = [p];
        this.mrGpxSyncService.setSelectedPoint(TrackPoint.from(p), 'chart');
      }
    }

    this.drawZoom(x0, x1);

    this.clickEvent = false;
    this.internalZoom = true;
  }

  brushed: (data: any) => void = (data: any) => {
    if (data && data.selection) {
      this.updateZoom(Math.floor(data.selection[0]), Math.ceil(data.selection[1]));
    }
  }

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
      if (this.initialized) {
        this.render();
        this.drawZoom(this.brushX0, this.brushX1);
      } else {
        this.render();
        this.drawZoomInit();
      }
    });

    this.mrGpxSyncService.track$.subscribe((trackFile: TrackFile) => {
      this.trackFile = trackFile.loaded ? trackFile : new TrackFile();

      this.mrGpxSyncService.log('TableComponent.track$ Updated: n=' + this.trackFile.getTrack().trkPts.length);
      this.data = [...this.trackFile.getTrack().trkPts];
      this.tableData = this.data.slice(0, 7);
      this.render();
      this.drawZoomInit();
    });

    this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      if (e.source !== 'chart' && e?.p) {
        this.selectPoint(e.p, false);
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.render();
    this.drawZoomInit();
  }

  @ViewChild('fullChart') set setFullChart(fullChart: ElementRef) {
    this.fullChart = fullChart;

    if (this.fullChart && this.zoomChart) {
      this.render();
      this.drawZoomInit();
    }
  }

  @ViewChild('zoomChart') set setZoomChart(zoomChart: ElementRef) {
    this.zoomChart = zoomChart;

    if (this.fullChart && this.zoomChart) {
      this.render();
      this.drawZoomInit();
    }
  }

  contentChanged(): void {
    this.mrGpxSyncService.log('TableComponent.contentChanged');
    this.mrGpxSyncService.loading$.next(false);
  }

  changeDt(): void {
    if (this.selectedPoints.length > 0) {
      this.mrGpxSyncService.action$.next(new ActionEvent('action-change-dt', this.selectedPoints));
    } else {
      this.mrGpxSyncService.openSnackBar('No point selected!');
    }
  }

  delete(): void {
    if (this.selectedPoints.length > 0) {
      this.mrGpxSyncService.delete(this.selectedPoints);
    } else {
      this.mrGpxSyncService.openSnackBar('No point selected!');
    }
  }

  split(): void {
    if (this.selectedPoints.length > 0) {
      this.mrGpxSyncService.action$.next(new ActionEvent('action-split', this.selectedPoints));
    } else {
      this.mrGpxSyncService.openSnackBar('No point selected!');
    }
  }

  interpolate(): void {
    if (this.selectedPoints.length === 1) {
      this.mrGpxSyncService.interpolate(this.selectedPoints[0]);
    } else {
      this.mrGpxSyncService.openSnackBar('No point selected!');
    }
  }

  updatePoint(): void {
    if (this.selectedPoints.length > 0) {
      this.mrGpxSyncService.action$.next(new ActionEvent('action-update-point', this.selectedPoints));
    } else {
      this.mrGpxSyncService.openSnackBar('No point selected!');
    }
  }

  compress() {
    this.mrGpxSyncService.action$.next(new ActionEvent('action-compress'));
  }

  selectPoint(p: TrackPoint, internalZoom: boolean = true, clickEvent?: PointerEvent): void {
    if (!p) {
      return;
    }

    this.internalZoom = internalZoom;
    this.clickEvent = clickEvent !== undefined;

    if (internalZoom) {
      this.mrGpxSyncService.setSelectedPoint(TrackPoint.from(p), 'chart');
    }
    if (clickEvent && clickEvent.ctrlKey && this.selectedPoints.length > 0) {
      this.selectedPoints = this.trackFile.getTrack().getSubTrackByIds(
        Math.min(p.id, this.selectedPoints[0].id),
        Math.max(p.id, this.selectedPoints[this.selectedPoints.length - 1].id));
    } else {
      this.selectedPoints = [p];
    }
    this.moveBrushToSelected();
    this.tableData = this.data.slice(Math.max(p.id - 3, 0), Math.min(this.data.length, p.id + 4));

    let self = this;
    this.zoomSvg.selectAll('#selected-point').remove();
    this.zoomSvg.select('#zoom-line').selectAll('selectedPoint')
      .data(this.selectedPoints)
      .enter()
      .append('circle')
      .attr('id', 'selected-point')
      .attr('fill', 'darkred')
      .attr('stroke', 'red')
      .attr('stroke-width', 1)
      .attr('cx', function(d: any) {
        return self.zoomX(d.t);
      })
      .attr('cy', function(d: any) {
        return self.zoomV(self.settings.getPace(d.v));
      })
      .attr('r', 6);
  }

  moveBrushToSelected(): void {
    if (!this.fullX || !this.fullWidth || !this.brush) {
      return;
    }

    const dt: number = Math.ceil(this.fullX.invert(this.fullWidth * this.zoomSize));

    const t: number = this.selectedPoints[0].t;
    const t0: number = Math.floor(t - dt / 2.0);
    const t1: number = Math.ceil(t + dt / 2.0);

    if (t0 < this.brushT && this.brushT < t1) {
      return;
    } else {
      this.brushT = t;
    }

    if (t0 < 0) {
      this.fullSvg.select('#brush').call(this.brush.move, [0, this.fullWidth * this.zoomSize]);
    } else if (t1 > this.trackFile.getTrack().getEnd().t) {
      this.fullSvg.select('#brush').call(this.brush.move, [this.fullWidth - this.fullWidth * this.zoomSize, this.fullWidth]);
    } else {
      this.fullSvg.select('#brush').call(this.brush.move, [this.fullX(t0), this.fullX(t1)]);
    }
  }

  render(): void {
    this.mrGpxSyncService.loading$.next(false);

    if (!this.data || this.data.length === 0) {
      return;
    }
    if (!this.fullChart || !this.zoomChart) {
      return;
    }

    const eW: number = this.fullChart.nativeElement.offsetWidth;
    const eH: number = this.fullChart.nativeElement.offsetHeight;
    const self = this;

    const margin = {top: 20, right: 50, bottom: 30, left: 50};
    this.fullWidth = eW - margin.left - margin.right;
    this.fullHeight = eH - margin.top - margin.bottom;

    // Full
    d3.select(this.fullChart.nativeElement).selectAll('*').remove();
    this.fullSvg = d3.select(this.fullChart.nativeElement).append('svg')
      .attr('width', this.fullWidth + margin.left + margin.right)
      .attr('height', this.fullHeight + margin.top + margin.bottom)
      .style('display', 'block')
      .append('g')
      .attr('transform',
        'translate(' + margin.left + ',' + margin.top + ')');

    let minEle: number = d3.min(this.data, this.elevation);
    let maxEle: number = d3.max(this.data, this.elevation);
    let minV: number = d3.min(this.data, this.pace);
    let maxV: number = d3.max(this.data, this.pace);

    this.fullX = d3.scaleLinear().domain([this.data[0].t, this.data[this.data.length - 1].t]).range([0, this.fullWidth]);
    this.fullEle = d3.scaleLinear()
      .domain([minEle, maxEle])
      .range([this.fullHeight, 0]);
    this.fullV = d3.scaleLinear()
      .domain([minV, maxV])
      .range([this.fullHeight, 0]);

    // Add the X Axis
    const xAxisGenerator = d3.axisBottom(this.fullX)
      .ticks(6)
      .tickFormat((d: any, i: number) => {
        const s = d % 60;
        const m = Math.floor(d / 60.0);
        return m + ':' + (s < 10 ? '0' + s : s);
      })
      .scale(this.fullX);
    const xAxis = this.fullSvg.append('g')
      .attr('transform', 'translate(0, ' + this.fullHeight + ')')
      .call(xAxisGenerator);

    let defs = this.fullSvg.append('defs');

    let clip = defs.append('fullSvg:clipPath')
      .attr('id', 'fullClip')
      .append('fullSvg:rect')
      .attr('width', this.fullWidth )
      .attr('height', this.fullHeight )
      .attr('x', 0)
      .attr('y', 0);

    let paceGradient = defs.append('linearGradient')
      .attr('id', 'paceGradient')
      .attr('gradientTransform', 'rotate(90)');
    if (this.settings.paceMinPer) {
      paceGradient.append('stop')
        .attr('stop-color', 'red')
        .attr('offset', '0');
      paceGradient.append('stop')
        .attr('stop-color', 'green')
        .attr('offset', '0.5');
    } else {
      paceGradient.append('stop')
        .attr('stop-color', 'green')
        .attr('offset', '0.8');
      paceGradient.append('stop')
        .attr('stop-color', 'red')
        .attr('offset', '1');
    }

    let line = this.fullSvg.append('g')
      .attr('clip-path', 'url(#fullClip)');

    this.brush = d3.brushX()
      .extent( [ [0, 0], [this.fullWidth, this.fullHeight] ] )
      .on('end', this.brushed);

    // Add Elevation Area
    line.append('path')
      .datum(this.data)
      .attr('fill', 'rgba(70, 130, 180, 1.0)')
      .attr('fill-opacity', 0.3)
      .attr('stroke', 'none')
      .attr('d', d3.area()
        .x(function(d: any) { return self.fullX(d.t); })
        .y0(this.fullHeight)
        .y1(function(d: any) { return self.fullEle(self.settings.getElevation(d.ele)); })
      );
    // Add Elevation Line
    line.append('path')
      .datum(this.data)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(70, 130, 180, 1.0)')
      .attr('stroke-width', 2.5)
      .attr('d', d3.line()
        .x((d: any) => { return self.fullX(d.t); })
        .y((d: any) => { return self.fullEle(self.settings.getElevation(d.ele)); })
      );
    // Add Pace Line
    line.append('path')
      .datum(this.data.slice(0, this.data.length - 1))
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', 'url(#paceGradient)')
      .attr('stroke-width', 1.5)
      .attr('d', d3.line()
        .x((d: any) => { return self.fullX(d.t); })
        .y((d: any) => { return self.fullV(self.settings.getPace(d.v)); })
      );

    // Zoom
    d3.select(this.zoomChart.nativeElement).selectAll('*').remove();
    const zoomW: number = this.zoomChart.nativeElement.offsetWidth;
    const zoomH: number = this.zoomChart.nativeElement.offsetHeight;

    const zoomMargin = {top: 5, right: 60, bottom: 50, left: 70};
    this.zoomWidth = zoomW - zoomMargin.left - zoomMargin.right;
    this.zoomHeight = zoomH - zoomMargin.top - zoomMargin.bottom;

    this.zoomX = d3.scaleLinear().domain([this.data[0].t, this.data[this.data.length - 1].t]).range([0, this.zoomWidth]);
    this.zoomEle = d3.scaleLinear()
      .domain([minEle, maxEle])
      .range([this.zoomHeight, 0]);
    this.zoomV = d3.scaleLinear()
      .domain([minV, maxV])
      .range([this.zoomHeight, 0]);

    this.zoomSvg = d3.select(this.zoomChart.nativeElement).append('svg')
      .attr('width', this.zoomWidth + zoomMargin.left + zoomMargin.right)
      .attr('height', this.zoomHeight + zoomMargin.top + zoomMargin.bottom)
      .style('display', 'block')
      .append('g')
      .attr('transform',
        'translate(' + zoomMargin.left + ',' + zoomMargin.top + ')');

    // Add the X Axis
    const zoomXAxisGenerator = d3.axisBottom(this.fullX)
      .ticks(6)
      .tickFormat(function(d: any) {
        const s = d % 60;
        const m = Math.floor(d / 60.0);
        return m + ':' + (s < 10 ? '0' + s : s);
      })
      .scale(this.zoomX);
    const zoomXAxis = this.zoomSvg.append('g')
      .attr('id', 'zoom-x-axis')
      .attr('transform', 'translate(0,' + this.zoomHeight + ')')
      .call(zoomXAxisGenerator);

    // Add the Y Axis
    const zoomEleAxis = this.zoomSvg.append('g')
      .call(d3.axisLeft(this.zoomEle).ticks(5));
    const zoomVAxis = this.zoomSvg.append('g')
      .attr('transform', 'translate(' + this.zoomWidth + ', 0)')
      .call(d3.axisRight(this.zoomV).ticks(5));

    // Axis Titles
    this.zoomSvg.append('text')
      .style('fill', 'white')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('y', -zoomMargin.left + 20)
      .attr('x', -this.zoomHeight / 2)
      .text('Elevation (' + this.settings.eleUnits + ')');
    this.zoomSvg.append('text')
      .style('fill', 'white')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('y', this.zoomWidth + zoomMargin.left - 20)
      .attr('x', -this.zoomHeight / 2)
      .text('Pace (' + this.settings.paceUnits + ')');
    this.zoomSvg.append('text')
      .style('fill', 'white')
      .attr('text-anchor', 'middle')
      .attr('y', this.zoomHeight + 40)
      .attr('x', (this.zoomWidth / 2) - 30)
      .text('Zoomed in Time');

    let zoomClip = this.zoomSvg.append('defs').append('zoomSvg:clipPath')
      .attr('id', 'zoomClip')
      .append('zoomSvg:rect')
      .attr('width', this.zoomWidth )
      .attr('height', this.zoomHeight + zoomMargin.top)
      .attr('x', 0)
      .attr('y', -zoomMargin.top);

    let zoomLine = this.zoomSvg.append('g')
      .attr('id', 'zoom-line')
      .attr('clip-path', 'url(#zoomClip)');

    if (!this.brushX0 && !this.brushX1) {
      this.brushX0 = 0;
      this.brushX1 = Math.floor(this.fullWidth * this.zoomSize);
    }
    this.fullSvg.append('g')
      .attr('id', 'brush')
      .call(this.brush)
      .call(this.brush.move, [this.brushX0, this.brushX1]);

    this.initialized = true;
  }

  drawZoomInit(): void {
    this.drawZoom(0, Math.floor(this.fullWidth * this.zoomSize));
  }

  drawZoom(x0: number, x1: number): void {
    if (!this.zoomX || !this.zoomEle) {
      return;
    }
    const self = this;
    const t0: number = Math.floor(this.fullX.invert(x0));
    const t1: number = Math.ceil(this.fullX.invert(x1));
    this.zoomX.domain([t0, t1]);

    this.zoomSvg.select('#zoom-x-axis').remove();
    const zoomXAxisGenerator = d3.axisBottom(this.fullX)
      .ticks(6)
      .tickFormat(function(d: any) {
        const s = d % 60;
        const m = Math.floor(d / 60.0);
        return m + ':' + (s < 10 ? '0' + s : s);
      })
      .scale(this.zoomX);
    const zoomXAxis = this.zoomSvg.append('g')
      .attr('id', 'zoom-x-axis')
      .attr('transform', 'translate(0,' + this.zoomHeight + ')')
      .call(zoomXAxisGenerator);

    const zoomLine = this.zoomSvg.select('#zoom-line');
    zoomLine.selectAll('*').remove();
    // Add area, line, points
    zoomLine.append('path')
      .datum(this.data)
      .attr('fill', 'rgba(70, 130, 180, 1)')
      .attr('fill-opacity', 0.3)
      .attr('stroke', 'none')
      .attr('d', d3.area()
        .x(function(d: any) { return self.zoomX(d.t); })
        .y0(this.zoomHeight)
        .y1(function(d: any) { return self.zoomEle(self.settings.getElevation(d.ele)); })
      );
    zoomLine.append('path')
      .datum(this.data)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(70, 130, 180, 1.0)')
      .attr('stroke-width', 2.5)
      .attr('d', d3.line()
        .x((d: any) => { return self.zoomX(d.t); })
        .y((d: any) => { return self.zoomEle(self.settings.getElevation(d.ele)); })
      );
    zoomLine.append('path')
      .datum(this.data.slice(0, this.data.length - 1))
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', 'green')
      .attr('stroke-width', 1.5)
      .attr('d', d3.line()
        .x((d: any) => { return self.zoomX(d.t); })
        .y((d: any) => { return self.zoomV(self.settings.getPace(d.v)); })
      );
    zoomLine.selectAll('points')
      .data(this.trackFile.getTrack().getSubTrackByTimes(t0, t1))
      .enter()
      .append('circle')
      .attr('id', function(d: any) { return 'circle-' + d.id; })
      .attr('fill', 'darkgreen')
      .attr('stroke', 'green')
      .attr('stroke-width', 1)
      .attr('cx', function(d: any) { return self.zoomX(d.t); })
      .attr('cy', function(d: any) { return self.zoomV(self.settings.getPace(d.v)); })
      .attr('r', 6)
      .on('click', this.pointClick)
      .on('mouseover', this.pointHover)
      .on('mouseout', this.pointOut);

    if (this.selectedPoints.length > 0) {
      zoomLine.selectAll('#selected-point').remove();
      zoomLine.selectAll('selectedPoint')
        .data(this.selectedPoints)
        .enter()
        .append('circle')
        .attr('id', 'selected-point')
        .attr('fill', 'darkred')
        .attr('stroke', 'red')
        .attr('stroke-width', 1)
        .attr('cx', (d: any) => {
          return self.zoomX(d.t);
        })
        .attr('cy', (d: any) => {
          return self.zoomV(self.settings.getPace(d.v));
        })
        .attr('r', 6);
    }
  }
}
