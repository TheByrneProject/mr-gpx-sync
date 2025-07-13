
export class MrGpxSyncEvent {
  name: string = '';
  source: string = '';
  hash: string = '';

  constructor(s?: any) {
    this.name = s?.name ? s.name : '';
    this.source = s?.source ? s.source : '';
  }
}
