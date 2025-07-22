import {Directive, ElementRef, Renderer2} from '@angular/core';
import {MrGpxSyncService} from '../services/mr-gpx-sync.service';
import {Settings} from '../gpx/settings';

@Directive({
  selector: '[mrGpxSyncDraggable]'
})
export class DraggableDirective {

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
  }

  dragStart(event: MouseEvent): void {
    console.log('dragStart: ' + this.windowName);
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
    settings.setWindowPosition(this.windowName, `${this.el.nativeElement.style.left}px`, `${this.el.nativeElement.style.top}px`);
    this.mrGpxSyncService.updateSettings(settings);
  }
}
