import {Component, HostBinding } from "@angular/core";
import {PointInfoComponent} from './point-info.component';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'mr-gpx-sync-info-window',
  standalone: true,
  template: `
    <div class="window-header">
      <button class="btn btn-ghost sm">
        <fa-icon [icon]="['fas', 'ellipsis']" size="sm" class="drag-target"></fa-icon>
      </button>
      <button class="btn btn-ghost sm">
        <fa-icon [icon]="['fas', 'pencil']" size="sm"></fa-icon>
      </button>
    </div>
    <div class="window-content">
      <mr-gpx-sync-point-info></mr-gpx-sync-point-info>
    </div>
  `,
  styles: [],
  imports: [
    PointInfoComponent,
    FaIconComponent
  ]
})
export class InfoWindowComponent {

  @HostBinding('class') classes: string = 'window transparent white';
}
