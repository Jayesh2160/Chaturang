import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { lessonService } from '../services/lessonService';
import type { LessonResponse } from '../services/lessonService';
import { gameService } from '../services/gameService';
import { calculateGamificationStats } from '../utils/gamification';
import { 
  ArrowLeft, 
  Clock, 
  Award, 
  CheckCircle, 
  RotateCcw, 
  Play, 
  ChevronRight, 
  AlertTriangle,
  BookOpen,
  Trophy,
  Sparkles,
  Star,
  Check
} from 'lucide-react';
import { isValidFen, cleanFenForChessJs } from '../utils/fenValidation';

// ==========================================
// 1. DATA TYPES & PARSER
// ==========================================
interface ExerciseOrChallenge {
  fen: string;
  moves: string[];
  instruction: string;
  success: string;
}

const parseLessonContent = (content: string) => {
  let cleanContent = content;
  let exercise: ExerciseOrChallenge | null = null;
  let challenge: ExerciseOrChallenge | null = null;

  const exerciseRegex = /\[EXERCISE\]([\s\S]*?)\[\/EXERCISE\]/;
  const challengeRegex = /\[CHALLENGE\]([\s\S]*?)\[\/CHALLENGE\]/;

  const parseBlock = (blockText: string): ExerciseOrChallenge => {
    const lines = blockText.split('\n');
    let fen = 'start';
    let moves: string[] = [];
    let instruction = '';
    let success = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('FEN:')) {
        fen = trimmed.substring(4).trim();
      } else if (trimmed.startsWith('Moves:')) {
        moves = trimmed.substring(6).trim().toLowerCase().split(',').map(m => m.trim());
      } else if (trimmed.startsWith('Instruction:')) {
        instruction = trimmed.substring(12).trim();
      } else if (trimmed.startsWith('Success:')) {
        success = trimmed.substring(8).trim();
      }
    });

    return { fen, moves, instruction, success };
  };

  const exerciseMatch = content.match(exerciseRegex);
  if (exerciseMatch) {
    exercise = parseBlock(exerciseMatch[1]);
    cleanContent = cleanContent.replace(exerciseMatch[0], '');
  }

  const challengeMatch = content.match(challengeRegex);
  if (challengeMatch) {
    challenge = parseBlock(challengeMatch[1]);
    cleanContent = cleanContent.replace(challengeMatch[0], '');
  }

  return { cleanContent: cleanContent.trim(), exercise, challenge };
};

// ==========================================
// 2. LESSON HEADER COMPONENT
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
// 3. CHESSBOARD RENDERER (static/reference boards)
// ==========================================
interface ChessBoardRendererProps {
  fen: string;
  lessonTitle: string;
}

const ChessBoardRenderer: React.FC<ChessBoardRendererProps> = ({ fen, lessonTitle }) => {
  const isValid = isValidFen(fen);

  if (!isValid) {
    console.error(`Invalid FEN detected in lesson: "${lessonTitle}"`);
    return (
      <div className="my-8 flex justify-center">
        <div className="w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-2xl flex flex-col items-center justify-center border border-amber-500/20 bg-amber-500/[0.02] shadow-xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-3 animate-pulse" strokeWidth={1.5} />
          <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-1">Board Unavailable</h4>
          <p className="text-xs text-zinc-400 font-light leading-relaxed">
            The board configuration for this lesson section contains invalid coordinates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-8 flex justify-center">
      <div className="w-full max-w-[340px] sm:max-w-[480px] aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-zinc-950 p-2">
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
// 4. LESSON CONTENT COMPONENT
// ==========================================
interface LessonContentProps {
  content: string;
  lessonTitle: string;
}

const LessonContent: React.FC<LessonContentProps> = ({ content, lessonTitle }) => {
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

          if (trimmed.startsWith('# ') || trimmed.startsWith('### Key Takeaways')) return null;

          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={i} className="text-xl font-bold text-white font-display pt-6 pb-2 border-b border-white/5">
                {parseBold(trimmed.substring(3))}
              </h3>
            );
          }

          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={i} className="text-base font-bold text-zinc-100 font-display pt-4">
                {parseBold(trimmed.substring(4))}
              </h4>
            );
          }

          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <ul key={i} className="list-disc pl-6 space-y-1.5 text-zinc-350 my-2">
                <li>{parseBold(trimmed.substring(2))}</li>
              </ul>
            );
          }

          return (
            <p key={i} className="font-light">
              {parseBold(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const parts = content.split(/(\[BOARD:[^\]]+\])/g);

  return (
    <div className="space-y-6">
      {parts.map((part, index) => {
        if (part.startsWith('[BOARD:') && part.endsWith(']')) {
          const fen = part.slice(7, -1);
          return <ChessBoardRenderer key={index} fen={fen} lessonTitle={lessonTitle} />;
        } else {
          return <React.Fragment key={index}>{renderTextSegment(part)}</React.Fragment>;
        }
      })}
    </div>
  );
};

// ==========================================
// 5. INTERACTIVE EXERCISE / CHALLENGE COMPONENT
// ==========================================
interface ExerciseViewProps {
  exercise: ExerciseOrChallenge;
  isChallenge: boolean;
  onSuccess: () => void;
}

const ExerciseView: React.FC<ExerciseViewProps> = ({ exercise, isChallenge, onSuccess }) => {
  const isFenValid = isValidFen(exercise.fen);

  const [game, setGame] = useState(() => {
    try {
      if (isFenValid) {
        return new Chess(exercise.fen === 'start' ? undefined : cleanFenForChessJs(exercise.fen));
      }
    } catch (e) {
      console.error('Failed to parse FEN in exercise', e);
    }
    return new Chess();
  });

  const [boardFen, setBoardFen] = useState(() => game.fen());
  const [moveStatus, setMoveStatus] = useState<string>('Your move. Find the correct tactic!');
  const [currentMoveIdx, setCurrentMoveIdx] = useState(0);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    try {
      const g = new Chess(exercise.fen === 'start' ? undefined : cleanFenForChessJs(exercise.fen));
      setGame(g);
      setBoardFen(g.fen());
      setMoveStatus('Your move. Find the correct tactic!');
      setCurrentMoveIdx(0);
      setStatusType('info');
      setIsCompleted(false);
    } catch (e) {
      console.error(e);
    }
  }, [exercise]);

  const handleMove = (sourceSquare: string, targetSquare: string) => {
    if (isCompleted) return false;

    try {
      const uciMove = (sourceSquare + targetSquare).toLowerCase();
      const expectedMove = exercise.moves[currentMoveIdx];

      // Validate against coordinate move (e.g. g5f6) or standard coordinate plus promo (e.g. e7e8q)
      const isPromoMove = expectedMove.length === 5;
      const moveOptions = {
        from: sourceSquare,
        to: targetSquare,
        promotion: isPromoMove ? expectedMove.charAt(4) : 'q'
      };

      // Try making the move in chess.js
      const gameCopy = new Chess(game.fen());
      const move = gameCopy.move(moveOptions);

      if (move) {
        // If move matches coordinates or uciMove is part of the solution
        if (uciMove === expectedMove || uciMove + (isPromoMove ? expectedMove.charAt(4) : '') === expectedMove) {
          game.move(moveOptions);
          setBoardFen(game.fen());
          
          const nextIdx = currentMoveIdx + 1;
          
          if (nextIdx >= exercise.moves.length) {
            // Fully completed the exercise!
            setMoveStatus(exercise.success || 'Correct move! Well done.');
            setStatusType('success');
            setIsCompleted(true);
            onSuccess();
          } else {
            // Make intermediate move (opponent move in sequence)
            setCurrentMoveIdx(nextIdx);
            setMoveStatus('Good! Applying opponent response...');
            setStatusType('info');

            // Play opponent response after a short delay
            setTimeout(() => {
              const opponentMove = exercise.moves[nextIdx];
              const oppFrom = opponentMove.substring(0, 2);
              const oppTo = opponentMove.substring(2, 4);
              const oppPromo = opponentMove.length === 5 ? opponentMove.charAt(4) : undefined;
              
              game.move({ from: oppFrom, to: oppTo, promotion: oppPromo });
              setBoardFen(game.fen());
              setCurrentMoveIdx(nextIdx + 1);

              if (nextIdx + 1 >= exercise.moves.length) {
                setMoveStatus(exercise.success || 'Correct move! Well done.');
                setStatusType('success');
                setIsCompleted(true);
                onSuccess();
              } else {
                setMoveStatus('Your move. Continue the sequence!');
              }
            }, 800);
          }
          return true;
        } else {
          setMoveStatus('Incorrect move. That is not the solution. Try again!');
          setStatusType('error');
          return false;
        }
      }
    } catch (e) {
      setMoveStatus('Illegal move. Try moving a different piece.');
      setStatusType('error');
    }
    return false;
  };

  const handleReset = () => {
    try {
      const g = new Chess(exercise.fen === 'start' ? undefined : cleanFenForChessJs(exercise.fen));
      setGame(g);
      setBoardFen(g.fen());
      setMoveStatus('Your move. Find the correct tactic!');
      setCurrentMoveIdx(0);
      setStatusType('info');
      setIsCompleted(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 text-left max-w-xl mx-auto">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/15">
          {isChallenge ? 'Mini Challenge' : 'Board Exercise'}
        </span>
        <p className="text-zinc-200 text-sm leading-relaxed font-semibold">
          {exercise.instruction}
        </p>
      </div>

      {!isFenValid ? (
        <Card className="flex flex-col items-center justify-center p-8 bg-amber-500/[0.02] border-amber-500/20 rounded-2xl shadow-lg text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" strokeWidth={1.5} />
          <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-1">Exercise Unavailable</h4>
          <p className="text-xs text-zinc-400 font-light leading-relaxed">
            This exercise configuration contains invalid board coordinates.
          </p>
        </Card>
      ) : (
        <Card className="p-6 bg-zinc-950/20 border-white/5 rounded-2xl shadow-lg flex flex-col items-center">
          <div className="w-full max-w-[340px] sm:max-w-[480px] aspect-square rounded-xl overflow-hidden border border-white/10 shadow-md mb-6 bg-zinc-950 p-1.5">
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

          <div className="w-full border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 text-left">
              <span className={`text-xs font-semibold block leading-tight ${
                statusType === 'success' 
                  ? 'text-emerald-400' 
                  : statusType === 'error' 
                    ? 'text-red-400' 
                    : 'text-zinc-400'
              }`}>
                {moveStatus}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              className="flex items-center justify-center gap-1 text-[10px] py-1 px-3 h-8 font-bold uppercase tracking-wider self-start sm:self-auto border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              Reset
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

// ==========================================
// 6. PRACTICE POSITION (SANDBOX)
// ==========================================
interface PracticeSandboxProps {
  practiceFen: string;
  onNext: () => void;
}

const PracticeSandbox: React.FC<PracticeSandboxProps> = ({ practiceFen, onNext }) => {
  const isPracticeFenValid = isValidFen(practiceFen);

  const [game, setGame] = useState(() => {
    try {
      if (isPracticeFenValid) {
        return new Chess(practiceFen === 'start' ? undefined : cleanFenForChessJs(practiceFen));
      }
    } catch (e) {
      console.error(e);
    }
    return new Chess();
  });

  const [boardFen, setBoardFen] = useState(() => game.fen());
  const [moveStatus, setMoveStatus] = useState<string>('Interact with the position below to analyze moves.');

  const handleMove = (sourceSquare: string, targetSquare: string) => {
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
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
    try {
      const g = new Chess(practiceFen === 'start' ? undefined : cleanFenForChessJs(practiceFen));
      setGame(g);
      setBoardFen(g.fen());
      setMoveStatus('Board coordinates reset.');
    } catch (e) {
      const g = new Chess();
      setGame(g);
      setBoardFen(g.fen());
      setMoveStatus('Board coordinates reset.');
    }
  };

  return (
    <div className="space-y-6 text-left max-w-xl mx-auto">
      <div className="space-y-1">
        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-brand-accent/10 text-brand-accent border border-brand-accent/15">
          Practice Position
        </span>
        <p className="text-zinc-400 text-xs font-light">
          Analyze moves freely. Toggle and test various coordinates on this board layout.
        </p>
      </div>

      {!isPracticeFenValid ? (
        <Card className="flex flex-col items-center justify-center p-8 bg-amber-500/[0.02] border-amber-500/20 rounded-2xl shadow-lg text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mb-3" strokeWidth={1.5} />
          <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider mb-1">Practice Board Unavailable</h4>
          <p className="text-xs text-zinc-400 font-light leading-relaxed">
            The practice configuration for this lesson contains invalid coordinates.
          </p>
        </Card>
      ) : (
        <Card className="p-6 bg-zinc-950/20 border-white/5 rounded-2xl shadow-lg flex flex-col items-center">
          <div className="w-full max-w-[340px] sm:max-w-[480px] aspect-square rounded-xl overflow-hidden border border-white/10 shadow-md mb-6 bg-zinc-950 p-1.5">
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

          <div className="w-full border-t border-white/5 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1 text-left">
              <span className="text-xs font-semibold text-zinc-450 block leading-tight truncate max-w-[240px]">
                {moveStatus}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleReset}
              className="flex items-center justify-center gap-1 text-[10px] py-1 px-3 h-8 font-bold uppercase tracking-wider border-white/10"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
              Reset
            </Button>
          </div>
        </Card>
      )}

      <div className="pt-4 flex justify-end">
        <Button onClick={onNext} className="bg-white text-zinc-950 hover:bg-zinc-250 font-bold px-6">
          Master Lesson
          <ChevronRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// ==========================================
// 7. COMPLETED SCREEN (GAMIFIED CELEBRATION)
// ==========================================
interface LessonCompleteViewProps {
  lessonTitle: string;
  nextLesson: LessonResponse | null;
  onNextLesson: () => void;
  onBack: () => void;
  completedLessonsCount: number;
  gamesCount: number;
  streak: number;
}

const LessonCompleteView: React.FC<LessonCompleteViewProps> = ({
  lessonTitle,
  nextLesson,
  onNextLesson,
  onBack,
  completedLessonsCount,
  gamesCount,
  streak
}) => {
  // Calculate statistics (before adding the current lesson to completedCount, or with current lesson included)
  // Let's assume completedLessonsCount already includes the lesson they just solved, so they can see the current progress!
  const stats = calculateGamificationStats(completedLessonsCount, gamesCount, streak);

  return (
    <Card className="p-8 border-brand-accent/20 bg-zinc-950/40 relative overflow-hidden rounded-3xl max-w-md mx-auto text-center space-y-8 shadow-2xl">
      <div className="absolute right-0 top-0 h-44 w-44 bg-brand-accent/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute left-0 bottom-0 h-44 w-44 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Trophy and stars */}
      <div className="relative flex justify-center py-2">
        <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative animate-pulse">
          <Award className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />
        </div>
        <div className="absolute top-1 right-12 animate-bounce">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        </div>
        <div className="absolute bottom-2 left-12 animate-bounce delay-300">
          <Star className="w-5 h-5 fill-brand-accent text-brand-accent" />
        </div>
      </div>

      {/* Headings */}
      <div className="space-y-2">
        <h2 className="text-2xl font-extrabold font-display text-white tracking-tight">
          Lesson Mastered!
        </h2>
        <p className="text-zinc-400 text-xs font-light px-4">
          You have successfully completed all coordinate exercises, mini challenges, and position analysis for **{lessonTitle}**.
        </p>
      </div>

      {/* XP Reward card */}
      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-left">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">XP Awarded</span>
            <span className="text-sm font-semibold text-zinc-200">Lesson Mastery</span>
          </div>
        </div>
        <span className="text-xl font-black font-display text-brand-accent">
          +100 XP
        </span>
      </div>

      {/* Level Up progress bar */}
      <div className="space-y-3 text-left">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <span className="text-zinc-500">Player Level {stats.level}</span>
          <span className="text-zinc-350">{stats.xpInCurrentLevel} / {stats.xpRequiredForNextLevel} XP</span>
        </div>
        
        <div className="w-full bg-zinc-900 border border-white/5 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-brand-accent h-full rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${stats.xpProgressPercentage}%` }}
          />
        </div>
        <p className="text-[10px] text-zinc-650 text-right">
          {stats.xpRequiredForNextLevel - stats.xpInCurrentLevel} XP to Level {stats.level + 1}
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-4 space-y-3">
        {nextLesson ? (
          <Button 
            onClick={onNextLesson}
            className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold py-3 flex items-center justify-center gap-1.5"
          >
            Study Next: {nextLesson.title}
            <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button 
            onClick={onBack}
            className="w-full bg-white text-zinc-950 hover:bg-zinc-200 font-bold py-3"
          >
            Back to Academy Curriculum
          </Button>
        )}
        <Button 
          variant="outline" 
          onClick={onBack}
          className="w-full border-white/10 hover:bg-white/5"
        >
          View Roadmap
        </Button>
      </div>
    </Card>
  );
};

// ==========================================
// 8. MAIN LESSON DETAILS PAGE
// ==========================================
export const LessonDetails: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<LessonResponse | null>(null);
  const [nextLesson, setNextLesson] = useState<LessonResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lesson parts
  const [theoryContent, setTheoryContent] = useState('');
  const [exercise, setExercise] = useState<ExerciseOrChallenge | null>(null);
  const [challenge, setChallenge] = useState<ExerciseOrChallenge | null>(null);
  const [practiceFen, setPracticeFen] = useState('start');

  // Gamification & streak states
  const [completedLessonsCount, setCompletedLessonsCount] = useState(0);
  const [gamesCount, setGamesCount] = useState(0);
  const [streak, setStreak] = useState(1);

  // Steps
  // 0: Theory / Explanation
  // 1: Board Exercise
  // 2: Mini Challenge
  // 3: Practice Sandbox
  // 4: Complete Screen
  const [currentStep, setCurrentStep] = useState(0);
  const [unlockedSteps, setUnlockedSteps] = useState<boolean[]>([true, false, false, false, false]);

  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadLessonData = async () => {
      if (!slug) return;
      try {
        setIsLoading(true);
        setError(null);
        setCurrentStep(0);
        
        // Fetch lesson detail
        const fetchedLesson = await lessonService.getLesson(slug);
        setLesson(fetchedLesson);

        // Parse content blocks
        const parsed = parseLessonContent(fetchedLesson.content);
        setTheoryContent(parsed.cleanContent);
        setExercise(parsed.exercise);
        setChallenge(parsed.challenge);

        // Lock/unlock steps based on what is available in the lesson and if it's already completed
        const isComplete = fetchedLesson.completed;
        setUnlockedSteps([
          true, 
          isComplete || !!parsed.exercise, 
          isComplete || !!parsed.challenge, 
          true, 
          isComplete
        ]);

        // Extract practice FEN (last reference board or default)
        const boardMatches = [...fetchedLesson.content.matchAll(/\[BOARD:([^\]]+)\]/g)];
        if (boardMatches.length > 0) {
          const lastFen = boardMatches[boardMatches.length - 1][1];
          setPracticeFen(lastFen);
        } else {
          setPracticeFen('start');
        }

        // Fetch progress and game list to calculate Level/XP
        const [progressData, gamesData] = await Promise.all([
          lessonService.getProgress(),
          gameService.getGames()
        ]);
        setCompletedLessonsCount(progressData.completedCount);
        setStreak(progressData.streak);
        setGamesCount(gamesData.length);

        // Fetch all lessons to compute the next lesson in sequence
        const allLessons = await lessonService.getLessons();
        const currentIndex = allLessons.findIndex(l => l.slug === slug);
        if (currentIndex !== -1 && currentIndex < allLessons.length - 1) {
          setNextLesson(allLessons[currentIndex + 1]);
        } else {
          if (progressData.remainingLessons.length > 0 && progressData.remainingLessons[0].slug !== slug) {
            setNextLesson(progressData.remainingLessons[0]);
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

  // Scroll to top on step transition
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentStep]);

  const handleExerciseSuccess = () => {
    const updated = [...unlockedSteps];
    updated[2] = true; // Unlock challenge
    setUnlockedSteps(updated);
  };

  const handleChallengeSuccess = async () => {
    const updated = [...unlockedSteps];
    updated[3] = true; // Unlock Sandbox
    updated[4] = true; // Unlock Completion
    setUnlockedSteps(updated);

    if (!lesson?.completed && slug) {
      try {
        await lessonService.completeLesson(slug);
        
        // Save today's completion state to track daily goals accurately in localStorage
        const todayStr = new Date().toDateString();
        const completedToday = JSON.parse(localStorage.getItem('completed_lessons_today') || '[]');
        if (!completedToday.includes(todayStr)) {
          completedToday.push(todayStr);
          localStorage.setItem('completed_lessons_today', JSON.stringify(completedToday));
        }

        // Increment count for completion screen
        setCompletedLessonsCount(prev => prev + 1);
        setLesson(prev => prev ? { ...prev, completed: true } : null);
      } catch (e) {
        console.error('Error completing lesson', e);
      }
    }
  };



  const jumpToStep = (index: number) => {
    if (unlockedSteps[index]) {
      setCurrentStep(index);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto space-y-8 text-left animate-pulse py-6">
          <div className="h-4 w-32 bg-zinc-900 rounded" />
          <div className="h-10 w-2/3 bg-zinc-900 rounded" />
          <div className="h-[340px] sm:h-[480px] w-full max-w-[340px] sm:max-w-[480px] mx-auto bg-zinc-950/40 rounded-2xl border border-white/5" />
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

  // Set up wizard steps definition based on exercises loaded
  const STEPS = [
    { label: 'Theory', icon: BookOpen },
    { label: 'Exercise', icon: Play, exists: !!exercise },
    { label: 'Challenge', icon: Trophy, exists: !!challenge },
    { label: 'Sandbox', icon: RotateCcw },
    { label: 'Complete', icon: Award }
  ].filter(s => s.exists !== false);

  // Map wizard step layout back to index
  const activeWizardStepIndex = STEPS.findIndex((s) => {
    if (currentStep === 0) return s.label === 'Theory';
    if (currentStep === 1) return s.label === 'Exercise';
    if (currentStep === 2) return s.label === 'Challenge';
    if (currentStep === 3) return s.label === 'Sandbox';
    return s.label === 'Complete';
  });

  return (
    <Layout>
      <div ref={topRef} className="max-w-2xl mx-auto space-y-8 pb-16 animate-fade-in">
        <LessonHeader 
          lesson={lesson} 
          onBack={() => navigate('/academy')} 
        />

        {/* Step-by-Step progress timeline */}
        {currentStep < 4 && (
          <div className="relative flex items-center justify-between w-full max-w-md mx-auto pt-2 pb-6 px-1">
            {/* Timeline connection lines */}
            <div className="absolute left-4 right-4 top-[18px] h-[1px] bg-white/5 z-0" />
            <div 
              className="absolute left-4 top-[18px] h-[1px] bg-brand-accent transition-all duration-500 z-0" 
              style={{ width: `${(activeWizardStepIndex / (STEPS.length - 1)) * 92}%` }}
            />

            {STEPS.map((s) => {
              const stepTargetIdx = s.label === 'Theory' ? 0 : (s.label === 'Exercise' ? 1 : (s.label === 'Challenge' ? 2 : (s.label === 'Sandbox' ? 3 : 4)));
              const isStepUnlocked = unlockedSteps[stepTargetIdx];
              const isStepActive = currentStep === stepTargetIdx;
              const isStepComplete = isStepUnlocked && currentStep > stepTargetIdx;
              const Icon = s.icon;

              return (
                <button
                  key={s.label}
                  disabled={!isStepUnlocked}
                  onClick={() => jumpToStep(stepTargetIdx)}
                  className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none disabled:cursor-not-allowed"
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                    isStepActive 
                      ? 'bg-brand-accent/15 border-brand-accent text-brand-accent shadow-[0_0_12px_rgba(139,92,246,0.3)] ring-4 ring-brand-accent/10'
                      : isStepComplete
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : isStepUnlocked
                          ? 'bg-zinc-950 border-white/10 text-zinc-350 hover:border-white/20'
                          : 'bg-zinc-950 border-white/5 text-zinc-700'
                  }`}>
                    {isStepComplete ? (
                      <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
                    ) : (
                      <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                    )}
                  </div>
                  <span className={`text-[8px] font-bold uppercase tracking-widest mt-1.5 transition-colors ${
                    isStepActive 
                      ? 'text-brand-accent' 
                      : isStepComplete
                        ? 'text-emerald-400' 
                        : isStepUnlocked
                          ? 'text-zinc-500 group-hover:text-zinc-300'
                          : 'text-zinc-750'
                  }`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Wizard Step Render */}
        <div className="transition-all duration-300 ease-in-out">
          {currentStep === 0 && (
            <div className="space-y-8 animate-fade-in text-left">
              {/* Theory Content */}
              <LessonContent content={theoryContent} lessonTitle={lesson.title} />

              <div className="pt-6 border-t border-white/5 flex justify-end">
                {exercise ? (
                  <Button onClick={() => jumpToStep(1)} className="bg-white text-zinc-950 hover:bg-zinc-250 font-bold px-6">
                    Start Exercise
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                ) : challenge ? (
                  <Button onClick={() => jumpToStep(2)} className="bg-white text-zinc-950 hover:bg-zinc-250 font-bold px-6">
                    Start Challenge
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={() => jumpToStep(3)} className="bg-white text-zinc-950 hover:bg-zinc-250 font-bold px-6">
                    Open Sandbox
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {currentStep === 1 && exercise && (
            <div className="animate-fade-in space-y-6">
              <ExerciseView 
                exercise={exercise} 
                isChallenge={false} 
                onSuccess={handleExerciseSuccess} 
              />
              <div className="pt-6 border-t border-white/5 flex justify-between">
                <Button variant="ghost" onClick={() => jumpToStep(0)} className="text-zinc-400 hover:text-white px-0 hover:bg-transparent">
                  Back to Theory
                </Button>
                <Button 
                  disabled={!unlockedSteps[2]}
                  onClick={() => jumpToStep(challenge ? 2 : 3)}
                  className="bg-white text-zinc-950 hover:bg-zinc-250 font-bold px-6 disabled:opacity-40 disabled:hover:bg-white"
                >
                  Next Challenge
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && challenge && (
            <div className="animate-fade-in space-y-6">
              <ExerciseView 
                exercise={challenge} 
                isChallenge={true} 
                onSuccess={handleChallengeSuccess} 
              />
              <div className="pt-6 border-t border-white/5 flex justify-between">
                <Button variant="ghost" onClick={() => jumpToStep(exercise ? 1 : 0)} className="text-zinc-400 hover:text-white px-0 hover:bg-transparent">
                  Back
                </Button>
                <Button 
                  disabled={!unlockedSteps[3]}
                  onClick={() => jumpToStep(3)}
                  className="bg-white text-zinc-950 hover:bg-zinc-250 font-bold px-6 disabled:opacity-40 disabled:hover:bg-white"
                >
                  Analyze Position
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="animate-fade-in">
              <PracticeSandbox 
                practiceFen={practiceFen} 
                onNext={() => jumpToStep(4)} 
              />
            </div>
          )}

          {currentStep === 4 && (
            <div className="animate-fade-in py-6">
              <LessonCompleteView
                lessonTitle={lesson.title}
                nextLesson={nextLesson}
                onNextLesson={() => {
                  if (nextLesson) navigate(`/academy/${nextLesson.slug}`);
                }}
                onBack={() => navigate('/academy')}
                completedLessonsCount={completedLessonsCount}
                gamesCount={gamesCount}
                streak={streak}
              />
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
