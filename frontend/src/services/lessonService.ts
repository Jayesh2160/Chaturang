import api from './api';
import { validateLessonFens } from '../utils/fenValidation';

export interface LessonResponse {
  id: number;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  shortDescription: string;
  content: string;
  completed: boolean;
  createdAt: string;
}

export interface ProgressResponse {
  completedCount: number;
  totalCount: number;
  progressPercentage: number;
  streak: number;
  hoursStudied: number;
  favoriteCategory: string;
  completedLessons: LessonResponse[];
  remainingLessons: LessonResponse[];
}

export const lessonService = {
  getLessons: async (search?: string): Promise<LessonResponse[]> => {
    const response = await api.get<LessonResponse[]>('/api/lessons', {
      params: search ? { search } : undefined,
    });
    const lessons = response.data;
    if (lessons) {
      lessons.forEach(lesson => {
        validateLessonFens(lesson.content, lesson.title);
      });
    }
    return lessons;
  },

  getLesson: async (slug: string): Promise<LessonResponse> => {
    const response = await api.get<LessonResponse>(`/api/lessons/${slug}`);
    const lesson = response.data;
    if (lesson) {
      validateLessonFens(lesson.content, lesson.title);
    }
    return lesson;
  },

  getProgress: async (): Promise<ProgressResponse> => {
    const response = await api.get<ProgressResponse>('/api/progress');
    const progress = response.data;
    if (progress) {
      if (progress.completedLessons) {
        progress.completedLessons.forEach(lesson => {
          validateLessonFens(lesson.content, lesson.title);
        });
      }
      if (progress.remainingLessons) {
        progress.remainingLessons.forEach(lesson => {
          validateLessonFens(lesson.content, lesson.title);
        });
      }
    }
    return progress;
  },

  completeLesson: async (slug: string): Promise<void> => {
    await api.post(`/api/progress/${slug}/complete`);
  },
};
