import {Component, HostBinding } from "@angular/core";
import {PointInfoComponent} from './point-info.component';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'mr-gpx-sync-info-window',
  standalone: true,
  template: `
    <div class="window-header">
      <fa-icon [icon]="['fas', 'ellipsis']" size="sm" class="drag-target"></fa-icon>
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
