import api from './api';

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
    return response.data;
  },

  getLesson: async (slug: string): Promise<LessonResponse> => {
    const response = await api.get<LessonResponse>(`/api/lessons/${slug}`);
    return response.data;
  },

  getProgress: async (): Promise<ProgressResponse> => {
    const response = await api.get<ProgressResponse>('/api/progress');
    return response.data;
  },

  completeLesson: async (slug: string): Promise<void> => {
    await api.post(`/api/progress/${slug}/complete`);
  },
};
