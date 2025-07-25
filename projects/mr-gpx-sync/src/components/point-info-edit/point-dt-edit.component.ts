import {Component, EventEmitter, HostBinding, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {calcPace, Settings, TrackPoint} from '../../gpx';
import {MrGpxSyncService} from '../../services';
import {ActionEvent, TrackPointEvent} from '../../events';
import {SecondsToTime} from '../../pipes';

@Component({
  selector: 'mr-gpx-sync-point-dt-edit',
  standalone: true,
  template: `
    <div class="d-flex p-2">
      <div class="w-33 d-flex flex-column me-3">
        <div class="sm label" style="visibility: hidden;">H</div>
        <div class="sm label mt-1">dt</div>
        <div class="sm label">Pace</div>
        <div class="sm label">Time</div>
      </div>
      <div class="w-33 d-flex flex-column me-3">
        <div class="sm label">Current</div>
        <div class="sm mt-1">{{ p1.dt }} s</div>
        <div class="sm nowrap">{{ settings?.getPaceDisplay(p1.v) }} {{ settings?.paceUnits }}</div>
        <div class="sm">{{ t | secToTime : 'mmss' }}</div>
      </div>
      <div class="w-33 d-flex flex-column me-3">
        <div class="sm label">New</div>
        <form [formGroup]="form" class="sm">
          <input type="number" formControlName="dt" />
        </form>
        <div class="sm nowrap">{{ settings?.getPaceDisplay(newPace) }} {{ settings?.paceUnits }}</div>
        <div class="sm">{{ t - p1.dt + newDt | secToTime : 'mmss' }}</div>
      </div>
    </div>

    <div class="d-flex justify-content-end gap-3 p-2">
      <button class="btn btn-secondary btn-sm" (click)="cancel()">Cancel</button>
      <button class="btn btn-primary btn-sm" (click)="save()">Save</button>
    </div>
  `,
  imports: [
    SecondsToTime,
    ReactiveFormsModule
  ],
  styles: [`
    input {
      width: 3rem;
      background-color: rgba(255, 255, 255, 0.3);
      border: 1px solid gray;
      padding: 0.1rem 0.5rem;
    }

    .nowrap {
      text-wrap-mode: nowrap;
    }
  `]
})
export class PointDtEditComponent implements OnInit {

  @HostBinding('class') classes: string = 'd-flex flex-grow-1 flex-column ww-400';

  @Output('cancel') cancelOutput = new EventEmitter<boolean>();

  p1: TrackPoint;
  p2: TrackPoint;
  t: number;
  newDt: number;
  newPace: number;
  newT: number;
  settings: Settings;

  form: FormGroup = new FormGroup({
    dt: new FormControl('', [Validators.required, Validators.min(1), Validators.max(59)])
  });

  actionSubscription: Subscription;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });

    this.actionSubscription = this.mrGpxSyncService.selectedPoint$.subscribe((e: TrackPointEvent) => {
      this.p1 = e.p[0] as TrackPoint;

      this.p2 = this.mrGpxSyncService.getTrack().getNext(this.p1);
      this.t = this.mrGpxSyncService.getTrack().duration;
      this.form.get('dt').setValue(this.p1.dt);
      this.setNewDt(this.p1.dt);

      this.form.valueChanges.subscribe((values: any) => {
        this.setNewDt(values.dt);
      });
    });
  }

  setNewDt(newDt: number): void {
    if (newDt) {
      this.newDt = newDt;
      this.newPace = calcPace(this.newDt, this.p1.dx);
    }
  }

  cancel(): void {
    this.cancelOutput.emit(true);
  }

  save(): void {
    if (this.actionSubscription) {
      this.actionSubscription.unsubscribe();
    }

    this.mrGpxSyncService.shiftTime(this.p1, this.newDt - this.p1.dt);
    this.cancelOutput.emit(true);
  }
}
