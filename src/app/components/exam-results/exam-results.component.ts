import { Component } from '@angular/core';
import { ExamService } from '../../services/exam.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-exam-results',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './exam-results.component.html',
  styleUrls: ['./exam-results.component.css']
})
export class ExamResultsComponent {
  results: any[] = [];

  constructor(private examService: ExamService) { }

  ngOnInit() {
    this.examService.getResultsByUserId(1).subscribe(
      (response) => {
        this.results = response;
      },
      (error) => {
        console.error('Failed to fetch exam results', error);
      }
    );
  }
}
