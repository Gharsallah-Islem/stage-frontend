import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Question } from '../services/question.service';

@Component({
  selector: 'app-question-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-list.component.html',
  styleUrls: ['./question-list.component.css']
})
export class QuestionListComponent {
  @Input() questions: Question[] = [];
  @Output() questionSelected = new EventEmitter<Question>();
  selectQuestion(question: Question) {
    this.questionSelected.emit(question);
  }
}