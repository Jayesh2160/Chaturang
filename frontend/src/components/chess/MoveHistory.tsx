import React, { useEffect, useRef } from 'react';
import { Move } from 'chess.js';
import { Copy, Download, History, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface MoveHistoryProps {
  history: Move[];
  currentPlyIndex: number;
  onJumpToPly: (index: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  pgn: string;
}

export const MoveHistory: React.FC<MoveHistoryProps> = React.memo(
  ({
    history,
    currentPlyIndex,
    onJumpToPly,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    pgn,
  }) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto scroll to latest move when history changes
    useEffect(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, [history.length]);

    // Format pairs (Move 1: White, Black)
    const moveRows = [];
    for (let i = 0; i < history.length; i += 2) {
      moveRows.push({
        moveNumber: Math.floor(i / 2) + 1,
        whitePlyIndex: i + 1,
        whiteMove: history[i],
        blackPlyIndex: i + 2,
        blackMove: history[i + 1] || null,
      });
    }

    const copyPgn = () => {
      navigator.clipboard.writeText(pgn);
      alert('PGN copied to clipboard!');
    };

    const downloadPgn = () => {
      const element = document.createElement('a');
      const file = new Blob([pgn], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `chaturang_match_${Date.now()}.pgn`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    };

    return (
      <div className="w-full flex flex-col gap-3 bg-zinc-950/60 border border-white/5 p-4 rounded-2xl text-left shadow-xl h-full min-h-[300px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="font-display font-semibold text-sm text-zinc-200">Move Log</h3>
          </div>
          <span className="text-[10px] bg-zinc-900 border border-white/5 px-2 py-0.5 rounded-full font-mono text-zinc-400">
            {history.length} plies
          </span>
        </div>

        {/* Navigation Bar (Undo/Redo & Step) */}
        <div className="flex items-center justify-between bg-zinc-900/60 border border-white/5 p-1 rounded-xl">
          <Button
            variant="outline"
            onClick={onUndo}
            disabled={!canUndo}
            className="flex-1 py-1.5 h-8 text-xs border-none"
            title="Step Back"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </Button>
          <span className="text-[10px] font-mono text-zinc-500 px-2">
            Ply {currentPlyIndex} / {history.length}
          </span>
          <Button
            variant="outline"
            onClick={onRedo}
            disabled={!canRedo}
            className="flex-1 py-1.5 h-8 text-xs border-none"
            title="Step Forward"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Move History Table */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto max-h-[320px] min-h-[160px] border border-white/5 rounded-xl bg-zinc-950/40 divide-y divide-white/5 text-xs font-mono"
        >
          {moveRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500 text-xs px-4">
              <p>No moves played yet.</p>
              <p className="text-[10px] text-zinc-600 mt-1">Make a move on the board to record plies.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="text-[10px] text-zinc-500 bg-zinc-900/30 uppercase font-bold tracking-wider sticky top-0 backdrop-blur-md">
                <tr>
                  <th className="px-3 py-2 w-10 text-center border-r border-white/5">#</th>
                  <th className="px-3 py-2">White</th>
                  <th className="px-3 py-2">Black</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {moveRows.map((row) => (
                  <tr key={row.moveNumber} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-1.5 text-center text-zinc-500 font-sans font-semibold border-r border-white/5">
                      {row.moveNumber}
                    </td>

                    {/* White Move */}
                    <td className="px-1 py-1">
                      <button
                        onClick={() => onJumpToPly(row.whitePlyIndex)}
                        className={`w-full text-left px-2 py-1 rounded transition-colors ${
                          currentPlyIndex === row.whitePlyIndex
                            ? 'bg-purple-600/30 text-purple-300 font-bold border border-purple-500/40'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        {row.whiteMove.san}
                      </button>
                    </td>

                    {/* Black Move */}
                    <td className="px-1 py-1">
                      {row.blackMove ? (
                        <button
                          onClick={() => onJumpToPly(row.blackPlyIndex)}
                          className={`w-full text-left px-2 py-1 rounded transition-colors ${
                            currentPlyIndex === row.blackPlyIndex
                              ? 'bg-purple-600/30 text-purple-300 font-bold border border-purple-500/40'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          {row.blackMove.san}
                        </button>
                      ) : (
                        <span className="text-zinc-600 font-sans italic px-2">...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* PGN Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="outline"
            onClick={copyPgn}
            disabled={history.length === 0}
            className="flex-1 py-1.5 h-8 text-[11px] text-zinc-300"
          >
            <Copy className="w-3 h-3" />
            Copy PGN
          </Button>

          <Button
            variant="outline"
            onClick={downloadPgn}
            disabled={history.length === 0}
            className="flex-1 py-1.5 h-8 text-[11px] text-zinc-300"
          >
            <Download className="w-3 h-3" />
            Export PGN
          </Button>
        </div>
      </div>
    );
  }
);

MoveHistory.displayName = 'MoveHistory';
