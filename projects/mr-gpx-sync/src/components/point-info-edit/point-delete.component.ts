import {Component, EventEmitter, HostBinding, Output} from '@angular/core';
import {TrackPoint} from '../../gpx';
import {MrGpxSyncService} from '../../services';
import {TrackPointEvent} from '../../events';

@Component({
  selector: 'mr-gpx-sync-point-delete',
  standalone: true,
  template: `
    <div class="md label p-2 mb-5">Delete {{ points.length }} points?</div>
    <div class="d-flex justify-content-end gap-3 p-2">
      <button class="btn btn-secondary btn-sm" (click)="cancel()">Cancel</button>
      <button class="btn btn-secondary btn-sm" (click)="delete()">Delete</button>
    </div>
  `,
  styles: []
})
export class PointDeleteComponent {

  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column';

  @Output('cancel') cancelOutput = new EventEmitter<boolean>();

  points: TrackPoint[] = [];

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      this.points = e.p;
    });
  }

  cancel(): void {
    this.cancelOutput.emit(true);
  }

  delete(): void {
    if (this.points?.length > 0) {
      this.mrGpxSyncService.delete(this.points);
      this.cancelOutput.emit(true);
    }
  }
}
