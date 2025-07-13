import { Component, HostBinding, OnInit } from '@angular/core';

import { MrGpxSyncService } from '../services/mr-gpx-sync.service';

@Component({
  selector: 'mr-gpx-sync-map-sync',
  template: `
    Map
  `,
  styles: [
    ``
  ]
})
export class MapComponent implements OnInit {

  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column';

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit() {}

}
