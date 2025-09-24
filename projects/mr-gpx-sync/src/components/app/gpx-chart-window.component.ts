import { Component, HostBinding } from '@angular/core';
import { ChartComponent } from '../chart.component';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {Settings} from '../../gpx';
import {MrGpxSyncService} from '../../services/mr-gpx-sync.service';

@Component({
  selector: 'mr-gpx-sync-chart-window',
  template: `
    <div class="window-header">
      <fa-icon [icon]="['fas', 'ellipsis']" size="sm" class="drag-target"></fa-icon>
    </div>
    <div class="window-content">
      <mr-gpx-sync-chart [style.width]="settings.windows.chartWindow.width" [style.height]="settings.windows.chartWindow.height" class="p-3"></mr-gpx-sync-chart>
    </div>
  `,
  styles: [],
  imports: [
    ChartComponent,
    FaIconComponent
  ]
})
export class MrGpxSyncChartWindow {

  @HostBinding('class') classes: string = 'window transparent white';

  settings: Settings = new Settings();

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });
  }
}
