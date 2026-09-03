import dayjs, { Dayjs } from 'dayjs';
import { Coordinate } from 'ol/coordinate';

export class TrackElement {
  lon: number = 0;
  lat: number = 0;
  ele: number = 0;
  date: Dayjs = dayjs();
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

    p.lon = parseFloat(e.getAttribute('lon') || '0');
    p.lat = parseFloat(e.getAttribute('lat') || '0');
    const eleText = e.getElementsByTagName('ele')[0].textContent;
    p.ele = parseFloat(eleText || '0');
    
    // Log if elevation parsing failed or resulted in 0
    if (!eleText || isNaN(p.ele)) {
      console.warn('Failed to parse elevation from element:', eleText);
      p.ele = 0;
    } else if (p.ele === 0) {
      console.info('Point has elevation of 0:', eleText);
    }
    
    p.date = dayjs(e.getElementsByTagName('time')[0].textContent);
    if (p.date.isValid() === false) {
      throw new Error('Point has invalid date: ' + (e.getElementsByTagName('time')[0].textContent));
    }
    return p;
  }

  static createFromCoordinate(c: Coordinate): TrackElement {
    const p: TrackElement = new TrackElement();
    p.lon = c[0];
    p.lat = c[1];
    return p;
  }
}
