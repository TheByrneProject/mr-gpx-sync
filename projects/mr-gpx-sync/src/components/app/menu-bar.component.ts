import { Component, HostBinding } from '@angular/core';
import {Clipboard} from '@angular/cdk/clipboard';
import {FileSaverService} from 'ngx-filesaver';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import {NzPopoverDirective, NzPopoverModule} from 'ng-zorro-antd/popover';
import { MrGpxSyncService } from '../../services';
import {ActionEvent, TrackEvent} from '../../events';
import {Settings, TrackFile} from '../../gpx';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'mr-gpx-sync-menu-bar',
  template: `
    <button nz-popover [nzPopoverContent]="projectMenu" nzPopoverPlacement="rightTop" nzPopoverOverlayClassName="white" class="btn btn-outline-secondary">
      <fa-icon [icon]="['fas', 'folder']"></fa-icon>
    </button>
    <button nz-popover [nzPopoverContent]="settingsMenu" nzPopoverPlacement="rightTop" nzPopoverOverlayClassName="white" class="btn btn-outline-secondary">
      <fa-icon [icon]="['fas', 'gear']"></fa-icon>
    </button>
    <button nz-popover [nzPopoverContent]="aboutMenu" nzPopoverPlacement="rightTop" nzPopoverOverlayClassName="white" class="btn btn-outline-secondary">
      <fa-icon [icon]="['fas', 'info']"></fa-icon>
    </button>

    <ng-template #projectMenu>
      <div class="popover-menu">
        <button class="btn btn-outline-secondary" (click)="newProject()">
          <fa-icon [icon]="['fas', 'file']"></fa-icon>
          {{ 'menu.newProject' | translate }}
        </button>
        <button class="btn btn-outline-secondary" (click)="save()">
          <fa-icon [icon]="['fas', 'save']"></fa-icon>
          Save To File
        </button>
        <button class="btn btn-outline-secondary" (click)="saveToClipboard()">
          <fa-icon [icon]="['fas', 'copy']"></fa-icon>
          Save To Clipboard
        </button>
      </div>
    </ng-template>

    <ng-template #settingsMenu>
      <div class="d-flex flex-column gap-3">
        <div class="d-flex flex-row gap-3 align-items-center">
          <div class="label">Units</div>
          <button class="btn" [class.btn-primary]="settings.metric" [class.btn-secondary]="!settings.metric" (click)="setMetric(true)">
            Metric
          </button>
          <button class="btn" [class.btn-primary]="!settings.metric" [class.btn-secondary]="settings.metric" (click)="setMetric(false)">
            Imperial
          </button>
        </div>

        <div class="d-flex flex-row gap-3 align-items-center">
          <div class="label">Pace Format</div>
          <button class="btn" [class.btn-primary]="settings.paceMinPer" [class.btn-secondary]="!settings.paceMinPer" (click)="setPaceMinPer(true)">
            {{settings.paceMinPerUnit}}
          </button>
          <button class="btn" [class.btn-primary]="!settings.paceMinPer" [class.btn-secondary]="settings.paceMinPer" (click)="setPaceMinPer(false)">
            {{settings.paceDisPerUnit}}
          </button>
        </div>

        <button class="btn btn-outline-secondary" (click)="resetSettings()">
          <fa-icon [icon]="['fas', 'gear']"></fa-icon>
          Reset Settings
        </button>
      </div>
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
    NzPopoverDirective,
    TranslatePipe
  ],
  styles: [
    ``
  ]
})
export class MrGpxSyncMenuBar {

  @HostBinding('class') classes: string = 'd-flex flex-column';

  settings: Settings = new Settings();
  track: TrackFile = new TrackFile();

  constructor(private mrGpxSyncService: MrGpxSyncService,
              private clipboard: Clipboard,
              private fileSaverService: FileSaverService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });

    this.mrGpxSyncService.track$.subscribe((event: TrackEvent) => {
      this.track = event.track;
    });
  }

  newProject(): void {
    this.mrGpxSyncService.action$.next(new ActionEvent('new-project'));
  }

  about(): void {}

  saveProject(): void {}

  resetSettings(): void {
    this.mrGpxSyncService.updateSettings(new Settings());
  }

  save(): void {
    const blob = new Blob([new XMLSerializer().serializeToString(this.track.writeGpx())], { type: 'text/xml'});
    this.fileSaverService.save(blob, this.track.fileName);
  }

  saveToClipboard(): void {
    this.clipboard.copy(new XMLSerializer().serializeToString(this.track.writeGpx()));
  }

  setMetric(metric: boolean): void {
    this.mrGpxSyncService.setMetric(metric);
  }

  setPaceMinPer(paceMinPer: boolean): void {
    this.mrGpxSyncService.setPaceMinPer(paceMinPer);
  }
}
