export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

export interface UserProfile {
  userId: string;
  skillLevel: SkillLevel;
  timePerDay: number;
  deadline?: string;
  createdAt: string;
  activePathId?: string;
}

export interface Recommendation {
  title: string;
  url: string;
  type: 'video' | 'article' | 'practice' | 'book';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  durationHours: number;
  isCompleted?: boolean;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  durationWeeks: number;
  tasks: Task[];
  recommendations: Recommendation[];
}

export interface LearningPath {
  id?: string;
  userId: string;
  goal: string;
  modules: Module[];
  createdAt: string;
}

export interface Progress {
  pathId: string;
  userId: string;
  completedTaskIds: string[];
  completedModuleIds: string[];
  quizHistory: { date: string; score: number; topic: string }[];
}

export interface DailyLog {
  date: string;
  focusScore: number;
  mood: string;
}
