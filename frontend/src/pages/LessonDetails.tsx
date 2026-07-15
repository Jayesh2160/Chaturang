import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { lessonService } from '../services/lessonService';
import type { LessonResponse } from '../services/lessonService';
import { ArrowLeft, Clock, Award, CheckCircle, RotateCcw, Play, ChevronRight } from 'lucide-react';

// Helper to pad incomplete FENs to 6 space-delimited fields for chess.js strict validation
const cleanFenForChessJs = (fen: string): string => {
  if (!fen) return '';
  const trimmed = fen.trim();
  if (trimmed === 'start') return '';
  
  const fields = trimmed.split(/\s+/);
  if (fields.length < 6) {
    const defaults = ['w', '-', '-', '0', '1'];
    const missingCount = 6 - fields.length;
    const padding = defaults.slice(defaults.length - missingCount).join(' ');
    return `${trimmed} ${padding}`;
  }
  return trimmed;
};

// ==========================================
// 1. LESSON HEADER COMPONENT
// ==========================================
interface LessonHeaderProps {
  lesson: LessonResponse;
  onBack: () => void;
}

const LessonHeader: React.FC<LessonHeaderProps> = ({ lesson, onBack }) => {
  const getDifficultyColor = (diff: string) => {
    switch (diff.toUpperCase()) {
      case 'BEGINNER': return 'border border-white/5 text-zinc-400';
      case 'INTERMEDIATE': return 'border border-white/10 text-zinc-200';
      case 'ADVANCED': return 'border border-brand-accent/25 text-brand-accent';
      default: return 'border border-white/5 text-zinc-500';
    }
  };

  return (
    <div className="space-y-6 text-left">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onBack}
        className="flex items-center gap-1.5 px-0 hover:bg-transparent text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
        Back to Academy
      </Button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div className="space-y-2">
          <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest block">
            {lesson.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold font-display text-white tracking-tight leading-tight">
            {lesson.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto text-[10px] font-bold uppercase tracking-wider">
          <span className={`px-2.5 py-0.5 rounded-full ${getDifficultyColor(lesson.difficulty)}`}>
            {lesson.difficulty}
          </span>
          <span className="flex items-center gap-1 border border-white/5 text-zinc-450 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
            {lesson.estimatedMinutes} min
          </span>
          {lesson.completed && (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/15 px-2.5 py-0.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
              Completed
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. CHESSBOARD RENDERER (static/reference boards)
// ==========================================
interface ChessBoardRendererProps {
  fen: string;
}

const ChessBoardRenderer: React.FC<ChessBoardRendererProps> = ({ fen }) => {
  return (
    <div className="my-8 flex justify-center">
      <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-zinc-950 p-2">
        <Chessboard 
          options={{ 
            position: fen,
            darkSquareStyle: { backgroundColor: '#2e2e33' },
            lightSquareStyle: { backgroundColor: '#e4e4e7' }
          }} 
        />
      </div>
    </div>
  );
};

// ==========================================
// 3. LESSON CONTENT COMPONENT
// ==========================================
interface LessonContentProps {
  content: string;
}

const LessonContent: React.FC<LessonContentProps> = ({ content }) => {
  // Simple bold text parser (**text**)
  const parseBold = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderTextSegment = (textBlock: string) => {
    const lines = textBlock.split('\n');
    return (
      <div className="space-y-5 text-zinc-300 text-sm sm:text-base leading-relaxed text-left font-light">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Ignore custom takeaways section headers or main title header as they are parsed separately
          if (trimmed.startsWith('# ') || trimmed.startsWith('### Key Takeaways')) return null;

          // Header 2
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={i} className="text-xl font-bold text-white font-display pt-6 pb-2 border-b border-white/5">
                {parseBold(trimmed.substring(3))}
              </h3>
            );
          }

          // Header 3
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={i} className="text-base font-bold text-zinc-100 font-display pt-4">
                {parseBold(trimmed.substring(4))}
              </h4>
            );
          }

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <ul key={i} className="list-disc pl-6 space-y-1.5 text-zinc-350 my-2">
                <li>{parseBold(trimmed.substring(2))}</li>
              </ul>
            );
          }

          // Regular paragraph
          return (
            <p key={i} className="font-light">
              {parseBold(line)}
            </p>
          );
        })}
      </div>
    );
  };

  // Splitting by BOARD markers to mix text blocks and chessboard renderers
  const parts = content.split(/(\[BOARD:[^\]]+\])/g);

  return (
    <div className="space-y-6">
      {parts.map((part, index) => {
        if (part.startsWith('[BOARD:') && part.endsWith(']')) {
          const fen = part.slice(7, -1);
          return <ChessBoardRenderer key={index} fen={fen} />;
        } else {
          return <React.Fragment key={index}>{renderTextSegment(part)}</React.Fragment>;
        }
      })}
    </div>
  );
};

// ==========================================
// 4. KEY TAKEAWAYS COMPONENT
// ==========================================
interface KeyTakeawaysProps {
  content: string;
}

const KeyTakeaways: React.FC<KeyTakeawaysProps> = ({ content }) => {
  // Extract the takeaways section from the markdown content
  const getTakeaways = () => {
    const lines = content.split('\n');
    const index = lines.findIndex(l => l.trim().toLowerCase().includes('takeaways'));
    if (index === -1) return null;

    const takeawaysLines = lines.slice(index + 1);
    return takeawaysLines
      .map(line => line.trim())
      .filter(line => line.startsWith('- ') || line.startsWith('* '))
      .map(line => line.substring(2));
  };

  const takeaways = getTakeaways();

  if (!takeaways || takeaways.length === 0) return null;

  return (
    <Card className="p-6 border-white/5 bg-zinc-950/40 text-left mt-10 rounded-2xl relative overflow-hidden">
      {/* Subtle border left accent in purple */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-accent/40" />
      <h3 className="text-sm font-bold font-display text-white flex items-center gap-2 mb-4 pl-1">
        <Award className="w-4 h-4 text-brand-accent" strokeWidth={1.5} />
        Key Takeaways
      </h3>
      <ul className="space-y-3 pl-1">
        {takeaways.map((takeaway, idx) => (
          <li key={idx} className="text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5 leading-relaxed font-light">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-650 shrink-0 mt-2" />
            <span>{takeaway}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
};

// ==========================================
// 5. LESSON FOOTER / INTERACTIVE PRACTICE & NEXT PATH
// ==========================================
interface LessonFooterProps {
  isCompleted: boolean;
  onComplete: () => Promise<void>;
  nextLesson: LessonResponse | null;
  practiceFen: string;
}

const LessonFooter: React.FC<LessonFooterProps> = ({
  isCompleted,
  onComplete,
  nextLesson,
  practiceFen
}) => {
  const navigate = useNavigate();
  const [game, setGame] = useState(() => new Chess(practiceFen === 'start' ? undefined : cleanFenForChessJs(practiceFen)));
  const [boardFen, setBoardFen] = useState(practiceFen === 'start' ? game.fen() : practiceFen);
  const [moveStatus, setMoveStatus] = useState<string>('Interact with the position below to analyze moves.');
  const [isMarking, setIsMarking] = useState(false);

  // Sync practice game if FEN changes
  useEffect(() => {
    const g = new Chess(practiceFen === 'start' ? undefined : cleanFenForChessJs(practiceFen));
    setGame(g);
    setBoardFen(g.fen());
    setMoveStatus('Interact with the position below to analyze moves.');
  }, [practiceFen]);

  const handleMove = (sourceSquare: string, targetSquare: string) => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Auto-promote to Queen for simplicity
      });

      if (move) {
        setBoardFen(game.fen());
        
        let status = `Move: ${move.san}`;
        if (game.isCheckmate()) {
          status += ' • Checkmate!';
        } else if (game.isCheck()) {
          status += ' • Check!';
        } else if (game.isDraw()) {
          status += ' • Draw';
        }
        setMoveStatus(status);
        return true;
      }
    } catch (e) {
      // Illegal move
    }
    return false;
  };

  const handleReset = () => {
    const g = new Chess(practiceFen === 'start' ? undefined : practiceFen);
    setGame(g);
    setBoardFen(g.fen());
    setMoveStatus('Board coordinates reset.');
  };

  const handleCompleteClick = async () => {
    try {
      setIsMarking(true);
      await onComplete();
    } catch (err) {
      console.error('Failed to complete lesson', err);
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <div className="mt-16 space-y-10 border-t border-white/5 pt-10">
      {/* Practice Board Section */}
      <div className="space-y-6 text-left">
        <div className="space-y-1">
          <h3 className="text-xl font-bold font-display text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-brand-accent" strokeWidth={1.5} />
            Practice Position
          </h3>
          <p className="text-xs text-zinc-500 font-light">
            Toggle and test various piece movements freely to audit this specific board layout.
          </p>
        </div>

        <Card className="flex flex-col items-center justify-center p-6 bg-zinc-950/20 border-white/5 max-w-md mx-auto rounded-2xl shadow-lg">
          <div className="w-full max-w-[280px] sm:max-w-[300px] aspect-square rounded-xl overflow-hidden border border-white/10 shadow-md mb-4 bg-zinc-950 p-1.5">
            <Chessboard 
              options={{
                position: boardFen,
                onPieceDrop: ({ sourceSquare, targetSquare }) => {
                  if (targetSquare) {
                    return handleMove(sourceSquare, targetSquare);
                  }
                  return false;
                },
                darkSquareStyle: { backgroundColor: '#2e2e33' },
                lightSquareStyle: { backgroundColor: '#e4e4e7' }
              }}
            />
          </div>

          <div className="flex items-center justify-between w-full border-t border-white/5 pt-4 mt-2">
            <span className="text-xs font-semibold text-zinc-400 max-w-[65%] text-left truncate">
              {moveStatus}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              className="flex items-center gap-1 text-[10px] py-1 px-2.5 h-8 font-bold uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              Reset
            </Button>
          </div>
        </Card>
      </div>

      {/* Action Buttons: Complete Lesson / Next Lesson */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5 pt-8">
        {!isCompleted ? (
          <Button 
            onClick={handleCompleteClick}
            isLoading={isMarking}
            className="w-full sm:w-auto bg-white text-zinc-950 font-bold hover:bg-zinc-200 flex items-center justify-center gap-1.5 px-6 py-2.5 shadow-md"
          >
            <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
            Mark Lesson as Completed
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
            <CheckCircle className="w-4 h-4" strokeWidth={1.5} />
            Study Complete
          </div>
        )}

        {nextLesson && (
          <Button
            onClick={() => navigate(`/academy/${nextLesson.slug}`)}
            variant="outline"
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 py-2.5 hover:bg-white/5 border-white/10"
          >
            <div className="text-right hidden sm:block">
              <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest block">Next Up</span>
              <span className="text-xs text-zinc-350 font-bold block">{nextLesson.title}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-brand-accent" strokeWidth={1.5} />
          </Button>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 6. MAIN LESSON DETAILS PAGE CONTAINER
// ==========================================
export const LessonDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [nextLesson, setNextLesson] = useState<LessonResponse | null>(null);
  const [practiceFen, setPracticeFen] = useState<string>('start');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLessonData = async () => {
      if (!slug) return;
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch lesson detail
        const fetchedLesson = await lessonService.getLesson(slug);
        setLesson(fetchedLesson);

        // Extract practice FEN
        const boardMatches = [...fetchedLesson.content.matchAll(/\[BOARD:([^\]]+)\]/g)];
        if (boardMatches.length > 0) {
          const lastFen = boardMatches[boardMatches.length - 1][1];
          setPracticeFen(lastFen);
        } else {
          setPracticeFen('start');
        }

        // Fetch all lessons to compute the next lesson in sequence
        const allLessons = await lessonService.getLessons();
        const currentIndex = allLessons.findIndex(l => l.slug === slug);
        if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
          setNextLesson(allLessons[currentIndex + 1]);
        } else {
          // If it's the last, look for first incomplete
          const progress = await lessonService.getProgress();
          if (progress.remainingLessons.length > 0 && progress.remainingLessons[0].slug !== slug) {
            setNextLesson(progress.remainingLessons[0]);
          } else {
            setNextLesson(null);
          }
        }
      } catch (err) {
        console.error('Failed to load lesson', err);
        setError('Lesson not found or failed to load. Please return to the Academy.');
      } finally {
        setIsLoading(false);
      }
    };

    loadLessonData();
  }, [slug]);

  const handleComplete = async () => {
    if (!slug || !lesson) return;
    await lessonService.completeLesson(slug);
    // Reload state
    setLesson({ ...lesson, completed: true });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-8 text-left animate-pulse py-6">
          <div className="h-4 w-32 bg-zinc-900 rounded" />
          <div className="h-10 w-2/3 bg-zinc-900 rounded" />
          <div className="h-[250px] w-full bg-zinc-950/40 rounded-2xl border border-white/5" />
          <div className="h-6 w-48 bg-zinc-900 rounded" />
        </div>
      </Layout>
    );
  }

  if (error || !lesson) {
    return (
      <Layout>
        <Card className="p-8 text-center bg-zinc-950 border-white/5 text-zinc-555 rounded-2xl">
          <p className="text-sm font-semibold">{error || 'Lesson failed to load.'}</p>
          <Button onClick={() => navigate('/academy')} size="sm" className="mt-4 bg-white text-zinc-950 hover:bg-zinc-200">
            Return to Academy
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-8 pb-16 animate-fade-in">
        <LessonHeader 
          lesson={lesson} 
          onBack={() => navigate('/academy')} 
        />
        
        {/* Core Content */}
        <LessonContent content={lesson.content} />
        
        {/* Key Takeaways */}
        <KeyTakeaways content={lesson.content} />
        
        {/* Footer, Interactive Board and Actions */}
        <LessonFooter
          isCompleted={lesson.completed}
          onComplete={handleComplete}
          nextLesson={nextLesson}
          practiceFen={practiceFen}
        />
      </div>
    </Layout>
  );
};
