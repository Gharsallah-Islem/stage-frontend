import { Component, HostListener, OnInit } from '@angular/core';
import { QuestionService } from '../services/question.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuestionListComponent } from '../question-list/question-list.component';
import { QuestionCategoryComponent } from '../question-category/question-category.component';
import { RouterModule } from '@angular/router';
export interface Question {
  id: number;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: { text: string; correct: boolean }[];
  explanation?: string;
  aiGenerated?: boolean;
}

@Component({
  selector: 'app-question-bank',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    QuestionListComponent,
    QuestionCategoryComponent,
    RouterModule
  ],
  templateUrl: './question-bank.component.html',
  styleUrls: ['./question-bank.component.css']
})
export class QuestionBankComponent implements OnInit {
  questions: Question[] = [];
  filteredQuestions: Question[] = [];
  searchQuery = '';
  selectedCategory = 'all';
  selectedDifficulty: 'easy' | 'medium' | 'hard' | null = null;
  showAIGenerator = false;
  aiTopic = '';
  aiDifficulty: 'easy' | 'medium' | 'hard' = 'medium';
  aiLoading = false;
  aiGeneratedCount = 0;
  selectedQuestion: Question | null = null;
  isScrolled = false;
  isMobileMenuOpen = false;
  difficulties = ['easy', 'medium', 'hard'] as const;

  constructor(private questionService: QuestionService) { }

  ngOnInit() {
    this.loadQuestions();
  }

  async loadQuestions() {
    try {
      this.questions = await this.questionService.getAllQuestions().toPromise() || [];
      this.filteredQuestions = [...this.questions];
      this.calculateAIGeneratedCount();
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  }

  private calculateAIGeneratedCount() {
    this.aiGeneratedCount = this.questions.filter(q => q.aiGenerated).length;
  }

  async generateAIQuestion() {
    this.aiLoading = true;
    try {
      const newQuestion = await this.questionService.generateAIQuestion(
        this.aiTopic,
        this.aiDifficulty
      );
      newQuestion.aiGenerated = true;
      this.questions.unshift(newQuestion);
      this.aiGeneratedCount++;
      this.filterQuestions();
      this.showAIGenerator = false;
      this.aiTopic = '';
    } catch (error) {
      console.error('Failed to generate question:', error);
    } finally {
      this.aiLoading = false;
    }
  }

  filterQuestions() {
    this.filteredQuestions = this.questions.filter(q => {
      const matchesText = q.text.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesCategory = this.selectedCategory === 'all' || q.category === this.selectedCategory;
      const matchesDifficulty = !this.selectedDifficulty || q.difficulty === this.selectedDifficulty;
      return matchesText && matchesCategory && matchesDifficulty;
    });
  }

  showQuestionDetail(question: Question) {
    this.selectedQuestion = question;
  }

  toggleDifficulty(difficulty: typeof this.difficulties[number]) {
    this.selectedDifficulty = this.selectedDifficulty === difficulty ? null : difficulty;
    this.filterQuestions();
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 60;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  get categories(): ('all' | 'Regulations' | 'Procedures' | 'Navigation')[] {
    return ['all', 'Regulations', 'Procedures', 'Navigation'];
  }
}