import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionCategoryComponent } from './question-category.component';

describe('QuestionCategoryComponent', () => {
  let component: QuestionCategoryComponent;
  let fixture: ComponentFixture<QuestionCategoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionCategoryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionCategoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
