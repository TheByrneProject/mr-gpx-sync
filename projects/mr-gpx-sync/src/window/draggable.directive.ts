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
      const windowPos = settings.getWindowPosition(this.windowName);
      let x: string = windowPos.left || windowPos.right || '0';
      let y: string = '';
      
      // Determine y based on positioning mode
      if (this.windowPosition === 'top-left' || this.windowPosition === 'top-right') {
        y = windowPos.top || '0';
      } else {
        y = windowPos.bottom || '0';
      }

      if (this.el.nativeElement.offsetLeft + this.el.nativeElement.offsetWidth > window.innerWidth) {
        if (this.windowPosition === 'top-left' || this.windowPosition === 'bottom-left') {
          x = (window.innerWidth - this.el.nativeElement.offsetWidth - 32) + 'px';
          this.renderer.setStyle(this.el.nativeElement, 'left', x);
        } else {
          x = '32px';
          this.renderer.setStyle(this.el.nativeElement, 'right', x);
        }
        move = true;
      } else if (this.el.nativeElement.offsetLeft < 0) {
        this.windowPosition = 'top-left';
        x = '64px';
        this.renderer.setStyle(this.el.nativeElement, 'left', x);
        move = true;
      }
      if (this.el.nativeElement.offsetTop + this.el.nativeElement.offsetHeight > window.innerHeight) {
        if (this.windowPosition === 'top-left' || this.windowPosition === 'top-right') {
          y = (window.innerHeight - this.el.nativeElement.offsetHeight - 32) + 'px';
          this.renderer.setStyle(this.el.nativeElement, 'top', y);
        } else {
          y = '32px';
          this.renderer.setStyle(this.el.nativeElement, 'bottom', y);
        }
        move = true;
      } else if (this.el.nativeElement.offsetTop < 0) {
        this.windowPosition = 'top-left';
        y = '32px';
        this.renderer.setStyle(this.el.nativeElement, 'top', y);
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
    const windowEl: HTMLElement = this.el.nativeElement;
    const x: number = event.clientX - initialX;
    const y: number = event.clientY - initialY;
    
    // Apply styles based on window position
    if (this.windowPosition === 'top-left') {
      this.renderer.setStyle(windowEl, 'left', x + 'px');
      this.renderer.setStyle(windowEl, 'top', y + 'px');
    } else if (this.windowPosition === 'top-right') {
      this.renderer.setStyle(windowEl, 'right', (window.innerWidth - x - windowEl.offsetWidth) + 'px');
      this.renderer.setStyle(windowEl, 'top', y + 'px');
    } else if (this.windowPosition === 'bottom-left') {
      this.renderer.setStyle(windowEl, 'left', x + 'px');
      this.renderer.setStyle(windowEl, 'bottom', (window.innerHeight - y - windowEl.offsetHeight) + 'px');
    } else if (this.windowPosition === 'bottom-right') {
      this.renderer.setStyle(windowEl, 'right', (window.innerWidth - x - windowEl.offsetWidth) + 'px');
      this.renderer.setStyle(windowEl, 'bottom', (window.innerHeight - y - windowEl.offsetHeight) + 'px');
    }
  }

  dragEnd(event: MouseEvent): void {
    console.log('dragEnd: ' + this.windowName);
    this.mouseMoveFunction();
    this.mouseUpFunction()
    this.renderer.removeClass(this.el.nativeElement.querySelector('.drag-target'), 'dragging');

    let settings: Settings = this.mrGpxSyncService.settings$.getValue();
    const windowEl = this.el.nativeElement;
    
    // Save position based on window position mode
    let x = '';
    let y = '';
    
    if (this.windowPosition === 'top-left') {
      x = windowEl.style.left;
      y = windowEl.style.top;
    } else if (this.windowPosition === 'top-right') {
      x = windowEl.style.right;
      y = windowEl.style.top;
    } else if (this.windowPosition === 'bottom-left') {
      x = windowEl.style.left;
      y = windowEl.style.bottom;
    } else if (this.windowPosition === 'bottom-right') {
      x = windowEl.style.right;
      y = windowEl.style.bottom;
    }
    
    settings.setWindowPosition(this.windowName, this.windowPosition, x, y);
    this.mrGpxSyncService.updateSettings(settings);
  }
}
