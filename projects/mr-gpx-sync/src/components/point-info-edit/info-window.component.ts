import {Component, HostBinding } from '@angular/core';
import {FaIconComponent} from '@fortawesome/angular-fontawesome';
import {NzPopoverDirective} from 'ng-zorro-antd/popover';
import {PointInfoComponent} from './point-info.component';
import {PointDtEditComponent} from './point-dt-edit.component';
import {PointDeleteComponent} from './point-delete.component';
import {SplitComponent} from './split.component';

@Component({
  selector: 'mr-gpx-sync-info-window',
  standalone: true,
  template: `
    <div class="window-header">
      <button class="btn btn-ghost sm">
        <fa-icon [icon]="['fas', 'ellipsis']" size="1x" class="drag-target"></fa-icon>
      </button>
      <button class="btn btn-ghost sm">
        <fa-icon [icon]="['fas', 'pencil']" size="1x" nz-popover [nzPopoverContent]="editMenu" nzPopoverPlacement="top" nzPopoverOverlayClassName="transparent"></fa-icon>
      </button>
    </div>
    <div class="window-content">
      @if (mode === 'dt-edit') {
        <mr-gpx-sync-point-dt-edit (cancel)="mode = 'info'"></mr-gpx-sync-point-dt-edit>
      } @else if (mode === 'delete') {
        <mr-gpx-sync-point-delete (cancel)="mode = 'info'"></mr-gpx-sync-point-delete>
      } @else if (mode === 'split') {
        <mr-gpx-sync-point-split (cancel)="mode = 'info'"></mr-gpx-sync-point-split>
      } @else {
        <mr-gpx-sync-point-info></mr-gpx-sync-point-info>
      }
    </div>

    <ng-template #editMenu>
      <div class="d-flex flex-row flex-nowrap gap-3">
        <button class="btn btn-ghost btn-sm btn-vertical">
          <fa-icon [icon]="['fas', 'circle-xmark']" size="1x" (click)="mode = 'delete'"></fa-icon>
          Delete
        </button>
        <button class="btn btn-ghost btn-sm btn-vertical">
          <fa-icon [icon]="['fas', 'clock']" size="1x" (click)="mode = 'dt-edit'"></fa-icon>
          dt
        </button>
        <button class="btn btn-ghost btn-sm btn-vertical">
          <fa-icon [icon]="['fas', 'scissors']" size="1x" (click)="mode = 'split'"></fa-icon>
          Split
        </button>
      </div>
    </ng-template>
  `,
  styles: [],
  imports: [
    PointInfoComponent,
    FaIconComponent,
    NzPopoverDirective,
    PointDtEditComponent,
    PointDeleteComponent,
    SplitComponent
  ]
})
export class InfoWindowComponent {

  @HostBinding('class') classes: string = 'window transparent white';

  mode: string = 'info';
}
