
export class Settings {

  paceMinPer: boolean = true;
  metric: boolean = false;
  distanceUnits: string = 'mi';
  shortDistanceUnits: string = 'ft';
  paceUnits: string = 'min / mi';
  eleUnits: string = 'ft';
  paceMinPerUnit: string = 'min / mi';
  paceDisPerUnit: string = 'mph';

  slowThreshold: number = 16.0;

  videoWindowTop: string = '50vh';
  videoWindowLeft: string = '60px';
  videoWindowWidth: string = '20vw';

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

  getElevationAsDisplay(ele: number | undefined): string {
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
