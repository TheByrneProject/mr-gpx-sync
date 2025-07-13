import { Component, HostBinding } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { FaIconLibrary } from '@fortawesome/angular-fontawesome';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { ActionEvent, MrGpxSyncMenuBar, MrGpxSyncService } from 'mr-gpx-sync';

@Component({
  selector: 'mr-gpx-sync-app',
  standalone: true,
  imports: [RouterOutlet, MrGpxSyncMenuBar],
  template: `
    <mr-gpx-sync-menu-bar></mr-gpx-sync-menu-bar>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {

  @HostBinding('class') classes: string = 'outlet-row';

  constructor(private library: FaIconLibrary,
              private router: Router,
              private mrGpxSyncService: MrGpxSyncService) {
    library.addIconPacks(fas, far);
  }

  ngOnInit(): void {
    this.mrGpxSyncService.action$.subscribe((event: ActionEvent) => {
      if (event.name === 'gpx-video-skipped') {
        this.router.navigate(['gpx-only']);
      } else if (event.name === 'gpx-video-loaded') {
        this.router.navigate(['gpx-only']);
      }
    });
    this.mrGpxSyncService.error$.subscribe((error: any) => {
      console.error(error);
    });
  }
}
