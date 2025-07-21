import {Component, HostBinding} from '@angular/core';
import {NzPopoverDirective, NzPopoverModule} from 'ng-zorro-antd/popover';
import {NgOptimizedImage} from '@angular/common';
import {MrGpxSyncService} from '../../services/mr-gpx-sync.service';
import {ActionEvent} from '../../events/action-event';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'mr-gpx-sync-map-type-window',
  standalone: true,
  styles: [`
    .img-btn, .img-menu-item {
      position: relative;
      cursor: pointer;

      img {
        width: 64px;
        height: 64px;
        border-radius: 1rem;
      }
    }

    .img-menu {
      img {
        width: 64px;
        height: 64px;
        border-radius: 1rem;
        cursor: pointer;
      }
    }

    .img-btn-overlay {
      position: absolute;
      bottom: 2px;
      left: 0;
      right: 0;
      color: rgba(0, 0, 0, 0.75);
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;

      .label {
        font-size: 0.75rem;
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
      <div class="img-btn-overlay">
        <fa-icon [icon]="['fas', 'layer-group']" size="xs"></fa-icon>
        <div class="label">Layers</div>
      </div>
    </div>

    <ng-template #mapTypeMenu>
      <div class="d-flex flex-row flex-nowrap gap-3 img-menu">
        <div class="img-menu-item">
          <img ngSrc="assets/map-map.png" width="64" height="64" (click)="setMap('map')" alt="" />
          <div class="img-btn-overlay">
            <div class="label">Map</div>
          </div>
        </div>
        <div class="img-menu-item">
          <img ngSrc="assets/map-satellite.png" width="64" height="64" (click)="setMap('satellite')" alt="" />
          <div class="img-btn-overlay">
            <div class="label" style="color: rgba(255, 255, 255, 0.75);">Satellite</div>
          </div>
        </div>
        <div class="img-menu-item">
          <img ngSrc="assets/map-topo.png" width="64" height="64" (click)="setMap('topo')" alt="" />
          <div class="img-btn-overlay">
            <div class="label">Topo</div>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  imports: [
    NzPopoverDirective,
    NzPopoverModule,
    NgOptimizedImage,
    FaIconComponent
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
