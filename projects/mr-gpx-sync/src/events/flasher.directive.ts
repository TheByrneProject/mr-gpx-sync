import { Directive, ElementRef, OnInit, Renderer2 } from '@angular/core';

import { timer } from 'rxjs';

import { MrGpxSyncService } from '../services/mr-gpx-sync.service';
import { ActionEvent } from './action-event';

@Directive({
  selector: '[tbpFlasher]'
})
export class FlasherDirective implements OnInit {

  e1: ActionEvent | undefined;

  constructor(private mrGpxSyncService: MrGpxSyncService,
              private el: ElementRef,
              private renderer: Renderer2) {}

  ngOnInit(): void {
    this.mrGpxSyncService.action$.subscribe((e2: ActionEvent) => {
      if (this.e1 && e2 && this.e1.name === e2.name) {
        this.renderer.addClass(this.el.nativeElement, 'flash');
        timer(1000).subscribe(() => {
          this.renderer.removeClass(this.el.nativeElement, 'flash');
        });
      }
      this.e1 = e2;
    });
  }
}
