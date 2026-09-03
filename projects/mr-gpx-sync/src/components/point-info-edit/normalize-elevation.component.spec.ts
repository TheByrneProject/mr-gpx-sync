import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NormalizeElevationComponent } from './normalize-elevation.component';
import { MrGpxSyncService } from '../../services';
import { TrackFile, Settings, Track, TrackSeg, TrackPoint } from '../../gpx';
import { BehaviorSubject } from 'rxjs';

describe('NormalizeElevationComponent', () => {
  let component: NormalizeElevationComponent;
  let fixture: ComponentFixture<NormalizeElevationComponent>;
  let mockMrGpxSyncService: jasmine.SpyObj<MrGpxSyncService>;
  let trackFile: TrackFile;

  /**
   * Creates a test track file with known elevation data
   */
  function createTestTrackFile(elevations: number[]): TrackFile {
    const tf = new TrackFile();
    tf.fileName = 'test.gpx';
    tf.loaded = true;

    const track = new Track();
    const trackSeg = new TrackSeg();

    // Create test points with provided elevations
    elevations.forEach((ele, index) => {
      const point = new TrackPoint();
      point.lat = 37.4627900 + (index * 0.0001);
      point.lon = -110.7452670 + (index * 0.0001);
      point.ele = ele;
      trackSeg.trkPts.push(point);
    });

    track.trkSegs.push(trackSeg);
    tf.tracks.push(track);
    return tf;
  }

  beforeEach(async () => {
    // Create a mock MrGpxSyncService
    mockMrGpxSyncService = jasmine.createSpyObj('MrGpxSyncService', [
      'getTrackFile',
      'getTrack',
      'setTrack',
      'setTrackSeg'
    ]);

    // Create a test track file with consistent elevation (1128m like lost-eden.gpx)
    trackFile = createTestTrackFile(Array(10).fill(1128));

    // Setup service to return our test track file
    mockMrGpxSyncService.getTrackFile.and.returnValue(trackFile);
    mockMrGpxSyncService.getTrack.and.returnValue(trackFile.getTrack());

    // Create settings observable with metric system
    const settings = new Settings();
    settings.metric = true;
    mockMrGpxSyncService.settings$ = new BehaviorSubject(settings);

    await TestBed.configureTestingModule({
      imports: [NormalizeElevationComponent],
      providers: [
        { provide: MrGpxSyncService, useValue: mockMrGpxSyncService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NormalizeElevationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load track data and calculate average elevation on init', () => {
    expect(component.averageElevationMeters).toBeGreaterThan(0);
    expect(component.targetElevationMeters).toBe(component.averageElevationMeters);
  });

  it('should display elevation in meters when metric system is enabled', () => {
    expect(component.settings.eleUnits).toBe('m');
    expect(component.averageElevationDisplay).toBe(component.averageElevationMeters);
  });

  it('should have average elevation of 1128 for test data', () => {
    expect(component.averageElevationMeters).toBe(1128);
  });

  it('should update targetElevationMeters when user changes input (metric)', () => {
    const newValue = 1500;
    const event = new Event('input');
    const input = document.createElement('input');
    input.type = 'number';
    input.value = newValue.toString();
    Object.defineProperty(event, 'target', { value: input, enumerable: true });

    component.setTargetElevation(event);

    expect(component.targetElevationMeters).toBe(newValue);
    expect(component.targetElevationDisplay).toBe(newValue);
  });

  it('should convert input value when user changes input (imperial)', () => {
    const settings = new Settings();
    settings.metric = false; // feet
    mockMrGpxSyncService.settings$ = new BehaviorSubject(settings);
    component.ngOnInit();

    // Set input to 5000 feet
    const newValueFeet = 5000;
    const event = new Event('input');
    const input = document.createElement('input');
    input.type = 'number';
    input.value = newValueFeet.toString();
    Object.defineProperty(event, 'target', { value: input, enumerable: true });

    component.setTargetElevation(event);

    expect(component.targetElevationDisplay).toBe(newValueFeet);
    // 5000 feet / 3.28084 = ~1524 meters
    const expectedMeters = 5000 / 3.28084;
    expect(component.targetElevationMeters).toBeCloseTo(expectedMeters, 0);
  });

  it('should restore original track when cancel is called', () => {
    const originalTrackFile = component.originalTrackFile;
    component.cancel();

    expect(mockMrGpxSyncService.setTrack).toHaveBeenCalledWith(originalTrackFile);
  });

  it('should emit cancel event when cancel button is clicked', (done) => {
    component.cancelOutput.subscribe((value) => {
      expect(value).toBe(true);
      done();
    });
    component.cancel();
  });

  it('should apply elevation change to all track points on save', () => {
    const newElevation = 1500;
    component.targetElevationMeters = newElevation;

    const trackSeg = trackFile.getTrack();
    spyOn(trackSeg, 'calcTrack');
    spyOn(trackSeg, 'analyze');

    component.save();

    // All points should have the new elevation
    trackSeg.trkPts.forEach((point: TrackPoint) => {
      expect(point.ele).toBe(newElevation);
    });
  });

  it('should call track methods when save is called', () => {
    const trackSeg = trackFile.getTrack();
    spyOn(trackSeg, 'calcTrack');
    spyOn(trackSeg, 'analyze');

    component.save();

    expect(trackSeg.calcTrack).toHaveBeenCalled();
    expect(trackSeg.analyze).toHaveBeenCalled();
  });

  it('should update track through service when save is called', () => {
    component.save();

    expect(mockMrGpxSyncService.setTrackSeg).toHaveBeenCalled();
  });

  it('should emit cancel event when save is completed', (done) => {
    component.cancelOutput.subscribe((value) => {
      expect(value).toBe(true);
      done();
    });
    component.save();
  });

  it('should handle empty track gracefully', () => {
    const emptyTrackFile = new TrackFile();
    mockMrGpxSyncService.getTrackFile.and.returnValue(emptyTrackFile);
    mockMrGpxSyncService.getTrack.and.returnValue(emptyTrackFile.getTrack());

    component.ngOnInit();

    expect(component.averageElevationMeters).toBe(0);
    expect(component.targetElevationMeters).toBe(0);
  });

  it('should handle points with null or undefined elevation', () => {
    const trackFile2 = new TrackFile();
    const track = new Track();
    const trackSeg = new TrackSeg();

    // Add points with mixed valid and invalid elevations
    const point1 = new TrackPoint();
    point1.lat = 37.4627900;
    point1.lon = -110.7452670;
    point1.ele = 1100;
    trackSeg.trkPts.push(point1);

    // Point with undefined elevation
    const point2 = new TrackPoint();
    point2.lat = 37.4627960;
    point2.lon = -110.7452750;
    point2.ele = undefined;
    trackSeg.trkPts.push(point2);

    // Point with valid elevation
    const point3 = new TrackPoint();
    point3.lat = 37.4628260;
    point3.lon = -110.7453100;
    point3.ele = 1200;
    trackSeg.trkPts.push(point3);

    // Point with NaN elevation
    const point4 = new TrackPoint();
    point4.lat = 37.4628420;
    point4.lon = -110.7453270;
    point4.ele = NaN;
    trackSeg.trkPts.push(point4);

    track.trkSegs.push(trackSeg);
    trackFile2.tracks.push(track);

    mockMrGpxSyncService.getTrackFile.and.returnValue(trackFile2);
    mockMrGpxSyncService.getTrack.and.returnValue(trackSeg);
    component.ngOnInit();

    // Should average only valid elevations: (1100 + 1200) / 2 = 1150
    expect(component.averageElevationMeters).toBe(1150);
  });

  it('should display pre-populated input with average elevation', () => {
    // The template should show targetElevationDisplay which should equal averageElevationDisplay
    expect(component.targetElevationDisplay).toBe(component.averageElevationDisplay);
  });

  it('should show correct unit label in template', () => {
    expect(component.settings.eleUnits).toBeDefined();
    expect(['m', 'ft']).toContain(component.settings.eleUnits);
  });

  it('should handle elevation with mixed valid values', () => {
    const trackFile3 = createTestTrackFile([1000, 1100, 1200, 1150, 1050]);
    mockMrGpxSyncService.getTrackFile.and.returnValue(trackFile3);
    mockMrGpxSyncService.getTrack.and.returnValue(trackFile3.getTrack());

    component.ngOnInit();

    // Average should be (1000 + 1100 + 1200 + 1150 + 1050) / 5 = 1100
    expect(component.averageElevationMeters).toBe(1100);
  });

  it('should round elevation values to nearest integer on save', () => {
    component.targetElevationMeters = 1234.56;
    const trackSeg = trackFile.getTrack();

    component.save();

    trackSeg.trkPts.forEach((point: TrackPoint) => {
      expect(Number.isInteger(point.ele)).toBe(true);
      expect(point.ele).toBe(1235);
    });
  });

  it('should maintain elevation consistency across metric to imperial conversion', () => {
    // Start with metric
    const metricSettings = new Settings();
    metricSettings.metric = true;
    mockMrGpxSyncService.settings$ = new BehaviorSubject(metricSettings);
    component.ngOnInit();

    const metricAverage = component.averageElevationDisplay;
    const metersValue = component.averageElevationMeters;

    // Switch to imperial
    const imperialSettings = new Settings();
    imperialSettings.metric = false;
    mockMrGpxSyncService.settings$ = new BehaviorSubject(imperialSettings);
    component.ngOnInit();

    const imperialAverage = component.averageElevationDisplay;

    // Verify conversion: feet = meters * 3.28084
    expect(imperialAverage).toBeCloseTo(metersValue * 3.28084, 1);
  });
});

