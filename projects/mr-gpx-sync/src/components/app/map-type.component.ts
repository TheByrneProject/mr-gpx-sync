import {Component, HostBinding} from '@angular/core';
import {NzPopoverDirective, NzPopoverModule} from 'ng-zorro-antd/popover';
import {NgOptimizedImage} from '@angular/common';
import {MrGpxSyncService} from '../../services/mr-gpx-sync.service';
import {ActionEvent} from '../../events/action-event';

@Component({
  selector: 'mr-gpx-sync-map-type-window',
  standalone: true,
  styles: [`
    .img-btn {
      cursor: pointer;

      img {
        width: 64px;
        height: 64px;
        border-radius: 1rem;
      }
    }

    .img-menu {
      img {
        width: 48px;
        height: 48px;
        border-radius: 1rem;
      }
    }
  `],
  template: `
    <div class="img-btn" nz-popover [nzPopoverContent]="mapTypeMenu" nzPopoverPlacement="right" [nzPopoverVisible]="visible">
      @if (mapType === 'topo') {
        <img ngSrc="assets/map-topo.png" width="64" height="64" alt=""/>
      } @else if (mapType === 'satellite') {
        <img ngSrc="assets/map-satellite.png" width="64" height="64" alt=""/>
      } @else {
        <img ngSrc="assets/map-map.png" width="64" height="64" alt=""/>
      }
    </div>

    <ng-template #mapTypeMenu>
      <div class="d-flex flex-row flex-nowrap gap-3 img-menu">
        <img ngSrc="assets/map-map.png" width="48" height="48" (click)="setMap('topo')" alt="" />
        <img ngSrc="assets/map-satellite.png" width="48" height="48" (click)="setMap('satellite')" alt="" />
        <img ngSrc="assets/map-topo.png" width="48" height="48" (click)="setMap('map')" alt="" />
      </div>
    </ng-template>
  `,
  imports: [
    NzPopoverDirective,
    NzPopoverModule,
    NgOptimizedImage
  ]
})
export class MrGpxSyncMapTypeWindow {

  @HostBinding('class') classes: string = 'btn-window';

  mapType: string = 'topo';
  visible: boolean = true;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  setMap(type: string): void {
    this.visible = false;
    this.mapType = type;
    this.mrGpxSyncService.action$.next(new ActionEvent('set-map-type', {mapType: type}));
  }
}
