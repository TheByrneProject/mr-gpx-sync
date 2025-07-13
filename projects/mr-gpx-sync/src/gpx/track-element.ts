import moment, { Moment } from 'moment';
import { Coordinate } from 'ol/coordinate';

export class TrackElement {
  lon: number = 0;
  lat: number = 0;
  ele: number = 0;
  date: Moment = moment();
  extensions!: Element;

  static createFromElement(e: Element | null): TrackElement {
    const p: TrackElement = new TrackElement();

    if (!e) {
      throw new Error('Element is null.');
    }
    if (!e.hasAttribute('lon')) {
      throw new Error('Point missing lon attribute.');
    }
    if (!e.hasAttribute('lat')) {
      throw new Error('Point missing lat attribute.');
    }
    if (e.getElementsByTagName('ele').length === 0
        || e.getElementsByTagName('ele')[0].textContent?.length === 0) {
      throw new Error('Point missing ele element.');
    }
    if (e.getElementsByTagName('time').length === 0
      || e.getElementsByTagName('time')[0].textContent?.length === 0) {
      throw new Error('Point missing time element.');
    }
    if (e.getElementsByTagName('extensions').length > 0) {
      p.extensions = e.getElementsByTagName('extensions')[0];
    }

    p.lon = e.getAttribute('lon') as unknown as number;
    p.lat = e.getAttribute('lat') as unknown as number;
    p.ele = e.getElementsByTagName('ele')[0].textContent as unknown as number;
    p.date = moment(e.getElementsByTagName('time')[0].textContent);
    return p;
  }

  static createFromCoordinate(c: Coordinate): TrackElement {
    const p: TrackElement = new TrackElement();
    p.lon = c[0];
    p.lat = c[1];
    return p;
  }
}
