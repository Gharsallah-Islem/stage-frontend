import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChapterService } from '../../services/chapter.service';
import { ExamService } from '../../services/exam.service';
import { ChapterRatingService } from '../../services/chapter-rating.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgParticlesModule } from 'ng-particles';
import { Chart, registerables } from 'chart.js';
import { animate, style, transition, trigger } from '@angular/animations';
import { MarkdownModule } from 'ngx-markdown';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { RouterModule } from '@angular/router';
import { Container, IOptions } from 'tsparticles-engine';

Chart.register(...registerables);
const genAI = new GoogleGenerativeAI('AIzaSyDsQlOpephNf4bKPaqCy5SWGI-XvCYGtmY');

interface StudySession { subject: string; duration: number; date: Date; progress: number; }
interface StudyGroup { subject: string; description: string; members: Member[]; active: number; id: number; }
interface Member { avatar: string; online: boolean; userId: number; }
interface Resource { title: string; type: string; duration: number; progress: number; icon: string; date: Date; url: string; id: number; }
interface ResourceType { name: string; icon: string; count: number; }
interface Notification { id: number; message: string; icon: string; type: 'success' | 'info' | 'warning' | 'error'; }
interface Chapter { id: number; name: string; marks: number; rating: number; lastUpdated: Date; contentUrl: string; }

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
        animate('400ms cubic-bezier(0.35, 0, 0.25, 1)', style({ opacity: 1, transform: 'translateX(0) rotateY(0)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ]),
    trigger('messageAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('notificationAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateX(100%)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(100%)' }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  chatMessages: { content: string; isUser: boolean }[] = [];
  isScrolled = false;
  isMobileMenuOpen = false;
  isDarkMode = false;
  showProfileMenu = false;
  notifications: Notification[] = [];
  geminiModel = genAI.getGenerativeModel({
    model: 'gemini-1.5-pro-002',
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

  chapters: Chapter[] = [];
  filteredChapters: Chapter[] = [];
  searchQuery: string = '';
  userId: number | null = null;
  userStatus: string = '';
  averageScore: number = 0;
  weakChapters: Chapter[] = [];
  showEditModal: boolean = false;
  selectedChapter: Chapter | null = null;
  showAIPanel = false;
  AIQuestion = '';
  AILoading = false;
  timerDisplay = '25:00';
  timerSeconds = 1500;
  timerInterval: any;
  unlockedAchievements = 8;
  totalAchievements = 25;
  totalStudyHours = 147;
  dailyStudyMinutes = 0;
  weeklyStudyHours = 0;
  dailyGoalMinutes = 150;
  lastExamScore = 82;
  examImprovement = '+12%';

  showCreateGroupModal = false;
  newGroupSubject = '';
  newGroupDescription = '';

  studySessions: StudySession[] = [
    { subject: 'Procédure DIFF', duration: 45, date: new Date(), progress: 75 },
    { subject: 'Cycle AIRAC', duration: 30, date: new Date(), progress: 60 }
  ];
  activeGroups: StudyGroup[] = [
    {
      id: 1,
      subject: 'AIP Procedures',
      description: 'Study group for AIP procedures and regulations',
      active: 2,
      members: [
        { avatar: 'assets/default-avatar.svg', online: true, userId: 1 },
        { avatar: 'assets/default-avatar.svg', online: false, userId: 2 }
      ]
    }
  ];
  recommendedResources: Resource[] = [
    { id: 1, title: 'NOTAM Exploitation', type: 'Video', duration: 45, progress: 65, icon: 'fas fa-video', date: new Date('2024-03-15'), url: 'https://example.com/notam' },
    { id: 2, title: 'RNAV et RNP', type: 'Course', duration: 120, progress: 30, icon: 'fas fa-graduation-cap', date: new Date('2024-03-14'), url: 'https://example.com/rnav' },
    { id: 3, title: 'Règles de l\'air', type: 'Article', duration: 15, progress: 85, icon: 'fas fa-file-alt', date: new Date('2024-03-13'), url: 'https://example.com/regles' }
  ];
  resourceFilters = [
    { id: 'all', name: 'All Resources', count: 0 },
    { id: 'videos', name: 'Video Lectures', count: 45 },
    { id: 'tests', name: 'Practice Tests', count: 23 }
  ];
  activeFilter = 'all';
  calendarDays = Array.from({ length: 30 }, (_, i) => ({ date: i + 1, active: Math.random() > 0.7 }));
  recentAchievements = [
    { title: 'Chapter Master', unlocked: true },
    { title: 'Perfect Score', unlocked: false },
    { title: '100 Hours', unlocked: true },
    { title: 'Quick Learner', unlocked: false }
  ];

  private performanceChart?: Chart;
  private trendChart?: Chart;
  private masteryChart?: Chart;

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
        onHover: { enable: true, mode: "repulse", parallax: { enable: true, force: 30, smooth: 15 } }, resize: { enable: true, delay: 0.5 },
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
        value: ["#4a0e8f", "#007bff", "#ff4d4d"],
        animation: undefined
      },
      links: { color: "#4a0e8f", distance: 150, enable: true, opacity: 0.4 },
      move: {
        enable: true, speed: 2, outModes: { default: "bounce" },
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
        value: { min: 0.3, max: 0.7 }, animation: {
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
        value: { min: 1, max: 5 }, animation: {
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
    const userId = this.authService.getUserId();
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }
    this.userStatus = this.authService.getStatus() || 'PENDING';
    if (this.userStatus === 'APPROVED') {
      this.userId = userId;
      this.fetchChapters();
      this.calculateStudyStats();
      this.addNotification('Welcome back! Check out your progress.', 'fas fa-bell', 'info');
      setInterval(() => {
        if (Math.random() > 0.8) {
          this.addNotification('Reminder: Review weak chapters today!', 'fas fa-exclamation-triangle', 'warning');
        }
      }, 60000);
    }
  }

  ngAfterViewInit() {
    this.initCharts();
    this.animateProgressBars();
  }

  ngOnDestroy() {
    this.destroyCharts();
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  private destroyCharts() {
    [this.performanceChart, this.trendChart, this.masteryChart].forEach(chart => chart?.destroy());
  }

  toggleAIPanel() {
    this.showAIPanel = !this.showAIPanel;
    this.cdr.detectChanges();
  }

  async handleAIQuestion() {
    if (!this.AIQuestion.trim()) return;
    const question = this.AIQuestion;
    this.chatMessages.push({ content: question, isUser: true });
    this.AIQuestion = '';
    this.AILoading = true;
    this.cdr.detectChanges();
    try {
      const prompt = `As an aviation exam expert, respond to: "${question}"\nUser context: Average score: ${this.averageScore}%, Weak chapters: ${this.weakChapters.map(c => c.name).join(', ')}, Study hours: ${this.totalStudyHours}`;
      const result = await this.geminiModel.generateContent(prompt);
      const response = await result.response.text();
      if (!response) throw new Error('Empty response from AI');
      this.chatMessages.push({ content: response, isUser: false });
      this.addNotification('AI responded to your question', 'fas fa-robot', 'info');
    } catch (error) {
      console.error('AI Error:', error);
      this.chatMessages.push({ content: '🚨 Failed to get response.', isUser: false });
      this.addNotification('Failed to get AI response', 'fas fa-exclamation-circle', 'error');
    } finally {
      this.AILoading = false;
      this.scrollChatToBottom();
      this.cdr.detectChanges();
    }
  }

  private scrollChatToBottom() {
    setTimeout(() => {
      const messagesContainer = document.querySelector('.ai-chat-messages');
      if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 100);
  }

  startPomodoro() {
    if (this.timerInterval) return;
    this.timerSeconds = 1500;
    this.updateTimerDisplay();
    this.timerInterval = setInterval(() => {
      this.timerSeconds--;
      this.updateTimerDisplay();
      if (this.timerSeconds <= 0) {
        this.stopTimer();
        const sessionDuration = 25;
        this.studySessions.unshift({
          subject: 'Focused Session',
          duration: sessionDuration,
          date: new Date(),
          progress: 100
        });
        this.dailyStudyMinutes += sessionDuration;
        this.totalStudyHours += sessionDuration / 60;
        this.calculateStudyStats();
        this.addNotification('Pomodoro session completed!', 'fas fa-check', 'success');
        if (this.totalStudyHours >= 150) {
          this.unlockAchievement('150 Hours');
        }
      }
    }, 1000);
    this.addNotification('Started Pomodoro session', 'fas fa-clock', 'info');
  }

  private updateTimerDisplay() {
    const minutes = Math.floor(this.timerSeconds / 60);
    const seconds = this.timerSeconds % 60;
    this.timerDisplay = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.timerDisplay = '25:00';
    this.addNotification('Pomodoro session stopped', 'fas fa-stop', 'info');
  }

  startPracticeExam(type: 'timed' | 'adaptive') {
    this.router.navigate(['/exam', type]);
    this.addNotification(`Started ${type} exam practice!`, 'fas fa-vial', 'info');
    setTimeout(() => {
      const simulatedScore = Math.floor(Math.random() * 40 + 60);
      const improvement = simulatedScore - this.lastExamScore;
      this.lastExamScore = simulatedScore;
      this.examImprovement = `${improvement > 0 ? '+' : ''}${improvement}%`;
      this.addNotification(`Completed ${type} exam with ${simulatedScore}%`, 'fas fa-check-circle', 'success');
      if (simulatedScore === 100) {
        this.unlockAchievement('Perfect Score');
      }
    }, 5000);
  }

  particlesLoaded(container: Container): void {
    console.log('Particles initialized', container);
  }

  private initCharts() {
    if (this.masteryChartRef?.nativeElement) {
      this.masteryChart = new Chart(this.masteryChartRef.nativeElement, {
        type: 'radar',
        data: {
          labels: ['Annexes OACAI', 'E-AIP', 'AIM', 'RVSM', 'SMS'],
          datasets: [{
            label: 'Subject Mastery',
            data: [85, 72, 68, 90, 55],
            backgroundColor: 'rgba(74, 14, 143, 0.2)',
            borderColor: '#4a0e8f',
            pointBackgroundColor: '#4a0e8f'
          }]
        },
        options: {
          responsive: true,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              grid: { color: 'rgba(74, 14, 143, 0.1)' },
              ticks: { backdropColor: 'transparent' }
            }
          },
          plugins: { tooltip: { backgroundColor: 'rgba(74, 14, 143, 0.8)', titleColor: '#fff', bodyColor: '#fff' } }
        }
      });
    }
    if (this.performanceChartRef?.nativeElement) {
      this.performanceChart = new Chart(this.performanceChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['Excellent (75-100%)', 'Good (50-74%)', 'Needs Improvement (<50%)'],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#4a0e8f', '#007bff', '#ff4d4d'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom', labels: { color: this.isDarkMode ? '#e0e0e0' : '#333' } },
            tooltip: { backgroundColor: 'rgba(74, 14, 143, 0.8)', titleColor: '#fff', bodyColor: '#fff' }
          },
          animation: { animateRotate: true, animateScale: true }
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
            borderColor: '#4a0e8f',
            backgroundColor: 'rgba(74, 14, 143, 0.1)',
            tension: 0.4,
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(74, 14, 143, 0.8)', titleColor: '#fff', bodyColor: '#fff' } },
          scales: {
            y: { beginAtZero: true, grid: { color: this.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' } },
            x: { grid: { color: this.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' } }
          },
          animation: { duration: 1000, easing: 'easeOutQuart' }
        }
      });
    }
    this.updateCharts();
  }

  fetchChapters() {
    this.chapterService.getAllChapters().subscribe({
      next: (response: any[]) => {
        this.chapters = response.map(chapter => ({
          ...chapter,
          marks: chapter.marks || 0,
          rating: chapter.rating || 0,
          lastUpdated: new Date(),
          contentUrl: `https://example.com/chapters/${chapter.id}.pdf`
        }));
        this.filteredChapters = [...this.chapters];
        this.loadUserData();
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Failed to fetch chapters', error);
        this.addNotification('Failed to load chapters', 'fas fa-exclamation-circle', 'error');
      }
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
      error: (error) => {
        console.error('Failed to fetch ratings', error);
        this.addNotification('Failed to load ratings', 'fas fa-exclamation-circle', 'error');
      }
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
        if (this.averageScore >= 90) {
          this.unlockAchievement('Chapter Master');
        }
      },
      error: (error) => {
        console.error('Failed to fetch results', error);
        this.addNotification('Failed to load exam results', 'fas fa-exclamation-circle', 'error');
      }
    });
  }

  getLast12Months(): string[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const today = new Date();
    const currentMonth = today.getMonth();
    return Array.from({ length: 12 }, (_, i) => months[(currentMonth - i + 12) % 12]).reverse();
  }

  generateTrendData(): number[] {
    return Array.from({ length: 12 }, () => Math.floor(Math.random() * (this.averageScore + 20 - (this.averageScore - 20)) + (this.averageScore - 20)));
  }

  openChapterDetails(chapter: Chapter) {
    this.selectedChapter = { ...chapter };
    this.showEditModal = true;
    this.addNotification(`Editing ${chapter.name}`, 'fas fa-edit', 'info');
  }

  closeModal() {
    this.showEditModal = false;
    this.selectedChapter = null;
  }

  saveChanges() {
    if (!this.selectedChapter) return;
    const chapterIndex = this.chapters.findIndex(c => c.id === this.selectedChapter!.id);
    if (chapterIndex > -1) {
      this.chapters[chapterIndex] = { ...this.selectedChapter };
      this.filterChapters();
      this.updateCharts();
      this.calculateAverageScore();
      this.identifyWeakChapters();
      this.submitResults();
      this.addNotification(`Updated ${this.selectedChapter.name} successfully!`, 'fas fa-save', 'success');
      if (this.selectedChapter.marks === 100) {
        this.unlockAchievement('Perfect Score');
      }
    }
    this.closeModal();
  }

  filterChapters() {
    this.filteredChapters = this.searchQuery
      ? this.chapters.filter(chapter => chapter.name.toLowerCase().includes(this.searchQuery.toLowerCase()))
      : [...this.chapters];
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
    if (this.performanceChart) {
      this.performanceChart.options.plugins!.legend!.labels!.color = this.isDarkMode ? '#e0e0e0' : '#333';
      this.performanceChart.update();
    }
    if (this.trendChart) {
      this.trendChart.options.scales!['y']!.grid!.color = this.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      this.trendChart.options.scales!['x']!.grid!.color = this.isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
      this.trendChart.update();
    }
  }

  updateRating(chapterId: number, newRating: number) {
    if (!this.userId) return;
    const chapter = this.chapters.find(chap => chap.id === chapterId);
    if (chapter) {
      chapter.rating = newRating;
      this.chapterRatingService.submitRating(this.userId, chapterId, newRating).subscribe({
        next: () => {
          this.addNotification(`Rated ${chapter.name} ${newRating} stars`, 'fas fa-star', 'success');
        },
        error: (error) => {
          console.error('Failed to update rating', error);
          this.addNotification('Failed to update rating', 'fas fa-exclamation-circle', 'error');
        }
      });
    }
  }

  submitResults() {
    if (!this.userId) return;
    const results = this.chapters.map(chapter => ({
      score: chapter.marks,
      user: { id: this.userId },
      chapter: { id: chapter.id }
    }));
    this.examService.submitResults(results).subscribe({
      next: (response) => {
        console.log('Results submitted', response);
        this.addNotification('Results submitted successfully', 'fas fa-check', 'success');
      },
      error: (error) => {
        console.error('Failed to submit results', error);
        this.addNotification('Failed to submit results', 'fas fa-exclamation-circle', 'error');
      }
    });
  }

  calculateAverageScore() {
    const totalMarks = this.chapters.reduce((sum, chapter) => sum + chapter.marks, 0);
    this.averageScore = this.chapters.length ? totalMarks / this.chapters.length : 0;
  }

  identifyWeakChapters() {
    this.weakChapters = this.chapters.filter(chapter => chapter.marks <= 50);
    if (this.weakChapters.length > 0) {
      this.addNotification(`${this.weakChapters.length} weak chapters identified`, 'fas fa-exclamation-triangle', 'warning');
    }
  }

  toggleDay(day: any) {
    day.active = !day.active;
    this.addNotification(`Toggled study day ${day.date}`, 'fas fa-calendar-check', 'info');
  }

  get filteredResources() {
    return this.recommendedResources.filter(res =>
      this.activeFilter === 'all' ||
      res.type.toLowerCase() === this.activeFilter
    );
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    document.body.classList.toggle('dark-mode', this.isDarkMode);
    this.updateCharts();
    this.addNotification(`Switched to ${this.isDarkMode ? 'dark' : 'light'} mode`, 'fas fa-adjust', 'info');
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  signOut() {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.addNotification('Signed out successfully', 'fas fa-sign-out-alt', 'success');
  }

  downloadChapter(chapter: Chapter) {
    window.open(chapter.contentUrl, '_blank');
    this.addNotification(`Downloading ${chapter.name} PDF`, 'fas fa-download', 'info');
    setTimeout(() => {
      this.addNotification(`Download of ${chapter.name} completed`, 'fas fa-check', 'success');
    }, 2000);
  }

  openCreateGroupModal() {
    this.showCreateGroupModal = true;
    this.newGroupSubject = '';
    this.newGroupDescription = '';
    this.addNotification('Opened create group modal', 'fas fa-users', 'info');
  }

  closeCreateGroupModal() {
    this.showCreateGroupModal = false;
    this.newGroupSubject = '';
    this.newGroupDescription = '';
  }

  createNewGroup() {
    if (!this.newGroupSubject.trim()) {
      this.addNotification('Group subject is required', 'fas fa-exclamation-circle', 'error');
      return;
    }
    const newGroup: StudyGroup = {
      id: Date.now(),
      subject: this.newGroupSubject,
      description: this.newGroupDescription,
      active: 1,
      members: [{
        avatar: 'assets/user-avatar.png',
        online: true,
        userId: this.userId!
      }]
    };
    this.activeGroups.push(newGroup);
    this.closeCreateGroupModal();
    this.addNotification(`Created new group: ${newGroup.subject}`, 'fas fa-users', 'success');
  }

  joinGroup(group: StudyGroup) {
    const userExists = group.members.some(member => member.userId === this.userId);
    if (userExists) {
      this.addNotification(`Already a member of ${group.subject}`, 'fas fa-exclamation-circle', 'warning');
      return;
    }
    group.members.push({
      avatar: 'assets/user-avatar.png',
      online: true,
      userId: this.userId!
    });
    group.active++;
    this.addNotification(`Joined ${group.subject} group`, 'fas fa-door-open', 'success');
  }

  openResource(resource: Resource) {
    window.open(resource.url, '_blank');
    resource.progress = Math.min(resource.progress + 10, 100);
    this.addNotification(`Opened ${resource.title}`, 'fas fa-external-link-alt', 'info');
    if (resource.progress === 100) {
      this.addNotification(`${resource.title} completed`, 'fas fa-check', 'success');
      this.unlockAchievement('Quick Learner');
    }
  }

  addNotification(message: string, icon: string, type: 'success' | 'info' | 'warning' | 'error') {
    const id = Date.now();
    this.notifications.push({ id, message, icon, type });
    setTimeout(() => this.dismissNotification(id), 5000);
  }

  dismissNotification(id: number) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }

  animateProgressBars() {
    setTimeout(() => {
      const progressBars = document.querySelectorAll('.progress-bar, .progress-fill');
      progressBars.forEach(bar => {
        const width = (bar as HTMLElement).style.width;
        (bar as HTMLElement).style.width = '0%';
        setTimeout(() => {
          (bar as HTMLElement).style.transition = 'width 1s ease';
          (bar as HTMLElement).style.width = width;
        }, 100);
      });
    }, 100);
  }

  async testGeminiConnection() {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('Hello in aviation terms');
      console.log('API Test Response:', await result.response.text());
    } catch (error) {
      console.error('API Connection Test Failed:', error);
      this.addNotification('AI connection test failed', 'fas fa-exclamation-circle', 'error');
    }
  }

  unlockAchievement(title: string) {
    const achievement = this.recentAchievements.find(a => a.title === title);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      this.unlockedAchievements++;
      this.addNotification(`Achievement unlocked: ${title}`, 'fas fa-trophy', 'success');
    }
  }

  calculateStudyStats() {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    this.dailyStudyMinutes = this.studySessions
      .filter(session => session.date.toDateString() === today.toDateString())
      .reduce((sum, session) => sum + session.duration, 0);

    this.weeklyStudyHours = this.studySessions
      .filter(session => session.date >= weekStart)
      .reduce((sum, session) => sum + (session.duration / 60), 0)
      .toFixed(1) as any;
  }

  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 60;
  }
}