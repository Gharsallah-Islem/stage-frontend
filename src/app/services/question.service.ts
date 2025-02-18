import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Question {
  id: number;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: { text: string, correct: boolean }[];
  explanation?: string;
  aiGenerated?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private genAI = new GoogleGenerativeAI('AIzaSyDsQlOpephNf4bKPaqCy5SWGI-XvCYGtmY');
  private model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

  constructor(private http: HttpClient) { }

  async generateAIQuestion(topic: string, difficulty: string, aiQuestionType: string): Promise<Question> {
    const prompt = `Generate a multiple choice question about ${topic} for aviation exams at ${difficulty} difficulty level. 
      Format as JSON: {
        "text": "question text",
        "options": ["option1", "option2", "option3", "option4"],
        "correct": "index (0-3)",
        "explanation": "detailed explanation"
      }`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonString = response.text().replace(/```json|```/g, '');
      return this.parseAIQuestion(JSON.parse(jsonString), topic, difficulty);
    } catch (error) {
      console.error('AI Question Generation Error:', error);
      throw error;
    }
  }

  private parseAIQuestion(aiData: any, topic: string, difficulty: string): Question {
    return {
      id: Date.now(),
      text: aiData.text,
      category: topic,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      options: aiData.options.map((opt: string, i: number) => ({
        text: opt,
        correct: i === aiData.correct
      })),
      explanation: aiData.explanation,
      aiGenerated: true
    };
  }

  getExamQuestions() {
    return this.http.get<Question[]>('/api/questions/exam');
  }

  getAllQuestions() {
    return this.http.get<Question[]>('/api/questions');
  }

  deleteQuestion(id: number) {
    return this.http.delete(`/api/questions/${id}`);
  }
}