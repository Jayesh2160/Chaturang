import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { lessonService } from '../services/lessonService';
import type { LessonResponse } from '../services/lessonService';
import { BookOpen, Search, Trophy, ArrowRight, Clock, CheckCircle } from 'lucide-react';

const CATEGORIES = [
  {
    key: 'Chess Basics',
    label: 'Chess Basics',
    description: 'Learn board setup, coordinates, and basic piece movements.',
  },
  {
    key: 'Openings',
    label: 'Openings',
    description: 'Study classic openings like the Italian Game, Sicilian, and Ruy Lopez.',
  },
  {
    key: 'Tactics',
    label: 'Tactics',
    description: 'Master tactical tools: forks, pins, skewers, and discoveries.',
  },
  {
    key: 'Middlegame',
    label: 'Middlegame',
    description: 'Formulate plans, protect your king, and control key open files.',
  },
  {
    key: 'Endgame',
    label: 'Endgame',
    description: 'Harness the opposition, rule of the square, and promotion rules.',
  },
  {
    key: 'Strategy',
    label: 'Strategy',
    description: 'Coordinate piece development, activity, and control the center.',
  }
];

export const Academy: React.FC = () => {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<LessonResponse[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [nextLesson, setNextLesson] = useState<LessonResponse | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Load lessons
        const fetchedLessons = await lessonService.getLessons(searchQuery);
        setLessons(fetchedLessons);

        // Load progress for "Continue Learning"
        const progress = await lessonService.getProgress();
        if (progress.remainingLessons.length > 0) {
          // Set first remaining lesson as next up
          setNextLesson(progress.remainingLessons[0]);
        } else if (progress.completedLessons.length > 0) {
          // Completed everything!
          setNextLesson(null);
        }
      } catch (err) {
        console.error('Error fetching lessons', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [searchQuery]);

  const filteredLessons = activeCategory
    ? lessons.filter(l => l.category === activeCategory)
    : lessons;

  const getDifficultyColor = (diff: string) => {
    switch (diff.toUpperCase()) {
      case 'BEGINNER': return 'border border-white/5 text-zinc-400';
      case 'INTERMEDIATE': return 'border border-white/10 text-zinc-200';
      case 'ADVANCED': return 'border border-brand-accent/25 text-brand-accent';
      default: return 'border border-white/5 text-zinc-500';
    }
  };

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
              Hone your strategic coordinates through structured lesson books and practice positions.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/progress')}
            className="self-start md:self-auto flex items-center gap-1.5"
          >
            <Trophy className="w-3.5 h-3.5" strokeWidth={1.5} />
            View Academy Progress
          </Button>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-white/5" />

        {/* Continue Learning - Apple Books Spotlighting card */}
        {nextLesson && (
          <div 
            className="p-8 rounded-2xl bg-zinc-950 border border-brand-accent/15 relative overflow-hidden transition-all duration-300 cursor-pointer hover:border-brand-accent/30 group shadow-lg"
            onClick={() => navigate(`/academy/${nextLesson.slug}`)}
          >
            {/* Extremely subtle spotlight light source */}
            <div className="absolute right-0 top-0 h-44 w-44 bg-brand-accent/5 rounded-full filter blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/15">
                  Continue Studying
                </span>
                <h2 className="text-2xl font-bold font-display text-white">{nextLesson.title}</h2>
                <p className="text-zinc-400 text-xs font-light max-w-2xl leading-relaxed">{nextLesson.shortDescription}</p>
                
                <div className="flex items-center gap-4 text-[10px] text-zinc-550 font-bold uppercase tracking-wider pt-2">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                    {nextLesson.estimatedMinutes} min
                  </span>
                  <span>•</span>
                  <span>{nextLesson.category}</span>
                  <span>•</span>
                  <span>{nextLesson.difficulty}</span>
                </div>
              </div>
              <Button variant="primary" className="shrink-0 bg-white text-zinc-950 hover:bg-zinc-200">
                Resume Lesson
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        )}

        {/* Categories (Notion style, large cards, lots of spacing, minimal borders) */}
        <div className="space-y-6">
          <h2 className="text-xs uppercase font-bold tracking-widest text-zinc-500">
            Academy Modules
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <div
                  key={cat.key}
                  onClick={() => setActiveCategory(isActive ? null : cat.key)}
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 border ${
                    isActive 
                      ? 'border-brand-accent bg-zinc-900/30' 
                      : 'border-white/5 hover:border-white/10 bg-zinc-950/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-display font-semibold text-sm ${isActive ? 'text-white' : 'text-zinc-350'}`}>{cat.label}</h3>
                    {isActive && <div className="h-1.5 w-1.5 rounded-full bg-brand-accent" />}
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed font-light">{cat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Lessons */}
        <div className="space-y-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/5 pb-4">
            <h2 className="text-base font-bold font-display text-white tracking-wide">
              {activeCategory ? `${activeCategory} Files` : 'All Study Material'}
            </h2>

            {/* Search Input - Clean Notion style */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Search study chapters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-lg bg-zinc-950/50 border border-white/5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-brand-accent/40 focus:ring-4 focus:ring-brand-accent/10 transition-all duration-300"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-32 rounded-2xl border border-white/5 bg-zinc-900/10 animate-pulse" />
              ))}
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/5 rounded-2xl text-zinc-500">
              <BookOpen className="w-6 h-6 text-zinc-650 mb-2" strokeWidth={1.5} />
              <p className="text-sm font-semibold">No lessons matches</p>
              <p className="text-xs text-zinc-600 mt-1">Try resetting the filter category or inputting another query.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  onClick={() => navigate(`/academy/${lesson.slug}`)}
                  className={`flex flex-col justify-between p-6 border rounded-2xl bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 cursor-pointer transition-all duration-300 group text-left ${
                    lesson.completed ? 'border-emerald-500/10 bg-emerald-950/[0.01]' : 'border-white/5'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                        {lesson.category}
                      </span>
                      {lesson.completed && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" strokeWidth={1.5} />
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="font-display font-semibold text-base text-zinc-200 group-hover:text-white transition-colors leading-snug">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed font-light line-clamp-2">
                      {lesson.shortDescription}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-6 pt-4 border-t border-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest ${getDifficultyColor(lesson.difficulty)}`}>
                      {lesson.difficulty}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-zinc-450 normal-case">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                      {lesson.estimatedMinutes} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
