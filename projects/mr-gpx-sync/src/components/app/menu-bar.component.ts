import { Component, HostBinding } from '@angular/core';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatMiniFabButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'mr-gpx-sync-menu-bar',
  template: `
    <button matMiniFab [matMenuTriggerFor]="projectMenu">
      <mat-icon>folder</mat-icon>
    </button>
    <button matMiniFab (click)="settings()">
      <mat-icon>settings</mat-icon>
    </button>
    <button matMiniFab (click)="about()">
      <mat-icon>info</mat-icon>
    </button>

    <mat-menu #projectMenu="matMenu">
      <button mat-menu-item (click)="newProject()">
        <mat-icon>file</mat-icon>
      </button>
      <button mat-menu-item (click)="saveProject()">
        <mat-icon>save</mat-icon>
      </button>
    </mat-menu>
  `,
  imports: [
    MatIcon,
    MatIconModule,
    MatMiniFabButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger
  ],
  styles: [
    ``
  ]
})
export class MrGpxSyncMenuBar {

  @HostBinding('class') classes: string = 'd-flex flex-column';

  newProject(): void {}

  settings(): void {}

  about(): void {}

  saveProject(): void {}
}
