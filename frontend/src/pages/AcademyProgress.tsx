import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { lessonService } from '../services/lessonService';
import type { ProgressResponse, LessonResponse } from '../services/lessonService';
import { Trophy, Flame, Clock, Heart, BookOpen, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react';

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
      case 'BEGINNER': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'INTERMEDIATE': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'ADVANCED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    }
  };

  const renderLessonList = (list: LessonResponse[], type: 'completed' | 'remaining') => {
    if (list.length === 0) {
      return (
        <Card className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/20 border-zinc-800 border-dashed text-zinc-500">
          <BookOpen className="w-8 h-8 text-zinc-600 mb-2" />
          <p className="text-sm font-semibold">
            {type === 'completed' ? 'No completed lessons yet.' : 'All caught up!'}
          </p>
          <p className="text-xs text-zinc-500 mt-1">
            {type === 'completed' 
              ? 'Start studying on the Academy page to see your completed lessons here.' 
              : 'You have completed all seeded lessons in the Chess Academy!'}
          </p>
          {type === 'completed' && (
            <Button onClick={() => navigate('/academy')} size="sm" className="mt-4 bg-violet-600">
              Browse Lessons
            </Button>
          )}
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((lesson) => (
          <Card
            key={lesson.id}
            onClick={() => navigate(`/academy/${lesson.slug}`)}
            className="flex flex-col justify-between p-5 border-zinc-800/60 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-700/80 cursor-pointer transition-all duration-200 group text-left"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                  {lesson.category}
                </span>
                {type === 'completed' && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    <CheckCircle className="w-3 h-3" />
                    Completed
                  </span>
                )}
              </div>
              <h3 className="font-display font-bold text-base text-zinc-200 group-hover:text-violet-400 transition-colors">
                {lesson.title}
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                {lesson.shortDescription}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-800/40 text-[11px] font-semibold text-zinc-500">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase ${getDifficultyColor(lesson.difficulty)}`}>
                  {lesson.difficulty}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  {lesson.estimatedMinutes} min
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Back navigation & Header */}
        <div className="space-y-4 text-left">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/academy')}
            className="flex items-center gap-1.5 px-0 hover:bg-transparent text-zinc-400 hover:text-zinc-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Academy
          </Button>
          
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-zinc-100 flex items-center gap-2">
              Academy Progress 📊
            </h1>
            <p className="text-zinc-400 text-sm md:text-base">
              Track your stats, review completed courses, and unlock new milestones.
            </p>
          </div>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800" />

        {isLoading ? (
          <div className="space-y-8 animate-pulse">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="h-28 rounded-xl bg-zinc-900/40 border border-zinc-800" />
              ))}
            </div>
            <div className="h-[250px] rounded-xl bg-zinc-900/20 border border-zinc-800" />
          </div>
        ) : !progress ? (
          <Card className="p-8 text-center bg-zinc-900/20 border-zinc-800 text-zinc-500">
            Failed to load progress data. Please refresh page.
          </Card>
        ) : (
          <>
            {/* Stats Dashboard Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
              {/* Daily Streak */}
              <Card className="flex flex-col justify-between p-5 bg-zinc-900/40 border-zinc-800 hover:scale-[1.01] transition-transform duration-200 shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Daily Streak</span>
                    <span className="text-3xl font-extrabold font-display text-gradient-gold">
                      {progress.streak} {progress.streak === 1 ? 'Day' : 'Days'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-500">
                    <Flame className="w-5 h-5 fill-amber-500 animate-pulse" />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 font-medium mt-3 border-t border-zinc-800/40 pt-2">
                  Complete lessons or play games to keep active!
                </div>
              </Card>

              {/* Completed Count */}
              <Card className="flex flex-col justify-between p-5 bg-zinc-900/40 border-zinc-800 hover:scale-[1.01] transition-transform duration-200 shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Lessons Completed</span>
                    <span className="text-3xl font-extrabold font-display text-gradient">
                      {progress.completedCount} / {progress.totalCount}
                    </span>
                  </div>
                  <div className="p-2.5 bg-violet-500/10 rounded-lg text-violet-400">
                    <Trophy className="w-5 h-5 text-violet-400" />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 font-medium mt-3 border-t border-zinc-800/40 pt-2">
                  Progress Percentage: {progress.progressPercentage.toFixed(1)}%
                </div>
              </Card>

              {/* Hours Studied */}
              <Card className="flex flex-col justify-between p-5 bg-zinc-900/40 border-zinc-800 hover:scale-[1.01] transition-transform duration-200 shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Hours Studied</span>
                    <span className="text-3xl font-extrabold font-display text-gradient">
                      {progress.hoursStudied.toFixed(1)} hrs
                    </span>
                  </div>
                  <div className="p-2.5 bg-sky-500/10 rounded-lg text-sky-400">
                    <Clock className="w-5 h-5 text-sky-400" />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 font-medium mt-3 border-t border-zinc-800/40 pt-2">
                  Total study time estimated
                </div>
              </Card>

              {/* Favorite Category */}
              <Card className="flex flex-col justify-between p-5 bg-zinc-900/40 border-zinc-800 hover:scale-[1.01] transition-transform duration-200 shadow-md">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 max-w-[70%]">
                    <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider block">Favorite Focus</span>
                    <span className="text-xl font-bold font-display text-zinc-100 truncate block">
                      {progress.favoriteCategory}
                    </span>
                  </div>
                  <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-400">
                    <Heart className="w-5 h-5 text-rose-400 fill-rose-500/20" />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 font-medium mt-3 border-t border-zinc-800/40 pt-2">
                  Most lessons completed here
                </div>
              </Card>
            </div>

            {/* Percentage Bar Visualization */}
            <Card className="p-6 bg-zinc-900/30 border-zinc-800/80 text-left">
              <div className="flex items-center justify-between mb-3 text-sm font-semibold">
                <span className="text-zinc-200 font-display">Academy Completion Path</span>
                <span className="text-violet-400">{progress.progressPercentage.toFixed(0)}% Complete</span>
              </div>
              <div className="w-full bg-zinc-900 border border-zinc-800 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-violet-600 to-sky-400 h-full rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${progress.progressPercentage}%` }}
                />
              </div>
            </Card>

            {/* Tabs & Lesson lists */}
            <div className="space-y-6 text-left">
              {/* Tab Selector */}
              <div className="flex border-b border-zinc-800">
                <button
                  onClick={() => setActiveTab('remaining')}
                  className={`px-4 py-2.5 -mb-px text-sm font-semibold border-b-2 tracking-wide transition-all ${
                    activeTab === 'remaining'
                      ? 'border-violet-500 text-violet-400 font-bold'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Lessons Remaining ({progress.remainingLessons.length})
                </button>
                <button
                  onClick={() => setActiveTab('completed')}
                  className={`px-4 py-2.5 -mb-px text-sm font-semibold border-b-2 tracking-wide transition-all ${
                    activeTab === 'completed'
                      ? 'border-violet-500 text-violet-400 font-bold'
                      : 'border-transparent text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Lessons Completed ({progress.completedLessons.length})
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
