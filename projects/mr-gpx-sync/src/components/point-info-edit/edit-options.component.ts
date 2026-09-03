import { Component, Input, EventEmitter, Output, OnInit } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { MrGpxSyncService } from '../../services';
import { TrackPointEvent } from '../../events';

type ViewType = 'track' | 'point' | 'multi-point';

@Component({
  selector: 'mr-gpx-sync-edit-options',
  standalone: true,
  template: `
    <div class="edit-options d-flex flex-column gap-2 p-2">
      @if (viewType === 'track') {
        <button class="btn btn-ghost btn-edit-icon" (click)="select.emit('draw-track')">
          <fa-icon [icon]="['fas','pen']" size="1x"></fa-icon>
          <span>Draw</span>
        </button>
        <button class="btn btn-ghost btn-edit-icon" (click)="select.emit('normalize-elevation')">
          <fa-icon [icon]="['fas','mountain']" size="1x"></fa-icon>
          <span>Normalize</span>
        </button>
        <button class="btn btn-ghost btn-edit-icon" (click)="select.emit('auto-adjust-speed')">
          <fa-icon [icon]="['fas','gauge']" size="1x"></fa-icon>
          <span>Auto Speed</span>
        </button>
      } @else if (viewType === 'point') {
        <button class="btn btn-ghost btn-edit-icon" (click)="select.emit('delete')">
          <fa-icon [icon]="['fas','circle-xmark']" size="1x"></fa-icon>
          <span>Delete</span>
        </button>
        <button class="btn btn-ghost btn-edit-icon" (click)="select.emit('dt-edit')">
          <fa-icon [icon]="['fas','clock']" size="1x"></fa-icon>
          <span>dt</span>
        </button>
        <button class="btn btn-ghost btn-edit-icon" (click)="select.emit('split')">
          <fa-icon [icon]="['fas','scissors']" size="1x"></fa-icon>
          <span>Split</span>
        </button>
      } @else if (viewType === 'multi-point') {
        <button class="btn btn-ghost btn-edit-icon" (click)="select.emit('delete')">
          <fa-icon [icon]="['fas','circle-xmark']" size="1x"></fa-icon>
          <span>Delete</span>
        </button>
      }

      <div class="d-flex justify-content-end mt-2">
        <button class="btn btn-ghost" (click)="cancel.emit()">
          <fa-icon [icon]="['fas','xmark']" size="1x"></fa-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .btn-ghost {
      color: white;
    }
  `],
  imports: [FaIconComponent]
})
export class EditOptionsComponent implements OnInit {
  @Input() viewType: ViewType = 'track';
  @Output() select: EventEmitter<string> = new EventEmitter<string>();
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    // Subscribe to selection to ensure viewType stays in sync
    this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      if (e.p.length === 0) {
        this.viewType = 'track';
      } else if (e.p.length === 1) {
        this.viewType = 'point';
      } else {
        this.viewType = 'multi-point';
      }
    });
  }
}

