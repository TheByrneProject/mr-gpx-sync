import { AfterViewInit, Component, ElementRef, HostBinding, OnInit, ViewChild } from '@angular/core';

import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { interval, timer } from 'rxjs';
import { ActionEvent } from '../events/action-event';
import { TrackFile } from '../gpx/track-file';
import { TrackPoint } from '../gpx/track-point';
import { TrackPointEvent } from '../events/track-point-event';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'mr-gpx-sync-video',
  template: `
    <div class="d-flex flex-column mt-auto mb-auto mh-100">
      <video #video controls autoplay style="width: 100%; max-height: calc(100% - 48px);"></video>
      <div id="video-controls" class="d-flex flex-row justify-content-between pt-1">
        <button class="btn btn-secondary-outline btn-white" (click)="firstFrame()">
          <fa-icon [icon]="['fas', 'backward']"></fa-icon>
        </button>
        <button class="btn btn-secondary-outline btn-white" (click)="previousFrame()">
          <fa-icon [icon]="['fas', 'backward-step']"></fa-icon>
        </button>
        <button class="btn btn-secondary-outline btn-white" (click)="nextFrame()">
          <fa-icon [icon]="['fas', 'forward-step']"></fa-icon>
        </button>
        <button class="btn btn-secondary-outline btn-white" (click)="lastFrame()">
          <fa-icon [icon]="['fas', 'forward']"></fa-icon>
        </button>
      </div>
    </div>
  `,
  imports: [
    FaIconComponent
  ],
  styles: []
})
export class VideoComponent implements AfterViewInit {

  @HostBinding('class') classes: string = '';

  @ViewChild('video') videoEl!: ElementRef;
  video!: HTMLVideoElement;

  trackFile!: TrackFile;
  currentPoint!: TrackPoint | undefined;

  seekListener: (event: any) => void = (event: any) => {
    if (this.trackFile) {
      this.mrGpxSyncService.log('video.seeked:' + event.target.currentTime);
      this.video.removeEventListener('seeked', this.seekListener);
      let p: TrackPoint | undefined = this.trackFile.getTrack().getClosestPoint(event.target.currentTime);
      if (p) {
        this.video.currentTime = p.t;
        this.currentPoint = p;
        this.mrGpxSyncService.selectedPoint$.next(new TrackPointEvent(p, 'video'));
      }

      timer(500).subscribe(() => {
        this.video.addEventListener('seeked', this.seekListener);
      });
    }
  }

  playingListener: (event: any) => void = (event: any) => {
    interval(1000).subscribe(() => {
      if (!this.video.paused && this.currentPoint) {
        const t: number = this.video.currentTime;
        if (t === this.video.duration && t < this.trackFile.getTrack().getEnd().t) {
          // Ignore
        } else if (t > this.currentPoint.t + this.currentPoint.dt && this.currentPoint.id < this.trackFile.getTrack().trkPts.length - 1) {
          this.currentPoint = this.trackFile.getTrack().trkPts[this.currentPoint.id + 1];
          this.mrGpxSyncService.setSelectedPoint(this.currentPoint, 'video');
        }
      }
    });
  }

  pauseListener: (event: any) => void = (event: any) => {
    this.video.removeEventListener('playing', this.playingListener);
  }

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngAfterViewInit(): void {
    this.mrGpxSyncService.action$.subscribe((event: ActionEvent) => {
      if (event.name === 'open-video' && event.data) {
        this.openVideo(event.data);
      } else if (event.name === 'close-video') {
        this.closeVideo();
      }
    });
    this.mrGpxSyncService.videoData.subscribe((data: any) => {
      if (data) {
        this.openVideo(data);
      }
    });

    this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      if (e.p && this.video && e.source !== 'video') {
        this.removeSeekListener();

        this.mrGpxSyncService.log('video.selectedPoint.subscribe: ' + e.p.t);
        this.video.pause();
        this.video.currentTime = e.p.t;
        this.currentPoint = e.p;

        if (this.video.duration < this.currentPoint.t) {
          this.video.currentTime = this.video.duration;
          this.mrGpxSyncService.log('video.selectedPoint.subscribe: point beyond duration');
        } else {
          this.video.currentTime = this.currentPoint.t;
        }

        this.addSeekListener(2000);
      }
    });

    this.mrGpxSyncService.track$.subscribe((trackFile: TrackFile) => {
      this.trackFile = trackFile.loaded ? trackFile : new TrackFile();
    });
  }

  closeVideo(): void {
    if (this.video) {
      this.video.pause();
      this.video.src = '';
    }
  }

  openVideo(src: string): void {
    if (this.video) {
      this.video.removeEventListener('seeked', this.seekListener);
    }

    this.video = this.videoEl.nativeElement as HTMLVideoElement;
    this.video.src = src;
    this.video.pause();
    this.video.playbackRate = 1;
    this.video.currentTime = 0;
    if (this.trackFile.getTrack().trkPts.length > 0) {
      this.currentPoint = this.trackFile.getTrack().trkPts[0];
    }

    this.video.onloadedmetadata = (event: any) => {
      this.mrGpxSyncService.action$.next(new ActionEvent('video-info', Math.ceil(event.target.duration)));
    };

    this.video.addEventListener('seeked', this.seekListener);
    this.video.addEventListener('playing', this.playingListener);
    this.video.addEventListener('pause', this.pauseListener);
  }

  addSeekListener(timeout: number = 500): void {
    timer(timeout).subscribe(() => {
      this.video.addEventListener('seeked', this.seekListener);
    });
  }

  removeSeekListener(): void {
    this.video.removeEventListener('seeked', this.seekListener);
  }

  firstFrame(): void {
    this.video.pause();
    if (this.trackFile && this.currentPoint) {
      this.video.removeEventListener('seeked', this.seekListener);
      this.currentPoint = this.trackFile.getTrack().getStart();
      this.video.currentTime = this.currentPoint.t;
      this.mrGpxSyncService.setSelectedPoint(this.currentPoint, 'video');
    }
  }

  previousFrame(): void {
    this.video.pause();
    if (this.trackFile && this.currentPoint) {
      this.video.removeEventListener('seeked', this.seekListener);
      this.currentPoint = this.trackFile.getTrack().getPrevious(this.currentPoint);
      if (this.currentPoint) {
        this.video.currentTime = this.currentPoint.t;
        this.mrGpxSyncService.setSelectedPoint(this.currentPoint, 'video');
      }
    }
  }

  nextFrame(): void {
    this.video.pause();
    if (this.trackFile && this.currentPoint) {
      this.video.removeEventListener('seeked', this.seekListener);
      this.currentPoint = this.trackFile.getTrack().getNext(this.currentPoint);
      if (this.currentPoint) {
        this.video.currentTime = this.currentPoint.t;
        this.mrGpxSyncService.setSelectedPoint(this.currentPoint, 'video');
      }
    }
  }

  lastFrame(): void {
    this.video.pause();
    if (this.trackFile && this.currentPoint) {
      this.video.removeEventListener('seeked', this.seekListener);
      this.currentPoint = this.trackFile.getTrack().getEnd();
      this.video.currentTime = this.currentPoint.t;
      this.mrGpxSyncService.setSelectedPoint(this.currentPoint, 'video');
    }
  }
}
