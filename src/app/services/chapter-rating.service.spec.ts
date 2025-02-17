import { TestBed } from '@angular/core/testing';

import { ChapterRatingService } from './chapter-rating.service';

describe('ChapterRatingService', () => {
  let service: ChapterRatingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChapterRatingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
