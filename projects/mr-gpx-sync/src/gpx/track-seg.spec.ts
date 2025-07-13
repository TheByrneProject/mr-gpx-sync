import { TrackSeg } from './track-seg';
import * as assert from 'assert';
import { TestBed } from '@angular/core/testing';
import { Component } from '../v3rs.component';
import { SecurityService } from '../../../../thebyrneproject/src/app/security/security.service';

describe('About Component', () => {
  let trackSeg: TrackSeg;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Component ],
      providers: [ SecurityService ]
    })
      .compileComponents();
    trackSeg = new TrackSeg();
  });

  it('compress with 1s', () => {
    assert.equal(true, true);
  });
});
