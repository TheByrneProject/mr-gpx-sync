import {Component, HostBinding } from '@angular/core';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {EditToolsComponent} from './edit-tools.component';
import {PointInfoComponent} from './point-info.component';
import {DrawTrackComponent} from './draw-track.component';
import {NormalizeElevationComponent} from './normalize-elevation.component';
import {PointDtEditComponent} from './point-dt-edit.component';
import {PointDeleteComponent} from './point-delete.component';
import {SplitComponent} from './split.component';
import {AutoAdjustSpeedComponent} from './auto-adjust-speed.component';

@Component({
  selector: 'mr-gpx-sync-info-window',
  standalone: true,
  template: `
    <div class="window-header">
      <button class="btn btn-ghost sm">
        <fa-icon [icon]="['fas', 'ellipsis']" size="1x" class="drag-target"></fa-icon>
      </button>
      <button class="btn btn-ghost sm">
        <fa-icon [icon]="['fas', 'pencil']" size="1x" (click)="mode = 'edit'"></fa-icon>
      </button>
    </div>
    <div class="window-content">
      @if (mode === 'dt-edit') {
        <mr-gpx-sync-point-dt-edit (cancel)="mode = 'info'"></mr-gpx-sync-point-dt-edit>
      } @else if (mode === 'delete') {
        <mr-gpx-sync-point-delete (cancel)="mode = 'info'"></mr-gpx-sync-point-delete>
      } @else if (mode === 'split') {
        <mr-gpx-sync-point-split (cancel)="mode = 'info'"></mr-gpx-sync-point-split>
      } @else if (mode === 'edit') {
        <mr-gpx-sync-edit-tools (select)="mode = $event" (cancel)="mode = 'info'"></mr-gpx-sync-edit-tools>
      } @else if (mode === 'draw-track') {
        <mr-gpx-sync-draw-track (cancel)="mode = 'info'"></mr-gpx-sync-draw-track>
      } @else if (mode === 'normalize-elevation') {
        <mr-gpx-sync-normalize-elevation (cancel)="mode = 'info'"></mr-gpx-sync-normalize-elevation>
      } @else if (mode === 'auto-adjust-speed') {
        <mr-gpx-sync-auto-adjust-speed (cancel)="mode = 'info'"></mr-gpx-sync-auto-adjust-speed>
      } @else {
        <mr-gpx-sync-point-info></mr-gpx-sync-point-info>
      }
    </div>
  `,
  styles: [],
  imports: [
    PointInfoComponent,
    FaIconComponent,
    PointDtEditComponent,
    PointDeleteComponent,
    SplitComponent,
    EditToolsComponent,
    DrawTrackComponent,
    NormalizeElevationComponent,
    AutoAdjustSpeedComponent
  ]
})
export class InfoWindowComponent {

  @HostBinding('class') classes: string = 'window transparent white';

  mode: string = 'info';
}
