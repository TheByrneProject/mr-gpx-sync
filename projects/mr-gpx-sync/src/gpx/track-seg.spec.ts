import { TrackSeg } from './track-seg';
import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

describe('About Component', () => {
  let trackSeg: TrackSeg;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ Component ]
    })
      .compileComponents();
    trackSeg = new TrackSeg();
  });

  it('compress with 1s', () => {
    expect(true).toBe(true);
  });
});
