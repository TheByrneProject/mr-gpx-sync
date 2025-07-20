import { Component, HostBinding } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {NzPopoverDirective, NzPopoverModule} from 'ng-zorro-antd/popover';
import { MrGpxSyncService } from '../../services';
import { ActionEvent } from '../../events';

@Component({
  selector: 'mr-gpx-sync-menu-bar',
  template: `
    <button nz-popover nzPopoverContent="projectMenu" nzPopoverPlacement="rightTop" class="btn btn-outline-secondary">
      <fa-icon [icon]="['fas', 'folder']"></fa-icon>
    </button>
    <button nz-popover nzPopoverContent="settingsMenu" nzPopoverPlacement="rightTop" class="btn btn-outline-secondary">
      <fa-icon [icon]="['fas', 'gear']"></fa-icon>
    </button>
    <button nz-popover nzPopoverContent="aboutMenu" nzPopoverPlacement="rightTop" class="btn btn-outline-secondary">
      <fa-icon [icon]="['fas', 'info']"></fa-icon>
    </button>

    <ng-template #projectMenu>
      <div class="popover-menu">
        <button class="btn btn-outline-secondary" (click)="newProject()">
          <fa-icon [icon]="['fas', 'file']"></fa-icon>
          New Project
        </button>
        <button class="btn btn-outline-secondary" (click)="saveProject()">
          <fa-icon [icon]="['fas', 'save']"></fa-icon>
          Save To File
        </button>
        <button class="btn btn-outline-secondary" (click)="saveProject()">
          <fa-icon [icon]="['fas', 'copy']"></fa-icon>
          Save To Clipboard
        </button>
      </div>
    </ng-template>

    <ng-template #settingsMenu>
    </ng-template>

    <ng-template #aboutMenu>
      <div class="popover-menu">
        v0.0.1
      </div>
    </ng-template>
  `,
  imports: [
    FaIconComponent,
    NzPopoverModule,
    NzPopoverDirective
  ],
  styles: [
    ``
  ]
})
export class MrGpxSyncMenuBar {

  @HostBinding('class') classes: string = 'd-flex flex-column';

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  newProject(): void {
    this.mrGpxSyncService.action$.next(new ActionEvent('new-project'));
  }

  settings(): void {}

  about(): void {}

  saveProject(): void {}
}
