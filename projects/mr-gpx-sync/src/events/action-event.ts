
export class ActionEvent {
  name: string = '';
  data: any = {};
  source: string = '';

  constructor(name: string = '', data: any = {}, source: string = '') {
    this.name = name;
    this.data = data;
    this.source = source;
  }
}
