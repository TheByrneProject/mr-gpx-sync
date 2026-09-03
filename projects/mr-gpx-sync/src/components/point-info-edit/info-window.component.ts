import { Component, HostBinding, OnInit, HostListener } from '@angular/core';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { CommonModule } from '@angular/common';
import { EditOptionsComponent } from './edit-options.component';
import { TrackInfoViewComponent } from './track-info-view.component';
import { PointInfoViewComponent } from './point-info-view.component';
import { MultiPointInfoViewComponent } from './multi-point-info-view.component';
import { PointDtEditComponent } from './point-dt-edit.component';
import { PointDeleteComponent } from './point-delete.component';
import { SplitComponent } from './split.component';
import { DrawTrackComponent } from './draw-track.component';
import { NormalizeElevationComponent } from './normalize-elevation.component';
import { AutoAdjustSpeedComponent } from './auto-adjust-speed.component';
import { MrGpxSyncService } from '../../services';
import { TrackPointEvent } from '../../events';

type ViewType = 'track' | 'point' | 'multi-point';

@Component({
  selector: 'mr-gpx-sync-info-window',
  standalone: true,
  template: `
    <div class="window-header d-flex gap-2">
      <div class="tabs d-flex gap-1 flex-grow-1">
        <button 
          class="tab-button" 
          [class.active]="currentView === 'track'"
          (click)="currentView = 'track'"
          title="Track Information">
          <fa-icon [icon]="['fas', 'wave-square']" size="1x"></fa-icon>
        </button>
        <button 
          class="tab-button" 
          [class.active]="currentView === 'point'"
          (click)="currentView = 'point'"
          [disabled]="selectedPointCount !== 1"
          title="Point Information">
          <fa-icon [icon]="['fas', 'location-dot']" size="1x"></fa-icon>
        </button>
        <button 
          class="tab-button" 
          [class.active]="currentView === 'multi-point'"
          (click)="currentView = 'multi-point'"
          [disabled]="selectedPointCount < 2"
          title="Multi-Point Information">
          <fa-icon [icon]="['fas', 'diagram-project']" size="1x"></fa-icon>
        </button>
      </div>
      <button class="btn btn-ghost sm">
        <fa-icon [icon]="['fas', 'ellipsis']" size="1x" class="drag-target"></fa-icon>
      </button>
    </div>
    <div class="window-content">
      @if (mode === 'dt-edit') {
        <mr-gpx-sync-point-dt-edit (cancel)="mode = 'info'"></mr-gpx-sync-point-dt-edit>
      } @else if (mode === 'delete') {
        <mr-gpx-sync-point-delete (cancel)="mode = 'info'"></mr-gpx-sync-point-delete>
      } @else if (mode === 'split') {
        <mr-gpx-sync-point-split (cancel)="mode = 'info'"></mr-gpx-sync-point-split>
      } @else if (mode === 'edit') {
        <mr-gpx-sync-edit-options [viewType]="currentView" (select)="mode = $event" (cancel)="mode = 'info'"></mr-gpx-sync-edit-options>
      } @else if (mode === 'draw-track') {
        <mr-gpx-sync-draw-track (cancel)="mode = 'info'"></mr-gpx-sync-draw-track>
      } @else if (mode === 'normalize-elevation') {
        <mr-gpx-sync-normalize-elevation (cancel)="mode = 'info'"></mr-gpx-sync-normalize-elevation>
      } @else if (mode === 'auto-adjust-speed') {
        <mr-gpx-sync-auto-adjust-speed (cancel)="mode = 'info'"></mr-gpx-sync-auto-adjust-speed>
      } @else {
        @if (currentView === 'track') {
          <mr-gpx-sync-track-info-view (showEdit)="mode = 'edit'"></mr-gpx-sync-track-info-view>
        } @else if (currentView === 'point') {
          <mr-gpx-sync-point-info-view (showEdit)="mode = 'edit'" (deselect)="deselectPoints()"></mr-gpx-sync-point-info-view>
        } @else if (currentView === 'multi-point') {
          <mr-gpx-sync-multi-point-info-view (showEdit)="mode = 'edit'" (deselect)="deselectPoints()"></mr-gpx-sync-multi-point-info-view>
        }
      }
    </div>
  `,
  styles: [`
    .tabs {
      display: flex;
      gap: 0.25rem;
    }
    .tab-button {
      padding: 0.35rem 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 0.25rem;
      cursor: pointer;
      font-size: 0.85rem;
      color: white;
      transition: all 0.2s;
    }
    .tab-button:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.2);
      border-color: rgba(255, 255, 255, 0.5);
    }
    .tab-button.active {
      background: rgba(255, 255, 255, 0.25);
      border-color: rgba(255, 255, 255, 0.7);
      font-weight: 600;
    }
    .tab-button:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .btn-ghost {
      color: white;
    }
  `],
  imports: [
    FaIconComponent,
    CommonModule,
    TrackInfoViewComponent,
    PointInfoViewComponent,
    MultiPointInfoViewComponent,
    EditOptionsComponent,
    PointDtEditComponent,
    PointDeleteComponent,
    SplitComponent,
    DrawTrackComponent,
    NormalizeElevationComponent,
    AutoAdjustSpeedComponent
  ]
})
export class InfoWindowComponent implements OnInit {
  @HostBinding('class') classes: string = 'window transparent white';

  mode: string = 'info';
  currentView: ViewType = 'track';
  selectedPointCount: number = 0;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      this.selectedPointCount = e.p?.length || 0;
      
      // Automatically switch view based on selection
      if (this.selectedPointCount === 0) {
        this.currentView = 'track';
      } else if (this.selectedPointCount === 1) {
        this.currentView = 'point';
      } else {
        this.currentView = 'multi-point';
      }
      
      // Reset mode when view changes
      this.mode = 'info';
    });
  }

  @HostListener('window:keydown.escape')
  onEscapeKeydown(): void {
    // If in info mode with selected points, deselect them
    if (this.mode === 'info' && this.selectedPointCount > 0) {
      this.deselectPoints();
    }
  }

  deselectPoints(): void {
    // Clear selected points by emitting an empty TrackPointEvent
    this.mrGpxSyncService.selectedPoint$.next(new TrackPointEvent());
  }
}

