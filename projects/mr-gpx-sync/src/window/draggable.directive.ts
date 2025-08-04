import {Directive, ElementRef, Input, Renderer2} from '@angular/core';
import {MrGpxSyncService} from '../services/mr-gpx-sync.service';
import {Settings} from '../gpx/settings';
import {timer} from 'rxjs';

@Directive({
  selector: '[mrGpxSyncDraggable]'
})
export class DraggableDirective {

  @Input() windowPosition: string = 'top-left';

  windowName: string = '';
  mouseMoveFunction: () => void;
  mouseUpFunction: () => void;

  constructor(private el: ElementRef,
              private renderer: Renderer2,
              private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.windowName = this.el.nativeElement.id;

    this.renderer.listen(this.el.nativeElement.querySelector('.drag-target'), 'mousedown', (event: MouseEvent) => {
      this.dragStart(event);
    });

    timer(50).subscribe(() => {
      let settings: Settings = this.mrGpxSyncService.settings$.getValue();
      let move: boolean = false;
      let x: string = settings.getWindowPosition(this.windowName).left;
      let y: string = settings.getWindowPosition(this.windowName).top;

      if (this.el.nativeElement.offsetLeft + this.el.nativeElement.offsetWidth > window.innerWidth) {
        if (this.windowPosition === 'top-left' || this.windowPosition === 'bottom-left') {
          x = (window.innerWidth - this.el.nativeElement.offsetWidth - 32) + 'px';
          this.renderer.setStyle(window, 'left', x);
        } else {
          x = '32px';
          this.renderer.setStyle(window, 'right', x);
        }
        move = true;
      } else if (this.el.nativeElement.offsetLeft < 0) {
        this.windowPosition = 'top-left';
        x = '64px';
        this.renderer.setStyle(window, 'left', x);
        move = true;
      }
      if (this.el.nativeElement.offsetTop + this.el.nativeElement.offsetHeight > window.innerHeight) {
        if (this.windowPosition === 'top-left' || this.windowPosition === 'top-right') {
          y = (window.innerHeight - this.el.nativeElement.offsetHeight - 32) + 'px';
          this.renderer.setStyle(window, 'top', y);
        } else {
          y = '32px';
          this.renderer.setStyle(window, 'bottom', y);
        }
        move = true;
      } else if (this.el.nativeElement.offsetTop < 0) {
        this.windowPosition = 'top-left';
        y = '32px';
        this.renderer.setStyle(window, 'top', y);
        move = true;
      }

      if (move) {
        settings.setWindowPosition(this.windowName, this.windowPosition, x, y);
        this.mrGpxSyncService.updateSettings(settings);
      }
    });
  }

  dragStart(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();

    const window: HTMLElement = this.el.nativeElement;
    const initialX: number = event.clientX - window.offsetLeft;
    const initialY: number = event.clientY - window.offsetTop;
    this.renderer.addClass(window.querySelector('.drag-target'), 'dragging');

    this.mouseMoveFunction = this.renderer.listen(document, 'mousemove', (event: MouseEvent) => {
      this.dragMove(event, initialX, initialY);
    });
    this.mouseUpFunction = this.renderer.listen(document, 'mouseup', (event: MouseEvent) => {
      this.dragEnd(event);
    });
  }

  dragMove(event: MouseEvent, initialX: number, initialY: number): void {
    const window: HTMLElement = this.el.nativeElement;
    const x: number = event.clientX - initialX;
    const y: number = event.clientY - initialY;
    this.renderer.setStyle(window, 'left', x + 'px');
    this.renderer.setStyle(window, 'top', y + 'px');
  }

  dragEnd(event: MouseEvent): void {
    console.log('dragEnd: ' + this.windowName);
    this.mouseMoveFunction();
    this.mouseUpFunction()
    this.renderer.removeClass(this.el.nativeElement.querySelector('.drag-target'), 'dragging');

    let settings: Settings = this.mrGpxSyncService.settings$.getValue();
    settings.setWindowPosition(this.windowName, this.windowPosition, `${this.el.nativeElement.style.left}`, `${this.el.nativeElement.style.top}`);
    this.mrGpxSyncService.updateSettings(settings);
  }
}
