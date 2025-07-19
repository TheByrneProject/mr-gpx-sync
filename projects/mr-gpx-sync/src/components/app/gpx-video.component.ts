import { Component, HostBinding } from '@angular/core';
import { MrGpxSyncD3Map } from '../gpx/d3-map.component';
import { VideoComponent } from '../video.component';

@Component({
  selector: 'mr-gpx-sync-gpx-video',
  template: `
    <mr-gpx-sync-d3-map></mr-gpx-sync-d3-map>

    <mr-gpx-sync-video class="window-overlay"></mr-gpx-sync-video>
  `,
  styles: [],
  imports: [
    MrGpxSyncD3Map,
    VideoComponent
  ]
})
export class MrGpxSyncGpxVideo {

  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column';
}
