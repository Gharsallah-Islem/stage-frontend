import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MarkdownModule } from 'ngx-markdown';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { RouterModule } from '@angular/router';

interface Question {
  id: number;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: { text: string; correct: boolean }[];
  explanation?: string;
}

interface ExamResult {
  question: Question;
  selectedAnswer: number | null;
  isCorrect: boolean;
}

interface AIStudyPlan {
  weakAreas: string[];
  recommendedResources: string[];
  practiceQuestions: string[];
}

interface AIChatMessage {
  content: string;
  isUser: boolean;
  timestamp: Date;
}

@Component({
  selector: 'app-exam-simulator',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownModule, RouterModule],
  templateUrl: './exam-simulator.component.html',
  styleUrls: ['./exam-simulator.component.css'],
  animations: [
    trigger('optionHover', [
      state('default', style({ transform: 'translateZ(0)', boxShadow: 'none' })),
      state('selected', style({ transform: 'translateZ(20px)', boxShadow: '0 0 25px rgba(106, 17, 203, 0.4)' })),
      transition('default <=> selected', animate('0.3s cubic-bezier(0.23, 1, 0.32, 1)'))
    ]),
    trigger('questionNavigation', [
      transition(':increment', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':decrement', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ]),
    trigger('cardFlip', [
      transition(':increment, :decrement', [
        style({ transform: 'rotateY(180deg)', opacity: 0 }),
        animate('500ms cubic-bezier(0.23, 1, 0.32, 1)',
          style({ transform: 'rotateY(0deg)', opacity: 1 }))
      ])
    ]),
    trigger('chatAnimation', [
      state('open', style({ transform: 'translateY(0)' })),
      state('closed', style({ transform: 'translateY(100%)' })),
      transition('* <=> *', animate('300ms ease-in-out'))
    ]),
    trigger('messageAnim', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms {{delay}}ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ], { params: { delay: 0 } })
    ])
  ]
})
export class ExamSimulatorComponent implements OnInit, OnDestroy {
  isScrolled = false;
  isMobileMenuOpen = false;
  ngOnInit(): void {

  }
  examStarted = false;
  examFinished = false;
  currentQuestionIndex = 0;
  selectedAnswer: number | null = null;
  timer = 0;
  timerInterval: any;
  userAnswers: ExamResult[] = [];
  navigationState = { isAnimating: false, direction: '' };
  aiStudyPlan?: AIStudyPlan;
  aiChat: AIChatMessage[] = [];
  aiQuery = '';
  isAIChatOpen = false;
  isGeneratingPlan = false;

  questions: Question[] = [
    {
      id: 1,
      text: 'What is the primary purpose of AIRAC cycles in aviation?',
      category: 'Procedures',
      difficulty: 'medium',
      options: [
        { text: 'To standardize aircraft maintenance schedules', correct: false },
        { text: 'To coordinate global navigation data updates', correct: true },
        { text: 'To regulate pilot training requirements', correct: false },
        { text: 'To manage air traffic controller shifts', correct: false }
      ],
      explanation: 'AIRAC (Aeronautical Information Regulation And Control) cycles ensure synchronized updates of aviation navigation data worldwide every 28 days.'
    },
    {
      id: 2,
      text: 'What does the term "RVSM" stand for in aviation?',
      category: 'Airspace',
      difficulty: 'hard',
      options: [
        { text: 'Reduced Vertical Separation Minimum', correct: true },
        { text: 'Regional Velocity Safety Measure', correct: false },
        { text: 'Radar Verified Separation Margin', correct: false },
        { text: 'Required Velocity Standardization Method', correct: false }
      ],
      explanation: 'RVSM allows aircraft to fly with 1,000 feet vertical separation between FL290 and FL410 instead of 2,000 feet.'
    },
    {
      id: 3,
      text: 'What is the primary function of a transponder in an aircraft?',
      category: 'Avionics',
      difficulty: 'easy',
      options: [
        { text: 'To communicate with ATC', correct: false },
        { text: 'To transmit aircraft position and altitude', correct: true },
        { text: 'To navigate using GPS', correct: false },
        { text: 'To monitor engine performance', correct: false }
      ]
    },
    {
      id: 4,
      text: 'What does the abbreviation "ATIS" stand for?',
      category: 'Communication',
      difficulty: 'easy',
      options: [
        { text: 'Automatic Terminal Information Service', correct: true },
        { text: 'Air Traffic Information System', correct: false },
        { text: 'Aircraft Technical Information Service', correct: false },
        { text: 'Automated Taxi Instruction Service', correct: false }
      ]
    },
    {
      id: 5,
      text: 'What is the minimum visibility required for VFR flight in Class C airspace?',
      category: 'Regulations',
      difficulty: 'medium',
      options: [
        { text: '1 statute mile', correct: false },
        { text: '3 statute miles', correct: true },
        { text: '5 statute miles', correct: false },
        { text: '10 statute miles', correct: false }
      ]
    },
    {
      id: 6,
      text: 'What is the purpose of a squawk code 7500?',
      category: 'Security',
      difficulty: 'hard',
      options: [
        { text: 'Radio failure', correct: false },
        { text: 'Hijacking situation', correct: true },
        { text: 'Emergency descent', correct: false },
        { text: 'Fuel emergency', correct: false }
      ]
    },
    {
      id: 7,
      text: 'What does the term "METAR" refer to?',
      category: 'Meteorology',
      difficulty: 'easy',
      options: [
        { text: 'Aviation routine weather report', correct: true },
        { text: 'Military flight plan', correct: false },
        { text: 'Aircraft maintenance log', correct: false },
        { text: 'Air traffic control frequency', correct: false }
      ]
    },
    {
      id: 8,
      text: 'What is the primary purpose of winglets on aircraft wings?',
      category: 'Aerodynamics',
      difficulty: 'medium',
      options: [
        { text: 'Reduce aerodynamic drag', correct: true },
        { text: 'Increase cabin pressurization', correct: false },
        { text: 'Improve radar visibility', correct: false },
        { text: 'Enhance passenger comfort', correct: false }
      ]
    },
    {
      id: 9,
      text: 'What is the meaning of a steady red light from the control tower?',
      category: 'Signals',
      difficulty: 'easy',
      options: [
        { text: 'Continue circling', correct: false },
        { text: 'Give way to other aircraft', correct: false },
        { text: 'Stop immediately', correct: true },
        { text: 'Return to starting point', correct: false }
      ]
    },
    {
      id: 10,
      text: 'What is the primary purpose of the black box in an aircraft?',
      category: 'Safety',
      difficulty: 'easy',
      options: [
        { text: 'Record flight data and cockpit audio', correct: true },
        { text: 'Store passenger information', correct: false },
        { text: 'Track maintenance schedules', correct: false },
        { text: 'Monitor fuel consumption', correct: false }
      ]
    },
    {
      id: 11,
      text: 'What is the primary regulatory body for civil aviation in Tunisia?',
      category: 'Regulations',
      difficulty: 'easy',
      options: [
        { text: 'Tunisian Air Force', correct: false },
        {
          text: 'Office de l Aviation Civile et des Aéroports(OACA)', correct: true
        },
        { text: 'Ministry of Transport', correct: false },
        { text: 'Tunisair', correct: false }
      ],
      explanation: 'OACA is responsible for civil aviation regulation and airport management in Tunisia.'
    },
    {
      id: 12,
      text: 'What is the ICAO designation for Tunis-Carthage International Airport?',
      category: 'Airspace',
      difficulty: 'medium',
      options: [
        { text: 'DTTA', correct: true },
        { text: 'TNCA', correct: false },
        { text: 'TTUN', correct: false },
        { text: 'DTTC', correct: false }
      ],
      explanation: 'DTTA is the ICAO code for Tunis-Carthage Airport, while TUN is its IATA code.'
    },
    {
      id: 13,
      text: 'What is the minimum visibility required for VFR flights in Tunisian class C airspace?',
      category: 'Regulations',
      difficulty: 'hard',
      options: [
        { text: '5 km', correct: true },
        { text: '3 km', correct: false },
        { text: '8 km', correct: false },
        { text: '10 km', correct: false }
      ],
      explanation: 'As per Tunisian AIP, VFR flights in class C require 5km visibility and remaining clear of clouds.'
    },
    {
      id: 14,
      text: 'Which frequency is used for Tunis Approach Control?',
      category: 'Communication',
      difficulty: 'medium',
      options: [
        { text: '118.1 MHz', correct: true },
        { text: '121.5 MHz', correct: false },
        { text: '130.0 MHz', correct: false },
        { text: '108.1 MHz', correct: false }
      ],
      explanation: '118.1 MHz is the primary frequency for Tunis Approach Control (verified in AIP Tunisia).'
    },
    {
      id: 15,
      text: 'What is the transition altitude at Djerba-Zarzis International Airport?',
      category: 'Procedures',
      difficulty: 'hard',
      options: [
        { text: '4000 feet', correct: false },
        { text: '5000 feet', correct: false },
        { text: '3000 feet', correct: true },
        { text: 'FL060', correct: false }
      ],
      explanation: 'Transition altitude at DTTJ (Djerba) is 3000 feet as per Tunisian AIP.'
    },
    {
      id: 16,
      text: 'Which Tunisian airport requires special noise abatement procedures between 2300-0600 UTC?',
      category: 'Procedures',
      difficulty: 'medium',
      options: [
        { text: 'Tabarka-Ain Draham', correct: false },
        { text: 'Tunis-Carthage', correct: true },
        { text: 'Monastir', correct: false },
        { text: 'Tozeur', correct: false }
      ],
      explanation: 'Tunis-Carthage has strict noise restrictions during night hours.'
    },
    {
      id: 17,
      text: 'What is the currency symbol for Tunisian aviation publications?',
      category: 'Regulations',
      difficulty: 'hard',
      options: [
        { text: '28 days', correct: false },
        { text: '42 days', correct: true },
        { text: '56 days', correct: false },
        { text: 'AIRAC cycle', correct: false }
      ],
      explanation: 'Tunisian AIP amendments follow a 42-day currency period.'
    },
    {
      id: 18,
      text: 'Which navigation aid is available at Sfax-Thyna International Airport?',
      category: 'Avionics',
      difficulty: 'medium',
      options: [
        { text: 'VOR/DME', correct: true },
        { text: 'ILS CAT III', correct: false },
        { text: 'NDB', correct: false },
        { text: 'GPS waypoint only', correct: false }
      ],
      explanation: 'DTTX (Sfax) has VOR/DME (SFA) on 113.7 MHz.'
    },
    {
      id: 19,
      text: 'What is the standard arrival route for flights entering Tunis FIR from the east?',
      category: 'Airspace',
      difficulty: 'hard',
      options: [
        { text: 'AMBER transition', correct: true },
        { text: 'BLUE transition', correct: false },
        { text: 'RED transition', correct: false },
        { text: 'GREEN transition', correct: false }
      ],
      explanation: 'AMBER transition is used for arrivals from eastern Mediterranean routes.'
    },
    {
      id: 20,
      text: 'Which ICAO Annex applies to aircraft noise certification in Tunisia?',
      category: 'Regulations',
      difficulty: 'medium',
      options: [
        { text: 'Annex 16 Volume I', correct: true },
        { text: 'Annex 6', correct: false },
        { text: 'Annex 14', correct: false },
        { text: 'Annex 2', correct: false }
      ],
      explanation: 'Annex 16 Volume I deals with aircraft noise certification requirements.'
    },
    {
      id: 21,
      text: 'What is the minimum equipment required for IFR flights in Tunisian airspace?',
      category: 'Avionics',
      difficulty: 'hard',
      options: [
        { text: 'VHF, GPS, and transponder', correct: false },
        { text: 'VOR, DME, and ADF', correct: false },
        { text: 'VHF, suitable navigation equipment, and altimeter', correct: true },
        { text: 'TCAS and GPWS', correct: false }
      ],
      explanation: 'As per OAC regulations, basic IFR requirements follow ICAO Annex 6 standards.'
    },
    {
      id: 22,
      text: 'Which airspace class surrounds Tunis-Carthage Airport during peak hours?',
      category: 'Airspace',
      difficulty: 'medium',
      options: [
        { text: 'Class C', correct: false },
        { text: 'Class D', correct: false },
        { text: 'Class B', correct: true },
        { text: 'Class A', correct: false }
      ],
      explanation: 'Tunis-Carthage CTR becomes Class B during high-density operations.'
    },
    {
      id: 23,
      text: 'What is the required documentation for general aviation flights entering Tunisia?',
      category: 'Regulations',
      difficulty: 'hard',
      options: [
        { text: 'Gendarme approval', correct: false },
        { text: 'eAPIS filing', correct: false },
        { text: 'Overflight permit from OACA', correct: true },
        { text: 'Customs pre-clearance', correct: false }
      ],
      explanation: 'Foreign GA flights require prior OACA approval for entry into Tunisian airspace.'
    },
    {
      id: 24,
      text: 'Which frequency is designated for emergency communications in Tunis FIR?',
      category: 'Communication',
      difficulty: 'easy',
      options: [
        { text: '121.5 MHz', correct: true },
        { text: '118.1 MHz', correct: false },
        { text: '131.8 MHz', correct: false },
        { text: '123.45 MHz', correct: false }
      ]
    },
    {
      id: 25,
      text: 'What is the maximum altitude for VFR flights in Tunisia?',
      category: 'Regulations',
      difficulty: 'medium',
      options: [
        { text: 'FL100', correct: false },
        { text: '10,000 feet', correct: false },
        { text: '3,000 feet AGL', correct: true },
        { text: '5,000 feet MSL', correct: false }
      ],
      explanation: 'VFR flights limited to 3,000 ft AGL unless special authorization obtained.'
    },
    {
      id: 26,
      text: 'What is the customs clearance procedure for private flights at Djerba Airport?',
      category: 'Procedures',
      difficulty: 'hard',
      options: [
        { text: 'Prior e-mail notification required', correct: true },
        { text: 'On-arrival declaration only', correct: false },
        { text: 'No customs required', correct: false },
        { text: '24-hour advance notice', correct: false }
      ]
    },
    {
      id: 27,
      text: 'Which Tunisian airport has CAT II ILS capabilities?',
      category: 'Avionics',
      difficulty: 'medium',
      options: [
        { text: 'Tunis-Carthage (DTTA)', correct: true },
        { text: 'Djerba (DTTJ)', correct: false },
        { text: 'Sfax (DTTX)', correct: false },
        { text: 'Tozeur (DTTZ)', correct: false }
      ]
    },
  ];


  private genAI = new GoogleGenerativeAI('AIzaSyDsQlOpephNf4bKPaqCy5SWGI-XvCYGtmY');
  geminiModel = this.genAI.getGenerativeModel({
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


  async generateStudyPlan() {
    this.isGeneratingPlan = true;
    const incorrectTopics = [...new Set(this.incorrectAnswers.map(a => a.question.category))];

    const prompt = `As an aviation exam expert, create a study plan focusing on: ${incorrectTopics.join(', ')}.
      Include:
      1. Weak areas (max 3)
      2. Recommended official resources (FAA, ICAO, EASA)
      3. 2 practice questions per weak area
      Format: { "weakAreas": [], "recommendedResources": [], "practiceQuestions": [] }`;

    try {
      const result = await this.geminiModel.generateContent(prompt);
      const text = result.response.text();
      this.aiStudyPlan = this.parseAIStudyPlan(text);
    } catch (error) {
      console.error('AI Error:', error);
      this.aiChat.push({
        content: 'Failed to generate study plan. Please try again later.',
        isUser: false,
        timestamp: new Date()
      });
    } finally {
      this.isGeneratingPlan = false;
    }
  }

  private parseAIStudyPlan(text: string): AIStudyPlan {
    const cleanJSON = text.replace(/```json|```/g, '');
    return JSON.parse(cleanJSON);
  }

  async handleAIChatQuery() {
    if (!this.aiQuery.trim()) return;

    const userMessage = {
      content: this.aiQuery,
      isUser: true,
      timestamp: new Date()
    };
    this.aiChat.push(userMessage);

    const context = `User is reviewing aviation exam results. 
      Score: ${this.correctAnswersCount}/${this.questions.length}
      Weak areas: ${this.incorrectAnswers.map(a => a.question.category).join(', ')}`;

    try {
      const result = await this.geminiModel.generateContent(`${context}\n\nQuestion: ${this.aiQuery}`);
      const aiMessage = {
        content: result.response.text(),
        isUser: false,
        timestamp: new Date()
      };
      this.aiChat.push(aiMessage);
    } catch (error) {
      this.aiChat.push({
        content: 'Error getting AI response. Please try again.',
        isUser: false,
        timestamp: new Date()
      });
    }

    this.aiQuery = '';
  }

  async startExam() {
    this.questions = this.shuffleArray([...this.questions]).slice(0, 10);
    this.examStarted = true;
    this.startTimer();
  }
  private shuffleArray(array: Question[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  async finishExam() {
    this.examFinished = true;
    clearInterval(this.timerInterval);
    await this.generateStudyPlan();
  }

  get incorrectAnswers() {
    return this.userAnswers.filter(a => !a.isCorrect);
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
  }
  startTimer() {
    this.timerInterval = setInterval(() => this.timer++, 1000);
  }

  navigateToQuestion(direction: 'previous' | 'next') {
    if (this.canNavigate(direction)) {
      this.saveAnswer();
      this.navigationState = { isAnimating: true, direction };

      setTimeout(() => {
        this.currentQuestionIndex += direction === 'next' ? 1 : -1;
        this.selectedAnswer = null;
        this.navigationState.isAnimating = false;

        if (this.currentQuestionIndex === this.questions.length) {
          this.finishExam();
        }
      }, 300);
    }
  }

  private saveAnswer() {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    this.userAnswers[this.currentQuestionIndex] = {
      question: currentQuestion,
      selectedAnswer: this.selectedAnswer,
      isCorrect: this.selectedAnswer === currentQuestion.options.findIndex(o => o.correct)
    };
  }

  private canNavigate(direction: 'previous' | 'next'): boolean {
    if (this.navigationState.isAnimating) return false;
    if (direction === 'previous' && this.currentQuestionIndex === 0) return false;
    if (direction === 'next' && this.currentQuestionIndex === this.questions.length) return false;
    return true;
  }
  get correctAnswersCount() {
    return this.userAnswers.filter(a => a.isCorrect).length;
  }

  get currentQuestion(): Question {
    return this.questions[this.currentQuestionIndex];
  }

  get formattedTime() {
    const minutes = Math.floor(this.timer / 60);
    const seconds = this.timer % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  @HostListener('window:scroll', ['$event'])
  onWindowScroll() {
    this.isScrolled = window.pageYOffset > 60;
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }


}