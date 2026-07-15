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
      case 'BEGINNER': return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'INTERMEDIATE': return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
      case 'ADVANCED': return 'bg-red-500/10 text-red-400 border border-red-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-4 text-left">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onBack}
        className="flex items-center gap-1.5 px-0 hover:bg-transparent text-zinc-400 hover:text-zinc-200"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Academy
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider block">
            {lesson.category}
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold font-display text-zinc-100 tracking-tight">
            {lesson.title}
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto text-xs font-semibold">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase ${getDifficultyColor(lesson.difficulty)}`}>
            {lesson.difficulty}
          </span>
          <span className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-400 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3.5 h-3.5" />
            {lesson.estimatedMinutes} min
          </span>
          {lesson.completed && (
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
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
    <div className="my-6 flex justify-center">
      <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-xl overflow-hidden border border-zinc-800 shadow-xl shadow-black/40 bg-zinc-950 p-2">
        <Chessboard options={{ position: fen }} />
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
        return <strong key={idx} className="font-semibold text-zinc-100">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const renderTextSegment = (textBlock: string) => {
    const lines = textBlock.split('\n');
    return (
      <div className="space-y-4 text-zinc-300 text-sm sm:text-base leading-relaxed text-left">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) return null;

          // Ignore custom takeaways section headers or main title header as they are parsed separately
          if (trimmed.startsWith('# ') || trimmed.startsWith('### Key Takeaways')) return null;

          // Header 2
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={i} className="text-lg font-bold text-gradient font-display pt-4 pb-1">
                {parseBold(trimmed.substring(3))}
              </h3>
            );
          }

          // Header 3
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={i} className="text-base font-bold text-zinc-200 font-display pt-3">
                {parseBold(trimmed.substring(4))}
              </h4>
            );
          }

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <ul key={i} className="list-disc pl-5 space-y-1 text-zinc-300 my-1">
                <li>{parseBold(trimmed.substring(2))}</li>
              </ul>
            );
          }

          // Regular paragraph
          return (
            <p key={i}>
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
    <div className="space-y-4">
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
  // Extract the takeaways section from the markdown content (typically at the end starting with "### Key Takeaways" or similar)
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
    <Card className="p-5 border-violet-500/20 bg-violet-950/5 text-left mt-8">
      <h3 className="text-base font-bold font-display text-violet-400 flex items-center gap-2 mb-3">
        <Award className="w-4 h-4 shrink-0 text-violet-400" />
        Key Takeaways
      </h3>
      <ul className="space-y-2">
        {takeaways.map((takeaway, idx) => (
          <li key={idx} className="text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shrink-0 mt-2" />
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
  const [moveStatus, setMoveStatus] = useState<string>('Try playing through the position below.');
  const [isMarking, setIsMarking] = useState(false);

  // Sync practice game if FEN changes
  useEffect(() => {
    const g = new Chess(practiceFen === 'start' ? undefined : cleanFenForChessJs(practiceFen));
    setGame(g);
    setBoardFen(g.fen());
    setMoveStatus('Try playing through the position below.');
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
    setMoveStatus('Board reset.');
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
    <div className="mt-12 space-y-8 border-t border-zinc-800/60 pt-8">
      {/* Practice Board Section */}
      <div className="space-y-4 text-left">
        <h3 className="text-lg font-bold font-display text-zinc-200 flex items-center gap-2">
          <Play className="w-4 h-4 text-violet-400" />
          Practice Position
        </h3>
        <p className="text-xs text-zinc-400">
          Make moves freely to analyze and understand this specific layout.
        </p>

        <Card className="flex flex-col items-center justify-center p-6 bg-zinc-900/10 border-zinc-800 max-w-lg mx-auto">
          <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-lg overflow-hidden border border-zinc-800 shadow-lg shadow-black/30 mb-4 bg-zinc-950 p-1.5">
            <Chessboard 
              options={{
                position: boardFen,
                onPieceDrop: ({ sourceSquare, targetSquare }) => {
                  if (targetSquare) {
                    return handleMove(sourceSquare, targetSquare);
                  }
                  return false;
                }
              }}
            />
          </div>

          <div className="flex items-center justify-between w-full border-t border-zinc-800/40 pt-4 mt-2">
            <span className="text-xs font-semibold text-zinc-400 max-w-[70%] text-left truncate">
              {moveStatus}
            </span>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] py-1.5 px-3 h-8"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
        </Card>
      </div>

      {/* Action Buttons: Complete Lesson / Next Lesson */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/40 pt-6">
        {!isCompleted ? (
          <Button 
            onClick={handleCompleteClick}
            isLoading={isMarking}
            className="w-full sm:w-auto bg-gradient-to-tr from-violet-600 to-violet-500 text-white flex items-center justify-center gap-1.5 px-6 shadow-lg shadow-violet-500/15"
          >
            <CheckCircle className="w-4 h-4" />
            Mark Lesson as Completed
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
            <CheckCircle className="w-4 h-4" />
            You've completed this lesson!
          </div>
        )}

        {nextLesson && (
          <Button
            onClick={() => navigate(`/academy/${nextLesson.slug}`)}
            variant="outline"
            className="w-full sm:w-auto hover:bg-zinc-800 flex items-center justify-center gap-1.5"
          >
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Next Up</span>
              <span className="text-xs text-zinc-300 font-bold block">{nextLesson.title}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-violet-400" />
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

        // Extract practice FEN (use the last chessboard in the markdown, or first if only one)
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
        <div className="space-y-6 text-left animate-pulse">
          <div className="h-6 w-32 bg-zinc-800 rounded" />
          <div className="h-10 w-2/3 bg-zinc-800 rounded" />
          <div className="h-[250px] w-full bg-zinc-900/30 rounded-xl" />
          <div className="h-6 w-48 bg-zinc-800 rounded" />
        </div>
      </Layout>
    );
  }

  if (error || !lesson) {
    return (
      <Layout>
        <Card className="p-8 text-center bg-zinc-900/20 border-zinc-800 text-zinc-500">
          <p className="text-sm font-semibold">{error || 'Lesson failed to load.'}</p>
          <Button onClick={() => navigate('/academy')} size="sm" className="mt-4 bg-violet-600">
            Return to Academy
          </Button>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        <LessonHeader 
          lesson={lesson} 
          onBack={() => navigate('/academy')} 
        />
        
        {/* Separator */}
        <div className="h-[1px] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800" />
        
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
