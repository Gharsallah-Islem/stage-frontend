import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ChapterService } from '../../services/chapter.service';
import { ExamService } from '../../services/exam.service';
import { ChapterRatingService } from '../../services/chapter-rating.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgParticlesModule } from 'ng-particles';
import { InteractivityDetect, type Container, type IOptions } from "tsparticles-engine";
import { Chart, registerables } from 'chart.js';
import { animate, style, transition, trigger } from '@angular/animations';
import { MarkdownModule } from 'ngx-markdown';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { MarkdownComponent, MarkdownService } from 'ngx-markdown';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';

Chart.register(...registerables);
const genAI = new GoogleGenerativeAI('AIzaSyDsQlOpephNf4bKPaqCy5SWGI-XvCYGtmY');

interface StudySession {
  subject: string;
  duration: number;
  date: Date;
  progress: number;
}

interface StudyGroup {
  subject: string;
  members: Member[];
  active: number;
}

interface Member {
  avatar: string;
  online: boolean;
}

interface ResourceType {
  name: string;
  icon: string;
  count: number;

}
interface Resource {
  title: string;
  type: string;
  duration: number;
  progress: number;
  icon: string;
  date: Date;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, NgParticlesModule, MarkdownModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  animations: [
    trigger('rowAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(-50px) rotateY(-90deg)' }),
        animate('400ms cubic-bezier(0.35, 0, 0.25, 1)',
          style({ opacity: 1, transform: 'translateX(0) rotateY(0)' }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  chatMessages: { content: string, isUser: boolean }[] = [];
  isScrolled = false;
  isMobileMenuOpen = false;
  geminiModel = genAI.getGenerativeModel({
    model: 'gemini-pro',
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
      },
    ],
  });
  id: string = 'particles';
  @ViewChild('performanceChart') performanceChartRef!: ElementRef;
  @ViewChild('trendChart') trendChartRef!: ElementRef;
  @ViewChild('masteryChart') masteryChartRef!: ElementRef;


  chapters: any[] = [];
  filteredChapters: any[] = [];
  searchQuery: string = '';
  userId: number | null = null;
  averageScore: number = 0;
  weakChapters: any[] = [];
  showEditModal: boolean = false;
  selectedChapter: any = null;

  // New Analytics Properties
  showAIPanel = false;
  AIQuestion = '';
  AIResponse = '';
  AILoading = false;
  timerDisplay = '25:00';
  timerSeconds = 1500;
  timerInterval: any;
  unlockedAchievements = 8;
  totalAchievements = 25;
  totalStudyHours = 147;

  studySessions: StudySession[] = [
    { subject: 'Procédure de travail pour la section DIFF', duration: 45, date: new Date(), progress: 75 },
    { subject: 'Cycle AIRAC', duration: 30, date: new Date(), progress: 60 }
  ];

  // Update the activeGroups definition:
  activeGroups: StudyGroup[] = [
    {
      subject: 'procédure de travail pour la section AIP',
      active: 2,
      members: [
        { avatar: 'assets/default-avatar.svg', online: true },
        { avatar: 'assets/default-avatar.svg', online: false }
      ]
    }
  ];

  recommendedResources: Resource[] = [
    {
      title: 'Exploitation de NOTAM pour les besoins du CCR',
      type: 'Video',
      duration: 45,
      progress: 65,
      icon: 'fas fa-video',
      date: new Date('2024-03-15')
    },
    {
      title: 'RNAV et RNP',
      type: 'Course',
      duration: 120,
      progress: 30,
      icon: 'fas fa-graduation-cap',
      date: new Date('2024-03-14')
    },
    {
      title: ' Les régles de l aire',
      type: 'Article',
      duration: 15,
      progress: 85,
      icon: 'fas fa-file-alt',
      date: new Date('2024-03-13')
    }
  ];

  resourceTypes: ResourceType[] = [
    { name: 'Video Lectures', icon: 'fas fa-video', count: 45 },
    { name: 'Practice Tests', icon: 'fas fa-file-alt', count: 23 }
  ];
  activeFilter = 'all';
  resourceFilters = [
    { id: 'all', name: 'All Resources', count: 0 },
    { id: 'videos', name: 'Video Lectures', count: 45 },
    { id: 'tests', name: 'Practice Tests', count: 23 }
  ];

  helpTips = [
    {
      id: 1, icon: 'fas fa-lightbulb', title: 'Quick Tip',
      content: 'Use the AI assistant to get personalized study recommendations', active: true
    }
  ];


  calendarDays = Array.from({ length: 30 }, (_, i) => ({
    date: i + 1,
    active: Math.random() > 0.7
  }));

  recentAchievements = [
    { title: 'Chapter Master', unlocked: true },
    { title: 'Perfect Score', unlocked: false },
    { title: '100 Hours', unlocked: true },
    { title: 'Quick Learner', unlocked: false }
  ];

  // Chart Instances
  private performanceChart?: Chart;
  private trendChart?: Chart;
  private masteryChart?: Chart;

  // Particles Configuration
  particlesOptions: IOptions = {
    background: {
      color: { value: "transparent" },
      image: '',
      opacity: 0,
      position: '',
      repeat: '',
      size: ''
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: "repulse",
          parallax: { enable: true, force: 30, smooth: 15 }
        },
        resize: { enable: true, delay: 0 },
        onClick: undefined,
        onDiv: undefined,
        onclick: undefined,
        ondiv: undefined,
        onhover: undefined
      },
      modes: { repulse: { distance: 100, duration: 0.4 } },
      detect_on: 'canvas',
      detectsOn: 'canvas'
    },
    particles: {
      color: {
        value: ["#6a11cb", "#2575fc", "#8A2BE2"],
        animation: undefined
      },
      links: {
        color: "#6a11cb",
        distance: 150,
        enable: true,
        opacity: 0.4
      },
      move: {
        enable: true,
        speed: 2,
        outModes: { default: "bounce" },
        angle: 0,
        attract: undefined,
        bounce: false,
        center: undefined,
        collisions: false,
        decay: 0,
        direction: 0,
        distance: 0,
        drift: 0,
        gravity: undefined,
        noise: undefined,
        outMode: 'none',
        out_mode: 'none',
        path: undefined,
        random: false,
        size: false,
        spin: undefined,
        straight: false,
        trail: undefined,
        vibrate: false,
        warp: false
      },
      opacity: {
        value: { min: 0.3, max: 0.7 },
        animation: {
          enable: true, speed: 1,
          destroy: 'none',
          mode: 'auto',
          startValue: 'min',
          count: 0,
          decay: 0,
          delay: 0,
          sync: false
        },
        anim: undefined,
        random: false
      },
      size: {
        value: { min: 1, max: 5 },
        animation: {
          enable: true, speed: 5,
          destroy: 'none',
          mode: 'auto',
          startValue: 'min',
          count: 0,
          decay: 0,
          delay: 0,
          sync: false
        },
        anim: undefined,
        random: false
      },
      shape: {
        type: "circle",
        character: undefined,
        close: false,
        custom: {},
        fill: false,
        image: undefined,
        images: undefined,
        options: {},
        polygon: undefined,
        stroke: undefined
      },
      bounce: undefined,
      collisions: undefined,
      groups: {},
      number: undefined,
      reduceDuplicates: false,
      shadow: undefined,
      stroke: undefined,
      zIndex: undefined
    },
    autoPlay: false,
    backgroundMask: undefined,
    backgroundMode: false,
    delay: 0,
    detectRetina: false,
    duration: 0,
    fpsLimit: 0,
    fps_limit: 0,
    fullScreen: false,
    manualParticles: [],
    pauseOnBlur: false,
    pauseOnOutsideViewport: false,
    responsive: [],
    retina_detect: false,
    smooth: false,
    style: undefined,
    themes: [],
    zLayers: 0
  };

  constructor(
    private chapterService: ChapterService,
    private examService: ExamService,
    private chapterRatingService: ChapterRatingService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }


  ngOnInit() {
    this.testGeminiConnection();
    this.userId = this.authService.getUserId();
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.fetchChapters();
  }


  ngAfterViewInit() {
    this.initCharts();
  }

  ngOnDestroy() {
    this.destroyCharts();
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
  private destroyCharts() {
    if (this.performanceChart) {
      this.performanceChart.destroy();
      this.performanceChart = undefined;
    }
    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = undefined;
    }
    if (this.masteryChart) {
      this.masteryChart.destroy();
      this.masteryChart = undefined;
    }
  }

  // AI Assistant Methods
  toggleAIPanel() {
    this.showAIPanel = !this.showAIPanel;
    if (this.showAIPanel) {
      this.destroyCharts();
    } else {
      this.initCharts();
    }
    this.cdr.detectChanges();
  }

  async handleAIQuestion() {
    if (!this.AIQuestion.trim()) return;

    const question = this.AIQuestion;
    this.chatMessages.push({ content: question, isUser: true });
    this.AIQuestion = '';
    this.AILoading = true;
    this.cdr.detectChanges(); // Force UI update

    try {
      const prompt = `As an aviation exam expert assistant, respond to: "${question}"
      User context:
      - Average score: ${this.averageScore}%
      - Weak chapters: ${this.weakChapters.map(c => c.name).join(', ')}
      - Study hours: ${this.totalStudyHours}
      
      Provide a helpful response with aviation exam focus.`;

      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response;

      if (!response.text()) {
        throw new Error('Empty response from AI');
      }

      this.chatMessages.push({
        content: response.text(),
        isUser: false
      });
    } catch (error) {
      console.error('AI Error:', error);
      this.chatMessages.push({
        content: '🚨 Failed to get response. Please check console for details.',
        isUser: false
      });
    } finally {
      this.AILoading = false;
      this.scrollChatToBottom();
      this.cdr.detectChanges(); // Force UI update after changes
    }
  }
  private scrollChatToBottom() {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.ai-chat-messages');
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }, 100);
  }

  // Study Timer Methods
  startPomodoro() {
    if (this.timerInterval) return;

    this.timerSeconds = 1500;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      this.updateTimerDisplay();

      if (this.timerSeconds <= 0) {
        this.stopTimer();
        this.studySessions.unshift({
          subject: 'Focused Session',
          duration: 25,
          date: new Date(),
          progress: 100
        });
      }
    }, 1000);
  }

  private updateTimerDisplay() {
    const minutes = Math.floor(this.timerSeconds / 60);
    const seconds = this.timerSeconds % 60;
    this.timerDisplay =
      `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerDisplay = '25:00';
  }

  startPracticeExam(type: 'timed' | 'adaptive') {
    this.router.navigate(['/exam', type]);
  }

  particlesLoaded(container: Container): void {
    console.log('Particles initialized', container);
  }

  private initCharts() {
    if (this.performanceChartRef?.nativeElement) {
      this.destroyCharts();
      this.performanceChart = new Chart(this.performanceChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Excellent (75-100%)', 'Good (50-74%)', 'Needs Improvement (<50%)'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#6a11cb', '#2575fc', '#ff4d4d'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }

    if (this.trendChartRef?.nativeElement) {
      this.trendChart = new Chart(this.trendChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: this.getLast12Months(),
          datasets: [{
            label: 'Mastery Progress',
            data: this.generateTrendData(),
            borderColor: '#6a11cb',
            backgroundColor: 'rgba(106, 17, 203, 0.1)',
            tension: 0.4,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    if (this.masteryChartRef?.nativeElement) {
      this.masteryChart = new Chart(this.masteryChartRef.nativeElement, {
        type: 'radar',
        data: {
          labels: ['Annexes et documents de l OACAI', 'E-AIP', 'AIM', ' RVSM', 'SMS'],
          datasets: [{
            label: 'Subject Mastery',
            data: [85, 72, 68, 90, 55],
            backgroundColor: 'rgba(106, 17, 203, 0.2)',
            borderColor: '#6a11cb'
          }]
        },
        options: {
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              grid: { color: 'rgba(106, 17, 203, 0.1)' }
            }
          }
        }
      });
    }
  }

  // Data Methods
  fetchChapters() {
    this.chapterService.getAllChapters().subscribe({
      next: (response: any[]) => {
        this.chapters = response.map(chapter => ({
          ...chapter,
          marks: 0,
          rating: 0,
          lastUpdated: new Date()
        }));
        this.filteredChapters = [...this.chapters];
        this.loadUserData();
        this.cdr.detectChanges();
        this.initCharts();
      },
      error: (error) => console.error('Failed to fetch chapters', error)
    });
  }

  loadUserData() {
    if (!this.userId) return;

    this.chapterRatingService.getUserRatings(this.userId).subscribe({
      next: (ratings: any[]) => {
        ratings.forEach(rating => {
          const chapter = this.chapters.find(c => c.id === rating.chapter.id);
          if (chapter) chapter.rating = rating.rating;
        });
        this.filterChapters();
      },
      error: (error) => console.error('Failed to fetch ratings', error)
    });

    this.examService.getUserResults(this.userId).subscribe({
      next: (results: any[]) => {
        results.forEach(result => {
          const chapter = this.chapters.find(c => c.id === result.chapter.id);
          if (chapter) {
            chapter.marks = result.score;
            chapter.lastUpdated = result.timestamp ? new Date(result.timestamp) : new Date();
          }
        });
        this.calculateAverageScore();
        this.identifyWeakChapters();
        this.filterChapters();
        this.updateCharts();
      },
      error: (error) => console.error('Failed to fetch results', error)
    });
  }

  // Utility Methods
  getLast12Months(): string[] {
    const years = ['2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'];
    years.reverse();
    return years.reverse();
  }

  generateTrendData(): number[] {
    return Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * (this.averageScore + 20 - (this.averageScore - 20)) + (this.averageScore - 20))
    );
  }

  // Chapter Management
  openChapterDetails(chapter: any) {
    this.selectedChapter = { ...chapter };
    this.showEditModal = true;
  }

  closeModal() {
    this.showEditModal = false;
    this.selectedChapter = null;
  }

  saveChanges() {
    const chapterIndex = this.chapters.findIndex(c => c.id === this.selectedChapter.id);
    if (chapterIndex > -1) {
      this.chapters[chapterIndex] = { ...this.selectedChapter };
      this.filterChapters();
      this.updateCharts();
      this.calculateAverageScore();
      this.identifyWeakChapters();
      this.submitResults();
    }
    this.closeModal();
  }

  filterChapters() {
    if (!this.searchQuery) {
      this.filteredChapters = [...this.chapters];
      return;
    }
    this.filteredChapters = this.chapters.filter(chapter =>
      chapter.name.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  updateCharts() {
    const scores = this.chapters.map(c => c.marks);
    const performanceData = [
      scores.filter(s => s >= 75).length,
      scores.filter(s => s >= 50 && s < 75).length,
      scores.filter(s => s < 50).length
    ];

    if (this.performanceChart) {
      this.performanceChart.data.datasets[0].data = performanceData;
      this.performanceChart.update();
    }

    if (this.trendChart) {
      this.trendChart.data.datasets[0].data = this.generateTrendData();
      this.trendChart.update();
    }
  }

  getPerformanceClass(score: number): string {
    if (score >= 75) return 'excellent';
    if (score >= 50) return 'good';
    return 'poor';
  }

  getPerformanceLabel(score: number): string {
    if (score >= 75) return 'Excellent Performance';
    if (score >= 50) return 'Good Progress';
    return 'Needs Improvement';
  }

  updateRating(chapterId: number, newRating: number) {
    if (!this.userId) return;
    const chapter = this.chapters.find((chap) => chap.id === chapterId);
    if (chapter) {
      chapter.rating = newRating;
      this.chapterRatingService.submitRating(this.userId, chapterId, newRating).subscribe({
        next: () => console.log('Rating updated'),
        error: (error) => console.error('Failed to update rating', error)
      });
    }
  }

  submitResults() {
    if (!this.userId) return;
    const results = this.chapters.map((chapter) => ({
      score: chapter.marks,
      user: { id: this.userId },
      chapter: { id: chapter.id },
    }));
    this.examService.submitResults(results).subscribe({
      next: (response) => console.log('Results submitted', response),
      error: (error) => console.error('Failed to submit results', error)
    });
  }

  calculateAverageScore() {
    const totalMarks = this.chapters.reduce((sum, chapter) => sum + chapter.marks, 0);
    this.averageScore = this.chapters.length ? totalMarks / this.chapters.length : 0;
  }

  identifyWeakChapters() {
    this.weakChapters = this.chapters.filter(chapter => chapter.marks <= 50);
  }
  toggleDay(day: any): void {
    day.active = !day.active;
  }
  get filteredResources() {
    return this.recommendedResources.filter(res =>
      this.activeFilter === 'all' || res.type.toLowerCase() === this.activeFilter
    );
  }

  openQuestionBank() {
    this.router.navigate(['/question-bank']);
  }

  dismissTip(tipId: number) {
    this.helpTips = this.helpTips.filter(t => t.id !== tipId);
  }
  async testGeminiConnection() {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Hello in aviation terms');
      console.log('API Test Response:', await result.response.text());
    } catch (error) {
      console.error('API Connection Test Failed:', error);
    }
  }
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 60;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }
}