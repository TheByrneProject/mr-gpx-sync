import { Component, HostBinding, OnInit } from '@angular/core';

import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { ActionEvent } from '../events/action-event';
import {
  AppendPointComponent,
  AppendTrackComponent,
  ChangeDtComponent,
  CompressComponent,
  OpenWizardComponent,
  SplitComponent,
  UpdatePointComponent
} from '../actions';

@Component({
  selector: 'mr-gpx-sync-action',
  template: `
    <mr-gpx-sync-open-wizard *ngIf="action?.name === 'action-open-wizard'"></mr-gpx-sync-open-wizard>
    <mr-gpx-sync-compress *ngIf="action?.name === 'action-compress'"></mr-gpx-sync-compress>
    <mr-gpx-sync-change-dt *ngIf="action?.name === 'action-change-dt'"></mr-gpx-sync-change-dt>
    <mr-gpx-sync-split *ngIf="action?.name === 'action-split'"></mr-gpx-sync-split>
    <mr-gpx-sync-update-point *ngIf="action?.name === 'action-update-point'"></mr-gpx-sync-update-point>
    <mr-gpx-sync-append-track-wizard *ngIf="action?.name?.endsWith('end-track')"></mr-gpx-sync-append-track-wizard>
    <mr-gpx-sync-append-point-wizard *ngIf="action?.name?.endsWith('end-point')"></mr-gpx-sync-append-point-wizard>
  `,
  imports: [
    OpenWizardComponent,
    CompressComponent,
    ChangeDtComponent,
    SplitComponent,
    UpdatePointComponent,
    AppendTrackComponent,
    AppendPointComponent
  ],
  styles: [`
    .inactive {
      color: grey;
    }
  `]
})
export class ActionComponent implements OnInit {

  @HostBinding('class') classes: string = 'd-flex';

  action!: ActionEvent;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.action$.subscribe((action: ActionEvent) => {
      this.action = action;
    });
  }
}
