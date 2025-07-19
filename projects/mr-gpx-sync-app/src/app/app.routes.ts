import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'home',
    loadComponent: () => import('mr-gpx-sync').then(m => m.MrGpxSyncNewProject)
  },
  {
    path: 'gpx-only',
    loadComponent: () => import('mr-gpx-sync').then(m => m.MrGpxSyncGpxOnly)
  },
  {
    path: 'gpx-video',
    loadComponent: () => import('mr-gpx-sync').then(m => m.MrGpxSyncGpxVideo)
  },
  {
    path: '**',
    redirectTo: 'home'
  }
];
