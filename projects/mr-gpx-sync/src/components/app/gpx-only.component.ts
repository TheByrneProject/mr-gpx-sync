import { Component, HostBinding } from '@angular/core';
import { OpenLayersComponent } from '../openlayers.component';
import { D3MapComponent } from '../gpx/d3-map.component';

@Component({
  selector: 'mr-gpx-sync-gpx-only',
  template: `
    <mr-gpx-sync-d3-map></mr-gpx-sync-d3-map>
  `,
  imports: [
    OpenLayersComponent,
    D3MapComponent
  ],
  styles: [
    ``
  ]
})
export class MrGpxSyncGpxOnly {

  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column';
}
