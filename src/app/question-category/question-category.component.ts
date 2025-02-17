import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-question-category',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-category.component.html',
  styleUrls: ['./question-category.component.css']
})
export class QuestionCategoryComponent {
  @Input() categories: string[] = [];
  @Output() categoryChange = new EventEmitter<string>();
  selectedCategory = 'all';

  selectCategory(category: string) {
    this.selectedCategory = category;
    this.categoryChange.emit(category);
  }
}