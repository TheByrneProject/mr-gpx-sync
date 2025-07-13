
export class ParseError {

  message: string;
  attachment: string;

  constructor(message: string = '', attachment: string = '') {
    this.message = message;
    this.attachment = attachment;
  }
}
