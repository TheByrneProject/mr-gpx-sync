import { Component, HostBinding } from '@angular/core';
import { MrGpxSyncD3Map } from '../gpx/d3-map.component';

@Component({
  selector: 'mr-gpx-sync-gpx-only',
  template: `
    <mr-gpx-sync-d3-map></mr-gpx-sync-d3-map>
  `,
  imports: [
    MrGpxSyncD3Map
  ],
  styles: [
    ``
  ]
})
export class MrGpxSyncGpxOnly {

  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column';
}
