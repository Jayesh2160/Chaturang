import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { lessonService } from '../services/lessonService';
import type { LessonResponse } from '../services/lessonService';
import { BookOpen, Search, Trophy, Compass, Star, CheckCircle, Clock } from 'lucide-react';

const CATEGORIES = [
  {
    key: 'Chess Basics',
    label: 'Chess Basics',
    description: 'Learn board setup, coordinates, and basic piece movements.',
    color: 'from-blue-600 to-cyan-500 hover:shadow-blue-500/10',
    textColor: 'text-blue-400',
    bgLight: 'bg-blue-500/10 border-blue-500/20'
  },
  {
    key: 'Openings',
    label: 'Openings',
    description: 'Study classic openings like the Italian Game, Sicilian, and Ruy Lopez.',
    color: 'from-violet-600 to-purple-500 hover:shadow-violet-500/10',
    textColor: 'text-violet-400',
    bgLight: 'bg-violet-500/10 border-violet-500/20'
  },
  {
    key: 'Tactics',
    label: 'Tactics',
    description: 'Master tactical tools: forks, pins, skewers, and discoveries.',
    color: 'from-amber-600 to-yellow-500 hover:shadow-amber-500/10',
    textColor: 'text-amber-400',
    bgLight: 'bg-amber-500/10 border-amber-500/20'
  },
  {
    key: 'Middlegame',
    label: 'Middlegame',
    description: 'Formulate plans, protect your king, and control key open files.',
    color: 'from-emerald-600 to-teal-500 hover:shadow-emerald-500/10',
    textColor: 'text-emerald-400',
    bgLight: 'bg-emerald-500/10 border-emerald-500/20'
  },
  {
    key: 'Endgame',
    label: 'Endgame',
    description: 'Harness the opposition, rule of the square, and promotion rules.',
    color: 'from-rose-600 to-pink-500 hover:shadow-rose-500/10',
    textColor: 'text-rose-400',
    bgLight: 'bg-rose-500/10 border-rose-500/20'
  },
  {
    key: 'Strategy',
    label: 'Strategy',
    description: 'Coordinate piece development, activity, and control the center.',
    color: 'from-sky-600 to-indigo-500 hover:shadow-sky-500/10',
    textColor: 'text-sky-400',
    bgLight: 'bg-sky-500/10 border-sky-500/20'
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
      case 'BEGINNER': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'INTERMEDIATE': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'ADVANCED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-left">
          <div className="space-y-1.5">
            <h1 className="text-3xl md:text-4xl font-extrabold font-display tracking-tight text-zinc-100 flex items-center gap-2">
              Chess Academy 🏰
            </h1>
            <p className="text-zinc-400 text-sm md:text-base">
              Hone your skills through interactive lessons and practice positions.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate('/progress')}
            className="self-start md:self-auto flex items-center gap-1.5"
          >
            <Trophy className="w-4 h-4 text-amber-500" />
            View Academy Progress
          </Button>
        </div>

        {/* Separator */}
        <div className="h-[1px] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800" />

        {/* Continue Learning */}
        {nextLesson && (
          <Card 
            className="p-6 bg-gradient-to-br from-violet-950/20 to-sky-950/20 border-violet-500/20 hover:border-violet-500/40 relative overflow-hidden transition-all duration-300"
            onClick={() => navigate(`/academy/${nextLesson.slug}`)}
          >
            <div className="absolute right-0 top-0 h-32 w-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  <Star className="w-3.5 h-3.5 fill-violet-400" />
                  Continue Learning
                </span>
                <h2 className="text-2xl font-bold font-display text-zinc-100">{nextLesson.title}</h2>
                <p className="text-sm text-zinc-400 max-w-2xl">{nextLesson.shortDescription}</p>
                <div className="flex items-center gap-4 text-xs text-zinc-500 mt-2 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {nextLesson.estimatedMinutes} min
                  </span>
                  <span>•</span>
                  <span>{nextLesson.category}</span>
                  <span>•</span>
                  <span className="capitalize">{nextLesson.difficulty.toLowerCase()}</span>
                </div>
              </div>
              <Button className="shrink-0 bg-violet-600 hover:bg-violet-500 shadow-md">
                Resume Lesson
              </Button>
            </div>
          </Card>
        )}

        {/* Categories */}
        <div className="space-y-4 text-left">
          <h2 className="text-lg font-bold font-display text-zinc-200 flex items-center gap-2">
            <Compass className="w-4 h-4 text-violet-400" />
            Explore Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.key;
              return (
                <div
                  key={cat.key}
                  onClick={() => setActiveCategory(isActive ? null : cat.key)}
                  className={`glass-panel p-5 rounded-xl cursor-pointer transition-all duration-300 border text-left ${
                    isActive 
                      ? 'border-violet-500 bg-violet-500/5 ring-1 ring-violet-500/30' 
                      : 'border-zinc-800/80 hover:border-zinc-700/80 bg-zinc-900/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-display font-bold text-base ${cat.textColor}`}>{cat.label}</h3>
                    {isActive && <div className="h-2 w-2 rounded-full bg-violet-500" />}
                  </div>
                  <p className="text-xs text-zinc-400 line-clamp-2">{cat.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Search & Lessons */}
        <div className="space-y-6 text-left">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h2 className="text-lg font-bold font-display text-zinc-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-sky-400" />
              {activeCategory ? `${activeCategory} Lessons` : 'All Lessons'}
            </h2>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search lessons (e.g. fork)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900/40 border border-zinc-800 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 transition-all"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(n => (
                <Card key={n} className="p-5 border-zinc-800/60 bg-zinc-900/10 animate-pulse h-32" />
              ))}
            </div>
          ) : filteredLessons.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center bg-zinc-900/20 border-zinc-800 border-dashed text-zinc-500">
              <BookOpen className="w-8 h-8 text-zinc-600 mb-2" />
              <p className="text-sm font-semibold">No lessons found</p>
              <p className="text-xs text-zinc-500 mt-1">Try resetting the category filter or searching for another term.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  onClick={() => navigate(`/academy/${lesson.slug}`)}
                  className={`flex flex-col justify-between p-5 border-zinc-800/60 bg-zinc-900/20 hover:bg-zinc-900/40 hover:border-zinc-700/80 cursor-pointer transition-all duration-200 group text-left ${
                    lesson.completed ? 'border-emerald-500/20 bg-emerald-950/2' : ''
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                        {lesson.category}
                      </span>
                      {lesson.completed && (
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

                  <div className="flex items-center gap-3 mt-4 pt-3 border-t border-zinc-800/40 text-[11px] font-semibold text-zinc-500">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase ${getDifficultyColor(lesson.difficulty)}`}>
                      {lesson.difficulty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {lesson.estimatedMinutes} min
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
