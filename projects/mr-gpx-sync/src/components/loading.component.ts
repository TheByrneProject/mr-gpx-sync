import { Component, OnInit } from '@angular/core';

import { MrGpxSyncService } from '../services/mr-gpx-sync.service';

@Component({
  selector: 'tbp-loading',
  template: ``
})
export class LoadingComponent implements OnInit {

  loading: boolean = false;

  constructor(private mrGpxSyncService: MrGpxSyncService) {}

  ngOnInit(): void {
    this.mrGpxSyncService.loading$.subscribe((loading: boolean) => {
      this.render(loading);
    });
  }

  render(loading: boolean): void {
    if (this.loading === loading) {
      return;
    } else {
      this.loading = loading;
    }

    this.mrGpxSyncService.log('LoadingComponent.render');
    if (loading) {
      const e = document.createElement('div');
      e.setAttribute('id', 'tbp-spinner');
      e.setAttribute('class', 'tbp-spinner overlay visible');
      const s = document.createElement('div');
      s.setAttribute('class', 'spinner ms-auto me-auto mt-auto mb-auto');
      e.appendChild(s);
      document.body.appendChild(e);
    } else {
      document.body.removeChild(document.body.getElementsByClassName('tbp-spinner')[0]);
    }
  }
}
