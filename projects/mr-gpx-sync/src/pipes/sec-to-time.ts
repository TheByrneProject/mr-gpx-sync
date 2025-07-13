import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'secToTime', pure: true})
export class SecondsToTime implements PipeTransform {

  transform(value: number, format: string = 'hhmmss', auto: boolean = false): string {
    return secondsToTime(value, format, auto);
  }
}

export function secondsToTime(value: number, format: string = 'hhmmss', auto: boolean = false): string {
  if (auto) {
    if (value > 3600) {
      format = 'hhmmss';
    } else {
      format = 'mmss';
    }
  }

  const h = Math.floor(value / 3600.0);
  const hr = value % 3600;
  const m = Math.floor(hr / 60.0);
  const s = hr % 60;
  if (format === 'hhmmss') {
    return h + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
  } else {
    return m + ':' + (s < 10 ? '0' + s : s);
  }
};
