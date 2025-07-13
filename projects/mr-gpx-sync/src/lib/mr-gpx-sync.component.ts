import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MrGpxSyncService } from '../services/mr-gpx-sync.service';

@Component({
  selector: 'lib-mr-gpx-sync',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mr-gpx-sync-container">
      <h3>GPX Sync Component</h3>
      <div class="sync-controls">
        <button (click)="onSyncClick()" [disabled]="!gpxData">
          Sync GPX with Video
        </button>
        <div *ngIf="gpxData" class="gpx-info">
          <p>GPX Data loaded: {{ gpxData.length }} characters</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mr-gpx-sync-container {
      padding: 20px;
      border: 1px solid #ccc;
      border-radius: 8px;
      margin: 10px 0;
    }
    
    .sync-controls {
      margin-top: 15px;
    }
    
    button {
      padding: 10px 20px;
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    
    button:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }
    
    .gpx-info {
      margin-top: 10px;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 4px;
    }
  `]
})
export class MrGpxSyncComponent {
  @Input() gpxData: string = '';
  @Input() videoTimestamp: number = 0;
  @Output() syncRequested = new EventEmitter<{gpxData: string, timestamp: number}>();

  constructor(private gpxSyncService: MrGpxSyncService) {}

  onSyncClick(): void {
    if (this.gpxData) {
      this.gpxSyncService.syncGpxTrack(this.gpxData, this.videoTimestamp);
      this.syncRequested.emit({
        gpxData: this.gpxData,
        timestamp: this.videoTimestamp
      });
    }
  }
}
