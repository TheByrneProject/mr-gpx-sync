
export class GpxEvent {

  success: boolean = true;
  error: any;
  message: string | undefined;
  data: any;

  static createEvent(message: string = 'GpxEvent', success: boolean = true, error?: any): GpxEvent {
    const event: GpxEvent = new GpxEvent();
    event.message = message;
    return event;
  }

  static createDataEvent(message: string = 'GpxEvent', success: boolean = true, data: any): GpxEvent {
    const event: GpxEvent = new GpxEvent();
    event.message = message;
    event.data = data;
    return event;
  }

  log(): string {
    return <string>this.message;
  }
}
