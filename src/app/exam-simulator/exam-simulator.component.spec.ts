import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExamSimulatorComponent } from './exam-simulator.component';

describe('ExamSimulatorComponent', () => {
  let component: ExamSimulatorComponent;
  let fixture: ComponentFixture<ExamSimulatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExamSimulatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExamSimulatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
