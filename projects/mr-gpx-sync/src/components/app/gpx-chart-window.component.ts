import { Component, HostBinding } from '@angular/core';
import { ChartComponent } from '../chart.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'mr-gpx-sync-chart-window',
  template: `
    <div class="window-header">
      <fa-icon [icon]="['fas', 'ellipsis']" size="sm"></fa-icon>
    </div>
    <div class="window-content">
      <mr-gpx-sync-chart style="width: 35vw; height: 30vh;"></mr-gpx-sync-chart>
    </div>
  `,
  styles: [],
  imports: [
    ChartComponent,
    FaIconComponent
  ]
})
export class MrGpxSyncChartWindow {

  @HostBinding('class') classes: string = 'window transparent';
}
