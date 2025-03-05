import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface Question {
  id: number;
  text: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: { text: string; correct: boolean }[];
  explanation?: string;
  aiGenerated?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class QuestionService {
  private genAI = new GoogleGenerativeAI('AIzaSyDsQlOpephNf4bKPaqCy5SWGI-XvCYGtmY'); 
  private model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro-002' });

  constructor(private http: HttpClient) { }

  /**
   * Generates an AI-based question based on topic, difficulty, and question type.
   * @param topic The subject of the question (e.g., "aerodynamics").
   * @param difficulty The difficulty level ("easy", "medium", "hard").
   * @param aiQuestionType The type of question ("multiple", "truefalse", "scenario").
   * @returns A Promise resolving to a Question object.
   */
  async generateAIQuestion(topic: string, difficulty: string, aiQuestionType: string): Promise<Question> {
    let prompt: string;

    // Set the prompt based on the aiQuestionType
    if (aiQuestionType === 'multiple') {
      prompt = `Generate a multiple choice question about ${topic} for aviation exams at ${difficulty} difficulty level. 
        Format as JSON: {
          "text": "question text",
          "options": ["option1", "option2", "option3", "option4"],
          "correct": "index (0-3)",
          "explanation": "detailed explanation"
        }`;
    } else if (aiQuestionType === 'truefalse') {
      prompt = `Generate a true/false question about ${topic} for aviation exams at ${difficulty} difficulty level. 
        Format as JSON: {
          "text": "statement",
          "correct": "true" or "false",
          "explanation": "detailed explanation"
        }`;
    } else if (aiQuestionType === 'scenario') {
      prompt = `Generate a scenario-based question about ${topic} for aviation exams at ${difficulty} difficulty level. 
        Include a scenario description followed by a question with multiple choices. 
        Format as JSON: {
          "scenario": "scenario description",
          "text": "question text",
          "options": ["option1", "option2", "option3", "option4"],
          "correct": "index (0-3)",
          "explanation": "detailed explanation"
        }`;
    } else {
      throw new Error('Invalid question type');
    }

    try {
      console.log('Generating AI question with prompt:', prompt);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const jsonString = response.text().replace(/```json|```/g, '');
      console.log('AI response:', jsonString);
      return this.parseAIQuestion(JSON.parse(jsonString), topic, difficulty, aiQuestionType);
    } catch (error) {
      console.error('AI Question Generation Error:', error);
      throw error;
    }
  }

  /**
   * Parses the AI-generated question data into the Question interface format.
   * @param aiData The parsed JSON response from the AI.
   * @param topic The question category.
   * @param difficulty The difficulty level.
   * @param aiQuestionType The type of question to parse.
   * @returns A Question object.
   */
  private parseAIQuestion(aiData: any, topic: string, difficulty: string, aiQuestionType: string): Question {
    let questionText = aiData.text;
    let options: { text: string; correct: boolean }[] = [];

    // Parse based on question type
    if (aiQuestionType === 'multiple' || aiQuestionType === 'scenario') {
      if (aiQuestionType === 'scenario') {
        // Combine scenario and question text for scenario-based questions
        questionText = `Scenario: ${aiData.scenario}. ${aiData.text}`;
      }
      options = aiData.options.map((opt: string, i: number) => ({
        text: opt,
        correct: i === parseInt(aiData.correct)
      }));
    } else if (aiQuestionType === 'truefalse') {
      // Convert true/false statement into a question with two options
      const isTrue = aiData.correct.toLowerCase() === 'true';
      options = [
        { text: "True", correct: isTrue },
        { text: "False", correct: !isTrue }
      ];
    }

    return {
      id: Date.now(),
      text: questionText,
      category: topic,
      difficulty: difficulty as 'easy' | 'medium' | 'hard',
      options,
      explanation: aiData.explanation,
      aiGenerated: true
    };
  }

  /**
   * Fetches exam-specific questions from the API.
   * @returns An Observable of an array of Question objects.
   */
  getExamQuestions() {
    console.log('Token before getExamQuestions:', localStorage.getItem('token'));
    return this.http.get<Question[]>('/api/questions/exam');
  }

  /**
   * Fetches all questions from the API.
   * @returns An Observable of an array of Question objects.
   */
  getAllQuestions() {
    console.log('Token before getAllQuestions:', localStorage.getItem('token'));
    return this.http.get<Question[]>('/api/questions');
  }

  /**
   * Deletes a question by its ID.
   * @param id The ID of the question to delete.
   * @returns An Observable of the HTTP delete response.
   */
  deleteQuestion(id: number) {
    console.log('Token before deleteQuestion:', localStorage.getItem('token'));
    return this.http.delete(`/api/questions/${id}`);
  }
}