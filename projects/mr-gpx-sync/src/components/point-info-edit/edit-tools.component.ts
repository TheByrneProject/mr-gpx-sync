import { Component, EventEmitter, Output } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'mr-gpx-sync-edit-tools',
  standalone: true,
  template: `
    <div class="edit-tools d-flex flex-column gap-2 p-2">
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

      <div class="d-flex justify-content-end mt-2">
        <button class="btn btn-ghost" (click)="cancel.emit()">
          <fa-icon [icon]="['fas','xmark']" size="1x"></fa-icon>
        </button>
      </div>
    </div>
  `,
  styles: [] ,
  imports: [FaIconComponent]
})
export class EditToolsComponent {
  @Output() select: EventEmitter<string> = new EventEmitter<string>();
  @Output() cancel: EventEmitter<void> = new EventEmitter<void>();
}
