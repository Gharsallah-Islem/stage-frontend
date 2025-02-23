import { Component, HostListener, input, Input, OnInit } from '@angular/core';
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
  analysis?: string;
  lastAccessed?: Date;
  successRate?: number;
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
  @Input() questions: Question[] = [];
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
  @Input() viewMode: 'grid' | 'list' = 'grid';

  aiQuestionType: 'multiple' | 'truefalse' | 'scenario' = 'multiple';
  aiGenerateCount = 1;
  aiSuggestedFilters: string[] = [];
  complexityScores = {
    easy: 25,
    medium: 50,
    hard: 75
  };
  aiAnalysisEnabled = false;
  questionStatistics = {
    totalUsage: 0,
    averageSuccess: 0,
    weakAreas: [] as string[]
  };

  constructor(private questionService: QuestionService) { }

  ngOnInit() {
    this.loadQuestions();
    this.generateAISuggestions();
    this.calculateQuestionStatistics();
  }

  async loadQuestions() {
    try {
      const questions = await this.questionService.getAllQuestions().toPromise() || [];
      this.questions = questions.map(q => ({
        ...q,
        lastAccessed: new Date(),
        successRate: Math.random() * 100
      }));
      this.filteredQuestions = [...this.questions];
      this.calculateAIGeneratedCount();
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  }

  private calculateAIGeneratedCount() {
    this.aiGeneratedCount = this.questions.filter(q => q.aiGenerated).length;
  }

  generateAISuggestions() {
    this.aiSuggestedFilters = this.questions
      .filter(q => q.successRate && q.successRate < 50)
      .map(q => q.category)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);
  }

  calculateQuestionStatistics() {
    this.questionStatistics = {
      totalUsage: this.questions.length * 3, // Mock data
      averageSuccess: this.questions.reduce((sum, q) => sum + (q.successRate || 0), 0) / this.questions.length,
      weakAreas: Array.from(new Set(this.questions
        .filter(q => (q.successRate || 0) < 50)
        .map(q => q.category)
      )).slice(0, 3)
    };
  }

  getDifficultyPercentage(difficulty: string): number {
    const total = this.questions.length;
    if (total === 0) return 0;
    const count = this.questions.filter(q => q.difficulty === difficulty).length;
    return Math.round((count / total) * 100);
  }

  getComplexityScore(difficulty: 'easy' | 'medium' | 'hard'): number {
    return this.complexityScores[difficulty];
  }

  async generateAIQuestion() {
    this.aiLoading = true;
    try {
      const generatedQuestions: Question[] = [];

      for (let i = 0; i < this.aiGenerateCount; i++) {
        const newQuestion = await this.questionService.generateAIQuestion(
          this.aiTopic,
          this.aiDifficulty,
          this.aiQuestionType
        );

        generatedQuestions.push({
          ...newQuestion,
          aiGenerated: true,
          lastAccessed: new Date(),
          successRate: 0,
          analysis: this.generateQuestionAnalysis(newQuestion)
        });
      }

      this.questions.unshift(...generatedQuestions);
      this.aiGeneratedCount += generatedQuestions.length;
      this.filterQuestions();
      this.showAIGenerator = false;
      this.aiTopic = '';
      this.calculateQuestionStatistics();
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      this.aiLoading = false;
    }
  }

  private generateQuestionAnalysis(question: Question): string {
    const focusAreas = ['Regulations', 'Procedures', 'Navigation'];
    return `AI Analysis: This ${question.difficulty} level question focuses on ${question.category} 
            and tests ${focusAreas[Math.floor(Math.random() * focusAreas.length)]} knowledge. 
            Recommended for ${Math.random() > 0.5 ? 'exam preparation' : 'concept reinforcement'}.`;
  }

  analyzeQuestionBank() {
    this.aiAnalysisEnabled = !this.aiAnalysisEnabled;
    if (this.aiAnalysisEnabled) {
      this.questions = this.questions.map(q => ({
        ...q,
        analysis: q.analysis || this.generateQuestionAnalysis(q)
      }));
    }
  }

  getQuestionAnalysis(question: Question): string {
    return question.analysis || 'AI Analysis pending...';
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
    if (!question.lastAccessed) {
      question.lastAccessed = new Date();
    }
  }

  toggleDifficulty(difficulty: typeof this.difficulties[number]) {
    this.selectedDifficulty = this.selectedDifficulty === difficulty ? null : difficulty;
    this.filterQuestions();
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Regulations': '#6a11cb',
      'Procedures': '#2575fc',
      'Navigation': '#10b981'
    };
    return colors[category] || '#6a11cb';
  }

  getDifficultyColor(difficulty: string): string {
    const colors: { [key: string]: string } = {
      'easy': '#10b981',
      'medium': '#f59e0b',
      'hard': '#ef4444'
    };
    return colors[difficulty] || '#6a11cb';
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