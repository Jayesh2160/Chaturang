import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Button } from '../components/ui/Button';
import { lessonService } from '../services/lessonService';
import type { ProgressResponse, LessonResponse } from '../services/lessonService';
import { Clock, BookOpen, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';

export const AcademyProgress: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [activeTab, setActiveTab] = useState<'completed' | 'remaining'>('remaining');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setIsLoading(true);
        const data = await lessonService.getProgress();
        setProgress(data);
        // If they have completed some but not all, show remaining first, otherwise show completed
        if (data.remainingLessons.length === 0 && data.completedLessons.length > 0) {
          setActiveTab('completed');
        }
      } catch (err) {
        console.error('Failed to load progress summary', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProgress();
  }, []);

  const getDifficultyColor = (diff: string) => {
    switch (diff.toUpperCase()) {
      case 'BEGINNER': return 'border border-white/5 text-zinc-400';
      case 'INTERMEDIATE': return 'border border-white/10 text-zinc-200';
      case 'ADVANCED': return 'border border-brand-accent/25 text-brand-accent';
      default: return 'border border-white/5 text-zinc-550';
    }
  };

  const renderLessonList = (list: LessonResponse[], type: 'completed' | 'remaining') => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-white/5 rounded-2xl text-zinc-500">
          <BookOpen className="w-6 h-6 text-zinc-650 mb-2" strokeWidth={1.5} />
          <p className="text-xs font-semibold">
            {type === 'completed' ? 'No completed lessons yet.' : 'All caught up!'}
          </p>
          <p className="text-[10px] text-zinc-600 mt-1 max-w-xs">
            {type === 'completed' 
              ? 'Start studying on the Academy page to see your completed chapters here.' 
              : 'You have completed all seeded lessons in the Chess Academy!'}
          </p>
          {type === 'completed' && (
            <Button onClick={() => navigate('/academy')} size="sm" className="mt-4 bg-white text-zinc-950 hover:bg-zinc-200">
              Browse Lessons
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {list.map((lesson) => (
          <div
            key={lesson.id}
            onClick={() => navigate(`/academy/${lesson.slug}`)}
            className="flex flex-col justify-between p-6 border border-white/5 bg-zinc-950/20 hover:border-white/10 hover:bg-zinc-900/10 cursor-pointer transition-all duration-300 group text-left rounded-2xl"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  {lesson.category}
                </span>
                {type === 'completed' && (
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

            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-widest ${getDifficultyColor(lesson.difficulty)}`}>
                  {lesson.difficulty}
                </span>
                <span className="flex items-center gap-1 font-semibold text-zinc-450 normal-case">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {lesson.estimatedMinutes} min
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-650 group-hover:text-white group-hover:translate-x-0.5 transition-all" strokeWidth={1.5} />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-12 animate-fade-in text-left">
        {/* Back navigation & Header */}
        <div className="space-y-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/academy')}
            className="flex items-center gap-1.5 px-0 hover:bg-transparent text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back to Academy
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold font-display tracking-tight text-white">
              Academy Progress
            </h1>
            <p className="text-zinc-400 text-sm font-light">
              Track study coordinate hours, audit milestones, and review completed subjects.
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-white/5" />

        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-24 rounded-2xl bg-zinc-900/10 border border-white/5" />
              ))}
            </div>
            <div className="h-[100px] rounded-2xl bg-zinc-900/10 border border-white/5" />
          </div>
        ) : !progress ? (
          <div className="py-12 text-center text-zinc-500 border border-white/5 rounded-2xl text-xs font-light bg-zinc-950/20">
            Failed to load progress data. Please refresh.
          </div>
        ) : (
          <>
            {/* Stats Dashboard Grid (Apple style, minimal open metrics) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              {/* Daily Streak */}
              <div className="flex flex-col justify-between py-4 border-b border-white/5 sm:border-b-0 sm:border-r border-white/5 pr-6">
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Daily Streak</span>
                  <span className="text-3xl font-extrabold font-display text-white">
                    {progress.streak} {progress.streak === 1 ? 'Day' : 'Days'}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 font-light mt-4 pt-2 border-t border-white/5">
                  Complete lessons to maintain active streaks.
                </div>
              </div>

              {/* Completed Count */}
              <div className="flex flex-col justify-between py-4 border-b border-white/5 md:border-b-0 md:border-r border-white/5 pr-6 sm:pl-6">
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Lessons Completed</span>
                  <span className="text-3xl font-extrabold font-display text-white">
                    {progress.completedCount} <span className="text-zinc-550 text-xl">/ {progress.totalCount}</span>
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 font-light mt-4 pt-2 border-t border-white/5">
                  Progress Percentage: {progress.progressPercentage.toFixed(0)}%
                </div>
              </div>

              {/* Hours Studied */}
              <div className="flex flex-col justify-between py-4 border-b border-white/5 sm:border-b-0 sm:border-r border-white/5 pr-6 md:pl-6">
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Hours Studied</span>
                  <span className="text-3xl font-extrabold font-display text-white">
                    {progress.hoursStudied.toFixed(1)} <span className="text-zinc-550 text-xl">hrs</span>
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 font-light mt-4 pt-2 border-t border-white/5">
                  Accumulated training duration.
                </div>
              </div>

              {/* Favorite Category */}
              <div className="flex flex-col justify-between py-4 sm:pl-6">
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block">Favorite Focus</span>
                  <span className="text-xl font-bold font-display text-white block truncate">
                    {progress.favoriteCategory}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-500 font-light mt-4 pt-2 border-t border-white/5">
                  Highest tactical engagement.
                </div>
              </div>
            </div>

            {/* Percentage Bar Visualization (Ultra thin line) */}
            <div className="p-6 bg-zinc-950/20 border border-white/5 rounded-2xl">
              <div className="flex items-center justify-between mb-2 text-xs font-bold uppercase tracking-wider">
                <span className="text-zinc-400">Academy Completion Path</span>
                <span className="text-brand-accent">{progress.progressPercentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-zinc-900 border border-white/5 h-1 rounded-full overflow-hidden">
                <div 
                  className="bg-brand-accent h-full rounded-full transition-all duration-700 ease-out" 
                  style={{ width: `${progress.progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Tabs & Lesson lists */}
            <div className="space-y-6">
              {/* Tab Selector */}
              <div className="flex border-b border-white/5">
                <button
                  onClick={() => setActiveTab('remaining')}
                  className={`px-4 py-2.5 -mb-px text-xs font-bold uppercase tracking-widest border-b-2 transition-all duration-300 ${
                    activeTab === 'remaining'
                      ? 'border-brand-accent text-white font-bold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Remaining ({progress.remainingLessons.length})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-4 py-2.5 -mb-px text-xs font-bold uppercase tracking-widest border-b-2 transition-all duration-300 ${
                    activeTab === 'completed'
                      ? 'border-brand-accent text-white font-bold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Completed ({progress.completedLessons.length})
                </button>
              </div>

              {/* List Display */}
              <div>
                {activeTab === 'remaining' 
                  ? renderLessonList(progress.remainingLessons, 'remaining')
                  : renderLessonList(progress.completedLessons, 'completed')
                }
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};
