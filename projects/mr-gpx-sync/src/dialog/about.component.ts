import { Component } from '@angular/core';

import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'mr-gpx-sync-dialog-about',
  imports: [
    MatDialogClose,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton
  ],
  template: `
    <h1 mat-dialog-title>User Guide</h1>
    <div mat-dialog-content>
      <div class="p-1 d-flex flex-column">
        <div class="d-flex">
          <div class="w-25 label">Author</div>
          <div>The Byrne Project / Michael Byrne</div>
        </div>
        <div class="d-flex">
          <div class="w-25 label">Version</div>
          <div>{{ VERSION }}</div>
        </div>
      </div>
    </div>
    <div mat-dialog-actions>
      <button mat-button [mat-dialog-close]="" cdkFocusInitial>Close</button>
    </div>
  `
})
export class AboutComponent {

  VERSION: string = '0.0.1';
}
