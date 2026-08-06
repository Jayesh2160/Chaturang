import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { lessonService } from '../services/lessonService';
import type { LessonResponse } from '../services/lessonService';
import { 
  ArrowRight, 
  Clock, 
  CheckCircle,
  HelpCircle,
  Play,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';
import { gameService } from '../services/gameService';
import { calculateGamificationStats } from '../utils/gamification';

// Hardcoded categories in curriculum order
const CURRICULUM_CATEGORIES = [
  {
    key: 'Chess Basics',
    label: 'Chess Basics',
    description: 'Learn the board layout, coordinate notation, and fundamental movements of all pieces.',
  },
  {
    key: 'Openings',
    label: 'Opening Principles',
    description: 'Establish center control, protect your king, and develop pieces efficiently with classic openings.',
  },
  {
    key: 'Tactics',
    label: 'Tactics',
    description: 'Unleash pins, forks, skewers, and discovered attacks to win opponent material.',
  },
  {
    key: 'Strategy',
    label: 'Strategic Play',
    description: 'Build pawn chains, maximize piece activity, and develop positional planning.',
  },
  {
    key: 'Middlegame',
    label: 'Middlegame Dynamics',
    description: 'Infiltrate open files, defend your king shield, and occupy knight outposts.',
  },
  {
    key: 'Endgame',
    label: 'Endgame Mastery',
    description: 'Control opposition, employ the rule of the square, and guide pawns to promotion.',
  }
];

export const Academy: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonResponse[]>([]);
  const [nextLesson, setNextLesson] = useState<LessonResponse | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [gamesCount, setGamesCount] = useState(0);
  const [streak, setStreak] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Load lessons
        const fetchedLessons = await lessonService.getLessons();
        setLessons(fetchedLessons);

        // Load progress
        const progress = await lessonService.getProgress();
        setCompletedCount(progress.completedCount);
        setStreak(progress.streak);

        // Set next lesson
        if (progress.remainingLessons.length > 0) {
          // The next remaining lesson is the first incomplete one
          setNextLesson(progress.remainingLessons[0]);
        } else {
          setNextLesson(null);
        }

        // Fetch games to calculate XP
        const games = await gameService.getGames();
        setGamesCount(games.length);
      } catch (err) {
        console.error('Error fetching lessons', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const getDifficultyColor = (diff: string) => {
    switch (diff.toUpperCase()) {
      case 'BEGINNER': return 'border border-white/5 text-zinc-400';
      case 'INTERMEDIATE': return 'border border-white/10 text-zinc-200';
      case 'ADVANCED': return 'border border-brand-accent/25 text-brand-accent';
      default: return 'border border-white/5 text-zinc-500';
    }
  };

  // Group lessons by category based on curriculum categories
  const lessonsByCategory = CURRICULUM_CATEGORIES.reduce((acc, cat) => {
    // Filter matching lessons
    const filtered = lessons.filter(
      l => l.category.toLowerCase().replace(/_/g, ' ') === cat.key.toLowerCase().replace(/_/g, ' ')
    );
    acc[cat.key] = filtered;
    return acc;
  }, {} as Record<string, LessonResponse[]>);

  // Find overall recommended lesson to study
  const activeStudyLesson = nextLesson;
  const stats = calculateGamificationStats(completedCount, gamesCount, streak);

  return (
    <Layout>
      <div className="space-y-16 animate-fade-in text-left">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold font-display tracking-tight text-white">
              Chess Academy
            </h1>
            <p className="text-zinc-400 text-sm font-light">
              Master the board step-by-step. Solve exercises and challenge positions to progress through the curriculum.
            </p>
          </div>
          
          {/* Mini Stats Bar */}
          <div className="flex items-center gap-4 self-start md:self-auto bg-zinc-950/40 border border-white/5 px-4 py-2.5 rounded-2xl">
            <div className="flex items-center gap-1.5 border-r border-white/5 pr-4">
              <Flame className="w-4 h-4 text-brand-accent" />
              <span className="text-xs font-bold text-white">{streak} Day Streak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Level {stats.level}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/progress')}
              className="text-[10px] font-bold text-brand-accent uppercase hover:bg-white/5 px-2.5 py-1 h-7 rounded-lg"
            >
              Progress Details
            </Button>
          </div>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-white/5" />

        {/* Active Study / Continue Learning Spotlight */}
        {activeStudyLesson && (
          <div 
            className="p-8 rounded-2xl bg-zinc-950 border border-brand-accent/20 relative overflow-hidden transition-all duration-300 cursor-pointer hover:border-brand-accent/45 group shadow-xl"
            onClick={() => navigate(`/academy/${activeStudyLesson.slug}`)}
          >
            {/* Extremely subtle spotlight light source */}
            <div className="absolute right-0 top-0 h-44 w-44 bg-brand-accent/10 rounded-full filter blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-brand-accent/15 text-brand-accent border border-brand-accent/20">
                  <Play className="w-2.5 h-2.5 fill-brand-accent" />
                  Recommended Next Lesson
                </span>
                <h2 className="text-2xl font-bold font-display text-white">{activeStudyLesson.title}</h2>
                <p className="text-zinc-400 text-xs font-light max-w-2xl leading-relaxed">{activeStudyLesson.shortDescription}</p>
                
                <div className="flex items-center gap-4 text-[10px] text-zinc-550 font-bold uppercase tracking-wider pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {activeStudyLesson.estimatedMinutes} min
                  </span>
                  <span>•</span>
                  <span>{activeStudyLesson.category}</span>
                  <span>•</span>
                  <span>{activeStudyLesson.difficulty}</span>
                </div>
              </div>
              <Button variant="primary" className="shrink-0 bg-white text-zinc-950 hover:bg-zinc-200">
                Start Lesson
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}

        {/* Structured Roadmap Timeline */}
        <div className="space-y-16">
          <div className="flex flex-col items-center justify-between gap-4 border-b border-white/5 pb-4">
            <h2 className="text-xs uppercase font-black tracking-widest text-zinc-500 self-start">
              Roadmap Curriculum
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-8 animate-pulse max-w-xl mx-auto">
              {[1, 2, 3].map(n => (
                <div key={n} className="flex gap-4 items-center">
                  <div className="h-10 w-10 rounded-full bg-zinc-900" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 bg-zinc-900 rounded" />
                    <div className="h-3 w-2/3 bg-zinc-900 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-xl mx-auto space-y-16 relative">
              
              {CURRICULUM_CATEGORIES.map((cat, catIdx) => {
                const categoryLessons = lessonsByCategory[cat.key] || [];
                if (categoryLessons.length === 0) return null;

                return (
                  <div key={cat.key} className="space-y-8">
                    {/* Milestone Category Header */}
                    <div className="relative pl-6 border-l-2 border-brand-accent/20">
                      <div className="absolute -left-[9px] top-1 h-4 w-4 rounded-full bg-brand-accent border-4 border-zinc-950 shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-brand-accent block mb-1">
                        Milestone {catIdx + 1}
                      </span>
                      <h3 className="text-xl font-bold font-display text-white">{cat.label}</h3>
                      <p className="text-zinc-500 text-xs font-light mt-1 max-w-md leading-relaxed">{cat.description}</p>
                    </div>

                    {/* Lesson nodes in category */}
                    <div className="pl-6 space-y-6 relative border-l border-white/5">
                      
                      {categoryLessons.map((lesson) => {
                        const isCompleted = lesson.completed;
                        const isActive = activeStudyLesson?.id === lesson.id;
                        
                        return (
                          <div 
                            key={lesson.id}
                            onClick={() => navigate(`/academy/${lesson.slug}`)}
                            className={`flex items-start gap-4 p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${
                              isActive 
                                ? 'bg-brand-accent/5 border-brand-accent/50 hover:border-brand-accent shadow-[0_0_15px_rgba(139,92,246,0.15)]'
                                : isCompleted
                                  ? 'bg-zinc-950/40 border-emerald-500/10 hover:border-emerald-500/20'
                                  : 'bg-zinc-950/20 border-white/5 hover:border-white/10 opacity-70 hover:opacity-100'
                            }`}
                          >
                            {/* Circle Node Status Icon */}
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center border shrink-0 mt-0.5 transition-all ${
                              isActive 
                                ? 'bg-brand-accent border-brand-accent text-white shadow-[0_0_12px_rgba(139,92,246,0.4)]'
                                : isCompleted
                                  ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-400'
                                  : 'bg-zinc-950 border-white/5 text-zinc-600'
                            }`}>
                              {isCompleted ? (
                                <CheckCircle className="w-4 h-4" strokeWidth={2.5} />
                              ) : isActive ? (
                                <Play className="w-3.5 h-3.5 fill-white text-white" />
                              ) : (
                                <HelpCircle className="w-4 h-4" strokeWidth={1.5} />
                              )}
                            </div>

                            {/* Node Metadata & Texts */}
                            <div className="flex-1 space-y-1 text-left">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className={`text-sm font-semibold font-display transition-colors ${
                                  isActive ? 'text-white' : 'text-zinc-300'
                                }`}>
                                  {lesson.title}
                                </h4>
                                {isActive && (
                                  <span className="text-[8px] font-black uppercase tracking-widest text-brand-accent bg-brand-accent/15 px-2 py-0.5 rounded-full border border-brand-accent/20 animate-pulse">
                                    Study Next
                                  </span>
                                )}
                              </div>
                              <p className="text-zinc-500 text-xs font-light line-clamp-2 leading-relaxed">
                                {lesson.shortDescription}
                              </p>
                              
                              <div className="flex items-center gap-3 text-[9px] text-zinc-550 font-bold uppercase tracking-wider pt-2">
                                <span className={`px-2 py-0.5 rounded ${getDifficultyColor(lesson.difficulty)}`}>
                                  {lesson.difficulty}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {lesson.estimatedMinutes} min
                                </span>
                              </div>
                            </div>
                            
                            <ChevronRight className={`w-4 h-4 self-center transition-transform ${
                              isActive ? 'text-brand-accent translate-x-0.5' : 'text-zinc-650'
                            }`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
