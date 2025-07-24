import {Component, HostBinding} from '@angular/core';
import {TrackInfoComponent} from './track-info.component';

@Component({
  selector: 'mr-gpx-sync-track-info-window',
  standalone: true,
  template: `
    <div class="window-content">
      <mr-gpx-sync-track-info></mr-gpx-sync-track-info>
    </div>
  `,
  imports: [
    TrackInfoComponent
  ],
  styles: []
})
export class TrackInfoWindowComponent {

  @HostBinding('class') classes: string = 'window transparent rounded';
}
