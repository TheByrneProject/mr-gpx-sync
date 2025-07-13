import { Component, HostBinding, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { TrackPoint } from '../gpx/track-point';
import { Settings } from '../gpx/settings';
import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { calcPace } from '../gpx/calc';
import { ActionEvent } from '../events/action-event';
import { Subscription } from 'rxjs';
import { MatCard, MatCardActions, MatCardContent, MatCardTitle } from '@angular/material/card';
import { SecondsToTime } from '../pipes';
import { MatButton } from '@angular/material/button';
import { setFormValue } from '../forms/form-utils';
import { MatFormField, MatLabel } from '@angular/material/input';

@Component({
  selector: 'mr-gpx-sync-change-dt',
  imports: [
    MatCard,
    MatCardTitle,
    MatCardContent,
    SecondsToTime,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatCardActions,
    MatButton
  ],
  template: `
    <div class="action-title">Change Time Delta</div>
    <div class="mb-1 overflow-auto p-1 d-flex flex-column">
      <div class="p-1 d-flex flex-column">
        <mat-card class="mb-1">
          <mat-card-title>Current Values</mat-card-title>
          <mat-card-content class="card-values">
            <div class="card-row">
              <div class="w-25 label">dt</div>
              <div>{{ p1.dt }} s</div>
            </div>
            <div class="card-row">
              <div class="w-25 label">Pace</div>
              <div>{{ settings.getPaceDisplay(p1.v) }} {{ settings?.paceUnits }}</div>
            </div>
            <div class="card-row">
              <div class="w-25 label">Time</div>
              <div>{{ t | secToTime }}</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-title>New Values</mat-card-title>
          <mat-card-content class="card-values">
            <form [formGroup]="form" class="d-flex">
              <mat-form-field class="" appearance="fill">
                <mat-label>New dt</mat-label>
                <input type="number" matInput formControlName="dt"/>
              </mat-form-field>
            </form>
            <div class="card-row">
              <div class="w-25 label">Pace</div>
              <div>{{ settings.getPaceDisplay(newPace) }} {{ settings?.paceUnits }}</div>
            </div>
            <div class="card-row">
              <div class="w-25 label">Time</div>
              <div>{{ t - p1.dt + newDt | secToTime }}</div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
    <mat-card>
      <mat-card-actions>
        <button mat-raised-button color="primary" (click)="cancel()">Cancel</button>
        <button mat-raised-button color="primary" (click)="save()" [disabled]="p1.dt === newDt && !form.valid">Save
        </button>
      </mat-card-actions>
    </mat-card>
  `
})
export class ChangeDtComponent implements OnInit {

  @HostBinding('class') classes: string = 'd-flex flex-column w-100';

  p1!: TrackPoint;
  p2!: TrackPoint | undefined;
  t!: number;
  newDt!: number;
  newPace!: number;
  newT!: number;
  settings: Settings = new Settings();

  form: FormGroup = new FormGroup({
    dt: new FormControl('', [Validators.required, Validators.min(1), Validators.max(59)])
  });

  actionSubscription!: Subscription;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.settings$.subscribe((settings: Settings) => {
      this.settings = settings;
    });

    this.actionSubscription = this.mrGpxSyncService.action$.subscribe((e: ActionEvent) => {
      if (e.name) {
        this.p1 = e.data[0] as TrackPoint;

        this.p2 = this.mrGpxSyncService.track$.getValue().getTrack().getNext(this.p1);
        this.t = this.mrGpxSyncService.track$.getValue().getTrack().duration;
        setFormValue(this.form, 'dt', this.p1.dt);
        this.setNewDt(this.p1.dt);

        this.form.valueChanges.subscribe((values: any) => {
          this.setNewDt(values.dt);
        });
      }
    });
  }

  setNewDt(newDt: number): void {
    if (newDt) {
      this.newDt = newDt;
      this.newPace = calcPace(this.newDt, this.p1.dx);
    }
  }

  cancel(): void {
    this.mrGpxSyncService.action$.next(new ActionEvent());
  }

  save(): void {
    if (this.actionSubscription) {
      this.actionSubscription.unsubscribe();
    }

    this.mrGpxSyncService.shiftTime(this.p1, this.newDt - this.p1.dt);
    this.mrGpxSyncService.action$.next(new ActionEvent());
  }
}
