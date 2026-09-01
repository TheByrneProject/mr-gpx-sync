import { Component, HostBinding, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { AutoAdjustSpeedComponent } from '../point-info-edit/auto-adjust-speed.component';
import { MrGpxSyncService } from '../../services';
import { ActionEvent } from '../../events/action-event';

@Component({
  selector: 'mr-gpx-sync-auto-adjust-speed-window',
  standalone: true,
  template: `
    <div *ngIf="isOpen" id="autoAdjustSpeedWindow" class="window white" style="top: 5rem; left: 50%; transform: translateX(-50%); max-width: 600px; z-index: 1000;">
      <div class="window-header">
        <fa-icon [icon]="['fas', 'ellipsis']" size="sm" class="drag-target"></fa-icon>
        <button class="btn btn-ghost sm" (click)="close()" style="margin-left: auto;">
          <fa-icon [icon]="['fas', 'xmark']" size="1x"></fa-icon>
        </button>
      </div>
      <div class="window-content" style="max-height: 500px; overflow-y: auto;">
        <mr-gpx-sync-auto-adjust-speed (cancel)="close()"></mr-gpx-sync-auto-adjust-speed>
      </div>
    </div>
  `,
  imports: [FaIconComponent, AutoAdjustSpeedComponent, CommonModule],
  styles: []
})
export class AutoAdjustSpeedWindowComponent implements OnInit {
  @HostBinding('class') classes: string = '';

  isOpen: boolean = false;

  constructor(
    private mrGpxSyncService: MrGpxSyncService,
    private changeDetectorRef: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    console.log('AutoAdjustSpeedWindowComponent constructor called');
  }

  ngOnInit(): void {
    console.log('AutoAdjustSpeedWindowComponent ngOnInit called');
    const subscription = this.mrGpxSyncService.action$.subscribe((event: ActionEvent) => {
      console.log('Window component - Received action event:', event.name, event);
      if (event.name === 'open-auto-adjust-speed') {
        console.log('Window component - open-auto-adjust-speed matched');
        this.ngZone.run(() => {
          console.log('Window component - Inside ngZone.run, setting isOpen to true');
          this.isOpen = true;
          this.changeDetectorRef.markForCheck();
          this.changeDetectorRef.detectChanges();
        });
      }
    });
  }

  close(): void {
    console.log('close() called');
    this.isOpen = false;
    this.changeDetectorRef.markForCheck();
    this.changeDetectorRef.detectChanges();
  }
}




