
export class Settings {

  paceMinPer: boolean;
  metric: boolean;
  distanceUnits: string;
  shortDistanceUnits: string;
  paceUnits: string;
  eleUnits: string;
  paceMinPerUnit: string;
  paceDisPerUnit: string;

  slowThreshold: number;

  windows: any;

  constructor(source: any = {}) {
    this.paceMinPer = source.paceMinPer ?? false;
    this.metric = source.metric ?? true;
    this.distanceUnits = source.distanceUnits ?? 'mi';
    this.shortDistanceUnits = source.shortDistanceUnits ?? 'm';
    this.paceUnits = source.paceUnits ?? 'min / km';
    this.eleUnits = source.eleUnits ?? 'm';
    this.paceMinPerUnit = source.paceMinPerUnit ?? 'min / km';
    this.paceDisPerUnit = source.paceDisPerUnit ?? 'kph';
    this.slowThreshold = source.slowThreshold ?? 16.0;
    this.windows = source.windows ?? {};
    if (!this.windows.videoWindow) {
      this.windows.videoWindow = {top: '50vh', left: '60px', width: '20vw'};
    }
    if (!this.windows.infoWindow) {
      this.windows.infoWindow = {top: '20vh', left: '70vw'};
    }
  }

  setWindowPosition(windowName: string, left: string, top: string): void {
    if (this.windows[windowName]) {
      this.windows[windowName].top = top;
      this.windows[windowName].left = left;
    } else {
      this.windows[windowName] = {top: top, left: left};
    }
  }

  updateUnits(): void {
    this.distanceUnits = this.metric ? 'km' : 'mi';
    this.shortDistanceUnits = this.metric ? 'm' : 'ft';
    this.paceUnits = this.metric ? (this.paceMinPer ? 'min / km' : 'kph') : (this.paceMinPer ? 'min / mi' : 'mph');
    this.paceMinPerUnit = this.metric ? 'min / km' : 'min / mi';
    this.paceDisPerUnit = this.metric ? 'kph' : 'mph';
    this.eleUnits = this.metric ? 'm' : 'ft';
  }

  setMetric(metric: boolean): void {
    this.metric = metric;
    this.updateUnits();
  }

  setPaceMinPer(paceMinPer: boolean): void {
    this.paceMinPer = paceMinPer;
    this.updateUnits();
  }

  getDistance(distance: number): number {
    return this.metric ? distance / 1000.0 : distance / 1000.0 * 0.621371;
  }

  getShortDistance(distance: number): number {
    return this.metric ? distance : distance * 3.28084;
  }

  getShortDistanceDisplay(distance: number): string {
    return Number(this.getShortDistance(distance)).toFixed(2);
  }

  getElevation(ele: number): number {
    return this.metric ? ele : ele * 3.28084;
  }

  getElevationAsDisplay(ele: number | undefined, digits: number = 1): string {
    if (!ele) {
      return '';
    }
    return Number(this.getElevation(ele)).toFixed(1);
  }

  setElevation(ele: number): number {
    return this.metric ? ele : ele / 3.28084;
  }

  getPace(pace: number): number {
    if (this.paceMinPer) {
      return this.metric ? pace : pace / 0.621371;
    } else {
      return this.metric ? (60.0 / pace) : (60.0 / pace) * 0.621371;
    }
  }

  // 10 min / mi     *  60 = s / mi
  getPaceDisplay(pace: number): string {
    if (this.paceMinPer) {
      if (pace) {
        const p: number = this.getPace(pace);
        const m = Math.floor(p);
        const s = Math.floor((p % 1) * 60.0);
        return m + ':' + (s < 10 ? '0' + s : s);
      } else {
        return '0:00';
      }
    } else {
      if (pace) {
        return Number(this.getPace(pace)).toFixed(1);
      } else {
        return '0.0';
      }
    }
  }

  setPace(pace: number): number {
    if (this.paceMinPer) {
      return this.metric ? pace : pace * 0.621371;
    } else {
      return this.metric ? (1.0 / (pace / 60.0)) : (1.0 / ((pace) / 60.0)) * 0.621371;
    }
  }
}
