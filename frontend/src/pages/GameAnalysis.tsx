import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { Layout } from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { gameService } from '../services/gameServiceFactory';
import type { GameResponse, GameAnalysisResponse, MoveAnalysis } from '../services/gameService';
import {
  ArrowLeft,
  AlertTriangle,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  Activity,
  Award,
  BookOpen
} from 'lucide-react';

// Helper to parse evaluation values to numeric values for plotting
const parseEvalToNumeric = (evalStr: string | null | undefined): number => {
  if (!evalStr) return 0.0;
  const trimmed = evalStr.trim();
  if (trimmed.includes('Mate')) {
    return trimmed.startsWith('+') ? 8.0 : -8.0;
  }
  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? 0.0 : parsed;
};

// Clamp evaluations to [-8.0, 8.0] for plotting to prevent mate scores from squashing the graph scale
const clampEval = (val: number): number => {
  return Math.max(-8.0, Math.min(8.0, val));
};

export const GameAnalysis: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const gameId = id ? parseInt(id) : null;

  const [game, setGame] = useState<GameResponse | null>(null);
  const [analysis, setAnalysis] = useState<GameAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Replay & Board Highlight States
  const [activePlyIndex, setActivePlyIndex] = useState<number>(0);
  const [showBestMove, setShowBestMove] = useState<boolean>(false);

  // SVG Chart Hover Tooltip state
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    ply: number;
    evaluation: string;
  } | null>(null);

  // Reconstruct moves using chess.js
  const { fens, moves } = useMemo(() => {
    if (!game) return { fens: [], moves: [] };
    try {
      const traceChess = new Chess();
      traceChess.loadPgn(game.pgn);
      const headers = traceChess.header();
      const initialFen = headers.FEN || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

      const simChess = new Chess(initialFen);
      const fensList = [simChess.fen()];
      const movesList = [];

      const movesHistory = traceChess.history({ verbose: true });
      for (const m of movesHistory) {
        movesList.push({
          san: m.san,
          from: m.from,
          to: m.to,
          color: m.color,
          piece: m.piece,
          promotion: m.promotion || null
        });
        simChess.move(m);
        fensList.push(simChess.fen());
      }
      return { fens: fensList, moves: movesList };
    } catch (e) {
      console.error('Error generating game positions', e);
      return { fens: [], moves: [] };
    }
  }, [game]);

  // Load game & check for existing cached analysis on mount
  useEffect(() => {
    if (!gameId) return;

    const loadGameAndAnalysis = async () => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const gameData = await gameService.getGame(gameId);
        setGame(gameData);

        try {
          const analysisData = await gameService.getGameAnalysis(gameId);
          setAnalysis(analysisData);
        } catch (e) {
          // Analysis does not exist yet; cached record not found. User can trigger it.
          setAnalysis(null);
        }
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Failed to load game data. Please refresh.');
      } finally {
        setIsLoading(false);
      }
    };

    loadGameAndAnalysis();
  }, [gameId]);

  // Trigger analysis via Stockfish batch evaluation
  const handleTriggerAnalysis = async () => {
    if (!gameId || fens.length === 0) return;

    setIsAnalyzing(true);
    setErrorMsg('');
    setProgress(0);

    // Simulate progress bar updates
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev < 40) return prev + Math.floor(Math.random() * 8) + 4;
        if (prev < 75) return prev + Math.floor(Math.random() * 5) + 2;
        if (prev < 95) return prev + 1;
        return prev;
      });
    }, 150);

    try {
      const response = await gameService.analyzeGame(gameId, fens, moves);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setAnalysis(response);
        setIsAnalyzing(false);
        setActivePlyIndex(0);
      }, 300);
    } catch (err: any) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setErrorMsg(err.response?.data?.message || 'Failed to complete game analysis. Make sure Stockfish is configured.');
    }
  };

  // Compute active FEN
  const getActiveFen = () => {
    if (fens.length === 0) return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    return fens[activePlyIndex] || fens[0];
  };

  // Highlights to draw on the board
  const getSquareStyles = () => {
    const styles: Record<string, React.CSSProperties> = {};
    if (!analysis) return styles;

    const activeMoveIndex = activePlyIndex - 1; // moveIndex in analysis is 0-indexed corresponding to ply 1

    // 1. Highlight the played move if it was an error
    if (activeMoveIndex >= 0 && activeMoveIndex < analysis.moveAnalyses.length) {
      const activeMove = analysis.moveAnalyses[activeMoveIndex];
      const isError = ['INACCURACY', 'MISTAKE', 'BLUNDER'].includes(activeMove.classification);

      if (isError) {
        const playedFrom = activeMove.uci.slice(0, 2);
        const playedTo = activeMove.uci.slice(2, 4);
        const color =
          activeMove.classification === 'BLUNDER'
            ? 'rgba(239, 68, 68, 0.25)' // Red
            : activeMove.classification === 'MISTAKE'
            ? 'rgba(245, 158, 11, 0.25)' // Amber
            : 'rgba(234, 179, 8, 0.25)'; // Yellow

        const border =
          activeMove.classification === 'BLUNDER'
            ? '2px solid rgb(239, 68, 68)'
            : activeMove.classification === 'MISTAKE'
            ? '2px solid rgb(245, 158, 11)'
            : '2px solid rgb(234, 179, 8)';

        styles[playedFrom] = { backgroundColor: color, border };
        styles[playedTo] = { backgroundColor: color, border };
      }
    }

    // 2. Highlight Stockfish's recommended Best Move in Blue when active
    if (showBestMove && activeMoveIndex >= 0 && activeMoveIndex < analysis.moveAnalyses.length) {
      const activeMove = analysis.moveAnalyses[activeMoveIndex];
      const bestMoveUci = activeMove.bestMove;

      if (bestMoveUci && bestMoveUci.length >= 4) {
        const bestFrom = bestMoveUci.slice(0, 2);
        const bestTo = bestMoveUci.slice(2, 4);

        styles[bestFrom] = {
          backgroundColor: 'rgba(59, 130, 246, 0.3)',
          border: '2px dashed rgb(59, 130, 246)'
        };
        styles[bestTo] = {
          backgroundColor: 'rgba(59, 130, 246, 0.4)',
          border: '2px solid rgb(59, 130, 246)'
        };
      }
    }

    return styles;
  };

  // Jump board state to the next mistake/blunder
  const handleJumpToNextError = () => {
    if (!analysis) return;
    const startSearchIndex = activePlyIndex; // start search after current ply
    for (let i = startSearchIndex; i < analysis.moveAnalyses.length; i++) {
      const move = analysis.moveAnalyses[i];
      if (['BLUNDER', 'MISTAKE', 'INACCURACY'].includes(move.classification)) {
        setActivePlyIndex(i + 1); // activePlyIndex is moveIndex + 1
        setShowBestMove(true);
        return;
      }
    }
    // Wrap around from beginning if none found after
    for (let i = 0; i < startSearchIndex; i++) {
      const move = analysis.moveAnalyses[i];
      if (['BLUNDER', 'MISTAKE', 'INACCURACY'].includes(move.classification)) {
        setActivePlyIndex(i + 1);
        setShowBestMove(true);
        return;
      }
    }
  };

  // Get color configurations based on move classifications
  const getClassificationBadgeClass = (classification: string) => {
    switch (classification) {
      case 'BEST':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'EXCELLENT':
        return 'bg-teal-500/10 border-teal-500/30 text-teal-400';
      case 'GOOD':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'INACCURACY':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'MISTAKE':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'BLUNDER':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      default:
        return 'bg-zinc-500/10 border-zinc-500/30 text-zinc-400';
    }
  };

  // Render Move List with Annotations
  const renderMoveListTable = () => {
    if (!analysis) return null;

    const rows = [];
    const moveCount = analysis.moveAnalyses.length;
    for (let i = 0; i < moveCount; i += 2) {
      rows.push({
        num: Math.floor(i / 2) + 1,
        white: analysis.moveAnalyses[i],
        whiteIndex: i + 1,
        black: analysis.moveAnalyses[i + 1] || null,
        blackIndex: i + 2,
      });
    }

    const getClassSymbol = (classification: string) => {
      switch (classification) {
        case 'BEST': return '✓';
        case 'EXCELLENT': return '★';
        case 'GOOD': return '•';
        case 'INACCURACY': return '?!';
        case 'MISTAKE': return '?';
        case 'BLUNDER': return '??';
        default: return '';
      }
    };

    return (
      <div className="overflow-y-auto max-h-[350px] border border-white/5 rounded-xl bg-zinc-950/40 p-2 text-left font-mono">
        <div className="grid grid-cols-12 gap-1 text-zinc-500 text-[10px] font-bold px-2 py-1 uppercase tracking-wider border-b border-white/5 mb-2">
          <div className="col-span-2 text-center">#</div>
          <div className="col-span-5">White</div>
          <div className="col-span-5">Black</div>
        </div>
        <div className="space-y-0.5">
          {rows.map((row) => (
            <div key={row.num} className="grid grid-cols-12 gap-1 text-xs py-0.5 px-2 rounded hover:bg-white/[0.01]">
              <div className="col-span-2 text-zinc-600 text-center font-sans font-semibold border-r border-white/5 py-1">
                {row.num}
              </div>
              
              {/* White Move */}
              <div
                className={`col-span-5 px-2 py-1 rounded cursor-pointer transition-colors flex items-center justify-between group ${
                  activePlyIndex === row.whiteIndex
                    ? 'bg-violet-600/20 border border-violet-500/30 text-white font-bold'
                    : 'text-zinc-300 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => {
                  setActivePlyIndex(row.whiteIndex);
                  setShowBestMove(false);
                }}
              >
                <span>{row.white.san}</span>
                <span className={`text-[10px] font-bold font-sans px-1 rounded ${
                  row.white.classification === 'BLUNDER' ? 'text-red-400 bg-red-500/10' :
                  row.white.classification === 'MISTAKE' ? 'text-amber-400 bg-amber-500/10' :
                  row.white.classification === 'INACCURACY' ? 'text-yellow-400 bg-yellow-500/10' :
                  row.white.classification === 'BEST' ? 'text-emerald-400 bg-emerald-500/10' :
                  row.white.classification === 'EXCELLENT' ? 'text-teal-400 bg-teal-500/10' : 'text-zinc-500'
                }`}>
                  {getClassSymbol(row.white.classification)}
                </span>
              </div>

              {/* Black Move */}
              <div className="col-span-5">
                {row.black && (
                  <div
                    className={`px-2 py-1 rounded cursor-pointer transition-colors flex items-center justify-between group ${
                      activePlyIndex === row.blackIndex
                        ? 'bg-violet-600/20 border border-violet-500/30 text-white font-bold'
                        : 'text-zinc-300 hover:text-white hover:bg-white/5'
                    }`}
                    onClick={() => {
                      setActivePlyIndex(row.blackIndex);
                      setShowBestMove(false);
                    }}
                  >
                    <span>{row.black.san}</span>
                    <span className={`text-[10px] font-bold font-sans px-1 rounded ${
                      row.black.classification === 'BLUNDER' ? 'text-red-400 bg-red-500/10' :
                      row.black.classification === 'MISTAKE' ? 'text-amber-400 bg-amber-500/10' :
                      row.black.classification === 'INACCURACY' ? 'text-yellow-400 bg-yellow-500/10' :
                      row.black.classification === 'BEST' ? 'text-emerald-400 bg-emerald-500/10' :
                      row.black.classification === 'EXCELLENT' ? 'text-teal-400 bg-teal-500/10' : 'text-zinc-500'
                    }`}>
                      {getClassSymbol(row.black.classification)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // SVG Chart Dimensions & Computations
  const chartWidth = 640;
  const chartHeight = 140;
  const paddingX = 20;
  const paddingY = 15;

  const points = useMemo(() => {
    if (!analysis) return [];
    
    // Total points on graph: N + 1 (Start state at index 0, followed by moves 1 to N)
    const count = analysis.moveAnalyses.length;
    const items = [
      { ply: 0, evalVal: parseEvalToNumeric('0.30'), rawStr: '+0.30' },
      ...analysis.moveAnalyses.map(m => ({
        ply: m.moveIndex + 1,
        evalVal: parseEvalToNumeric(m.evaluation),
        rawStr: m.evaluation
      }))
    ];

    return items.map((item, idx) => {
      const x = paddingX + (idx * (chartWidth - 2 * paddingX)) / count;
      const clamped = clampEval(item.evalVal);
      // Map [-8, 8] range to coordinate range [chartHeight - paddingY, paddingY]
      // +8.0 (White winning) maps to paddingY (top)
      // -8.0 (Black winning) maps to chartHeight - paddingY (bottom)
      const y = paddingY + (1.0 - (clamped - (-8.0)) / 16.0) * (chartHeight - 2 * paddingY);
      return { x, y, ply: item.ply, evaluation: item.rawStr };
    });
  }, [analysis]);

  // Generate SVG paths
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return 'M ' + points.map(p => `${p.x} ${p.y}`).join(' L ');
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    const startX = points[0].x;
    const endX = points[points.length - 1].x;
    const middleY = chartHeight / 2; // draw-line at 0.0 evaluation
    return `${linePath} L ${endX} ${middleY} L ${startX} ${middleY} Z`;
  }, [points, linePath]);

  // Handle cursor moves over evaluation graph to update hovering tooltips
  const handleGraphMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (points.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * chartWidth;

    // Find the closest point in list
    let closest = points[0];
    let minDist = Math.abs(points[0].x - mouseX);
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(points[i].x - mouseX);
      if (dist < minDist) {
        closest = points[i];
        minDist = dist;
      }
    }

    setHoveredPoint({
      x: closest.x,
      y: closest.y,
      ply: closest.ply,
      evaluation: closest.evaluation
    });
  };

  const handleGraphMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleGraphClick = () => {
    if (hoveredPoint) {
      setActivePlyIndex(hoveredPoint.ply);
      setShowBestMove(false);
    }
  };

  // Selected Move Analysis Details
  const activeMoveIndex = activePlyIndex - 1; // 0-indexed index in analyses list
  const activeMove: MoveAnalysis | null = useMemo(() => {
    if (analysis && activeMoveIndex >= 0 && activeMoveIndex < analysis.moveAnalyses.length) {
      return analysis.moveAnalyses[activeMoveIndex];
    }
    return null;
  }, [analysis, activeMoveIndex]);

  // Calculate coordinates for the selected ply point indicator on graph
  const selectedPoint = useMemo(() => {
    if (points.length === 0) return null;
    return points.find(p => p.ply === activePlyIndex) || points[0];
  }, [points, activePlyIndex]);

  return (
    <Layout>
      <div className="space-y-8 animate-fade-in text-left">
        {/* Top Navigation */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/my-games')}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white px-0"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
            Back to Matches
          </Button>
        </div>

        {errorMsg && (
          <div className="bg-red-500/5 border border-red-500/10 text-red-400 text-xs px-4 py-3 rounded-xl font-medium">
            {errorMsg}
          </div>
        )}

        {isLoading ? (
          /* Initial loading skeletons */
          <div className="space-y-6">
            <div className="h-10 w-1/3 bg-zinc-900/40 border border-white/5 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-44 bg-zinc-900/40 border border-white/5 rounded-2xl animate-pulse col-span-1" />
              <div className="h-44 bg-zinc-900/40 border border-white/5 rounded-2xl animate-pulse col-span-2" />
            </div>
          </div>
        ) : !game ? (
          <div className="text-center py-20 text-zinc-500 text-sm">Game not found.</div>
        ) : !analysis ? (
          /* ==================== PRE-ANALYSIS / CTA VIEW ==================== */
          <div className="max-w-3xl mx-auto py-12 space-y-8 text-center">
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 animate-pulse" strokeWidth={1.5} />
              </div>
              <h1 className="text-3xl font-extrabold font-display text-white tracking-tight">
                Request Stockfish Game Analysis
              </h1>
              <p className="text-zinc-400 text-sm max-w-lg mx-auto font-light leading-relaxed">
                Evaluate every move played in this match. Chaturang will compute move drops, identify blunders, generate accuracy indicators, and offer coaching reviews.
              </p>
            </div>

            {isAnalyzing ? (
              <div className="bg-zinc-950/40 border border-white/5 p-8 rounded-2xl space-y-6 max-w-md mx-auto">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-zinc-400 font-mono">
                    <span>Evaluating moves with Stockfish...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-white/5">
                    <div
                      className="bg-violet-600 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(139,92,246,0.5)]"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 leading-normal font-light">
                  Do not close this page. The engine is running batch analyses on all positions.
                </p>
              </div>
            ) : (
              <Card className="p-6 bg-zinc-950/20 border-white/5 max-w-md mx-auto rounded-2xl text-left space-y-4">
                <div className="flex gap-3">
                  <Info className="w-5 h-5 text-zinc-400 shrink-0" strokeWidth={1.5} />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wide">Analysis details</h4>
                    <p className="text-[11px] text-zinc-400 font-light leading-normal">
                      This game has <strong className="text-zinc-200">{moves.length} moves</strong> ({fens.length} FEN positions). Sequential evaluations will be logged and cached permanently.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleTriggerAnalysis}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl cursor-pointer"
                >
                  <Sparkles className="w-4.5 h-4.5 text-violet-200" strokeWidth={1.5} />
                  Start Full Game Analysis
                </Button>
              </Card>
            )}
          </div>
        ) : (
          /* ==================== ACTIVE ANALYSIS DASHBOARD ==================== */
          <div className="space-y-8">
            {/* Header Title */}
            <div className="space-y-1">
              <h1 className="text-3xl font-extrabold font-display text-white tracking-tight">
                Game Review vs {game.opponentName}
              </h1>
              <p className="text-xs text-zinc-400 font-light uppercase tracking-wider flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-violet-400" />
                As {game.playerColor} • Game Mode: {game.gameMode || 'SELF'}
              </p>
            </div>

            {/* Top row: Accuracy Circle & Move Counts & Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Game Accuracy Card (Left - 4 columns) */}
              <Card className="lg:col-span-4 bg-zinc-950/20 border-white/5 p-6 flex flex-col items-center justify-center text-center rounded-2xl">
                <div className="relative w-28 h-28 flex items-center justify-center mb-4">
                  {/* SVG circular ring */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      className="stroke-zinc-900"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    <circle
                      cx="56"
                      cy="56"
                      r="48"
                      className="stroke-violet-600"
                      strokeWidth="8"
                      fill="transparent"
                      strokeDasharray={2 * Math.PI * 48}
                      strokeDashoffset={2 * Math.PI * 48 * (1 - analysis.accuracy / 100)}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-extrabold font-display text-white">
                      {Math.round(analysis.accuracy)}%
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">
                      Accuracy
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-300">Game Accuracy Metric</h4>
                  <p className="text-[10px] text-zinc-500 max-w-[200px] leading-relaxed font-light">
                    Calculated using standard weighted averages of move classifications: Best/Excellent moves vs Blunders/Mistakes.
                  </p>
                </div>
              </Card>

              {/* Move breakdown & Coaching Summary (Right - 8 columns) */}
              <Card className="lg:col-span-8 bg-zinc-950/20 border-white/5 p-6 flex flex-col justify-between gap-6 rounded-2xl">
                {/* Move classification badges grid */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider font-mono">Move Classifications</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                    <div className="p-3 rounded-xl bg-zinc-950/40 border border-white/5 text-center flex flex-col items-center">
                      <span className="text-xs font-bold text-emerald-400">{analysis.bestMoveCount}</span>
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wide mt-1">Best</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950/40 border border-white/5 text-center flex flex-col items-center">
                      <span className="text-xs font-bold text-teal-400">{analysis.excellentMoveCount}</span>
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wide mt-1">Excellent</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950/40 border border-white/5 text-center flex flex-col items-center">
                      <span className="text-xs font-bold text-blue-400">{analysis.goodMoveCount}</span>
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wide mt-1">Good</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950/40 border border-white/5 text-center flex flex-col items-center">
                      <span className="text-xs font-bold text-yellow-400">{analysis.inaccuracyCount}</span>
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wide mt-1">Inaccuracy</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950/40 border border-white/5 text-center flex flex-col items-center">
                      <span className="text-xs font-bold text-amber-400">{analysis.mistakeCount}</span>
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wide mt-1">Mistake</span>
                    </div>
                    <div className="p-3 rounded-xl bg-zinc-950/40 border border-white/5 text-center flex flex-col items-center">
                      <span className="text-xs font-bold text-red-400">{analysis.blunderCount}</span>
                      <span className="text-[9px] text-zinc-550 font-bold uppercase tracking-wide mt-1">Blunder</span>
                    </div>
                  </div>
                </div>

                {/* Text summary block */}
                <div className="p-4 bg-violet-950/10 border border-violet-500/10 rounded-xl flex gap-3.5 items-start">
                  <div className="p-2 bg-violet-600/10 rounded-lg border border-violet-500/20 text-violet-400 shrink-0">
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Coaching Review</span>
                    <p className="text-xs text-zinc-300 leading-relaxed font-light">
                      {analysis.summary}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Interactive SVG Evaluation Graph */}
            <Card className="bg-zinc-950/20 border-white/5 p-4 rounded-2xl space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center text-xs font-semibold px-2">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <Activity className="w-4 h-4 text-zinc-400" />
                  Evaluation Graph
                </span>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Clamped to [-8, +8] pawns. Click on line to load board ply.
                </span>
              </div>

              <div className="relative">
                <svg
                  width="100%"
                  height={chartHeight}
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  preserveAspectRatio="none"
                  className="bg-zinc-950/50 border border-white/5 rounded-xl cursor-crosshair"
                  onMouseMove={handleGraphMouseMove}
                  onMouseLeave={handleGraphMouseLeave}
                  onClick={handleGraphClick}
                >
                  <defs>
                    {/* Linear gradient for graph area fill */}
                    <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(139, 92, 246, 0.25)" />
                      <stop offset="100%" stopColor="rgba(139, 92, 246, 0.0)" />
                    </linearGradient>
                    {/* Linear gradient for stroke line */}
                    <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="rgb(139, 92, 246)" />
                      <stop offset="100%" stopColor="rgb(99, 102, 241)" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal background areas (White Advantage on top, Black on bottom) */}
                  <rect x="0" y={paddingY} width={chartWidth} height={(chartHeight - 2 * paddingY) / 2} fill="rgba(255, 255, 255, 0.01)" />
                  <rect x="0" y={chartHeight / 2} width={chartWidth} height={(chartHeight - 2 * paddingY) / 2} fill="rgba(0, 0, 0, 0.15)" />

                  {/* Dashed Center Even Line (0.0) */}
                  <line
                    x1="0"
                    y1={chartHeight / 2}
                    x2={chartWidth}
                    y2={chartHeight / 2}
                    stroke="rgba(255, 255, 255, 0.12)"
                    strokeDasharray="4 4"
                  />

                  {/* Render Area fill */}
                  {areaPath && (
                    <path
                      d={areaPath}
                      fill="url(#area-gradient)"
                    />
                  )}

                  {/* Render main path line */}
                  {linePath && (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="url(#line-gradient)"
                      strokeWidth="2"
                    />
                  )}

                  {/* Selected Ply Point dot indicator */}
                  {selectedPoint && (
                    <circle
                      cx={selectedPoint.x}
                      cy={selectedPoint.y}
                      r="4"
                      className="fill-violet-400 stroke-zinc-950"
                      strokeWidth="1.5"
                    />
                  )}

                  {/* Hover vertical line and dot */}
                  {hoveredPoint && (
                    <>
                      <line
                        x1={hoveredPoint.x}
                        y1={paddingY}
                        x2={hoveredPoint.x}
                        y2={chartHeight - paddingY}
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx={hoveredPoint.x}
                        cy={hoveredPoint.y}
                        r="3.5"
                        fill="white"
                        stroke="rgb(139, 92, 246)"
                        strokeWidth="1.5"
                      />
                    </>
                  )}
                </svg>

                {/* Hover Tooltip display */}
                {hoveredPoint && (
                  <div
                    className="absolute bg-zinc-900/95 border border-white/10 px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none text-[10px] font-mono space-y-0.5 text-left text-zinc-300"
                    style={{
                      left: `${Math.min(90, Math.max(10, (hoveredPoint.x / chartWidth) * 100))}%`,
                      top: hoveredPoint.y < chartHeight / 2 ? hoveredPoint.y + 15 : hoveredPoint.y - 50,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div>Move {Math.ceil(hoveredPoint.ply / 2)} {hoveredPoint.ply % 2 !== 0 ? '(W)' : '(B)'}</div>
                    <div className="font-bold text-white flex items-center justify-between gap-3">
                      <span>Score:</span>
                      <span className={hoveredPoint.evaluation.startsWith('-') ? 'text-red-400' : 'text-emerald-400'}>
                        {hoveredPoint.evaluation}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Chess Board & Move Details Side-by-Side */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Board Panel (Col Span 7) */}
              <div className="lg:col-span-7 flex flex-col gap-4 items-center">
                {/* Board Container */}
                <div className="w-full max-w-[480px] aspect-square rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950 p-2 relative">
                  <Chessboard
                    options={{
                      position: getActiveFen(),
                      boardOrientation: game.playerColor.toLowerCase() as 'white' | 'black',
                      allowDragging: false,
                      darkSquareStyle: { backgroundColor: '#2e2e33' },
                      lightSquareStyle: { backgroundColor: '#e4e4e7' },
                      squareStyles: getSquareStyles()
                    }}
                  />
                </div>

                {/* Ply selector buttons below board */}
                <div className="w-full max-w-[480px] flex justify-between items-center bg-zinc-950/40 border border-white/5 px-4 py-2 rounded-xl">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="p-1 h-7 w-7 rounded-lg border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                      disabled={activePlyIndex === 0}
                      onClick={() => {
                        setActivePlyIndex(0);
                        setShowBestMove(false);
                      }}
                    >
                      <ChevronLeft className="w-3.5 h-3.5 -mr-1" />
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="p-1 h-7 w-7 rounded-lg border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                      disabled={activePlyIndex === 0}
                      onClick={() => {
                        setActivePlyIndex(p => Math.max(0, p - 1));
                        setShowBestMove(false);
                      }}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <span className="font-mono text-[11px] font-bold text-zinc-400">
                    Ply {activePlyIndex} / {analysis.moveAnalyses.length}
                  </span>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="p-1 h-7 w-7 rounded-lg border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                      disabled={activePlyIndex === analysis.moveAnalyses.length}
                      onClick={() => {
                        setActivePlyIndex(p => Math.min(analysis.moveAnalyses.length, p + 1));
                        setShowBestMove(false);
                      }}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="p-1 h-7 w-7 rounded-lg border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                      disabled={activePlyIndex === analysis.moveAnalyses.length}
                      onClick={() => {
                        setActivePlyIndex(analysis.moveAnalyses.length);
                        setShowBestMove(false);
                      }}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                      <ChevronRight className="w-3.5 h-3.5 -ml-1" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right Move List & Selected Move Details (Col Span 5) */}
              <div className="lg:col-span-5 space-y-6 flex flex-col justify-start">
                {/* Active Annotated Move Detail Panel */}
                <Card className="bg-zinc-950/20 border-white/5 p-5 space-y-4 rounded-2xl shadow-lg text-left">
                  {activeMove ? (
                    <div className="space-y-4">
                      {/* Classification Header */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest">Selected Move</span>
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            Move {Math.ceil(activePlyIndex / 2)}{activePlyIndex % 2 !== 0 ? '. ' : '... '}{activeMove.san}
                          </h3>
                        </div>
                        <span className={`text-[10px] font-extrabold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${getClassificationBadgeClass(activeMove.classification)}`}>
                          {activeMove.classification}
                        </span>
                      </div>

                      {/* Coach comment and Details */}
                      <div className="space-y-3 pt-2 text-xs font-semibold text-zinc-500">
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span>Played Move:</span>
                          <span className="text-zinc-200 uppercase font-mono">{activeMove.uci}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b border-white/5">
                          <span>Evaluation:</span>
                          <span className="text-zinc-200 font-mono">{activeMove.evaluation}</span>
                        </div>
                        {activeMove.bestMove && (
                          <div className="flex justify-between py-1 border-b border-white/5">
                            <span>Recommended Best:</span>
                            <span className="text-blue-400 font-mono uppercase">{activeMove.bestMove}</span>
                          </div>
                        )}
                        <div className="py-2 text-xs font-normal text-zinc-300 italic leading-relaxed border-b border-white/5">
                          {activeMove.comment}
                        </div>
                      </div>

                      {/* Interactive Buttons for Mistake review */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        {activeMove.bestMove && (
                          <Button
                            variant={showBestMove ? 'primary' : 'outline'}
                            onClick={() => setShowBestMove(!showBestMove)}
                            className="text-[11px] font-bold py-1.5 rounded-xl flex items-center justify-center gap-1 border-white/5 cursor-pointer"
                          >
                            <Info className="w-3.5 h-3.5" />
                            {showBestMove ? 'Hide Best Move' : 'Show Best Move'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={handleJumpToNextError}
                          className="text-[11px] font-bold py-1.5 rounded-xl border-white/5 flex items-center justify-center gap-1 cursor-pointer text-yellow-400 hover:bg-yellow-500/10"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Next Mistake
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-zinc-500 font-light flex flex-col items-center gap-2">
                      <BookOpen className="w-8 h-8 text-zinc-700" strokeWidth={1.5} />
                      Select a move in the list to review Stockfish annotations, evaluations, and best move highlights.
                    </div>
                  )}
                </Card>

                {/* Move Sequence List */}
                <div className="space-y-3">
                  <h3 className="font-display font-semibold text-sm text-zinc-200">Match Moves</h3>
                  {renderMoveListTable()}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
