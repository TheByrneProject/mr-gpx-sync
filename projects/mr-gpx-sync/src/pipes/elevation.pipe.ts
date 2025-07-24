import { Pipe, PipeTransform } from '@angular/core';
import {MrGpxSyncService} from '../services';

@Pipe({name: 'elevation', pure: true})
export class ElevationPipe implements PipeTransform {

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  transform(value: number): string {
    return this.mrGpxSyncService.settings$.getValue().getElevationAsDisplay(value, 0) + ' (' + this.mrGpxSyncService.settings$.getValue().eleUnits + ')';
  }
}
