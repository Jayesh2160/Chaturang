import React, { useState } from 'react';
import { Copy, Check, MessageSquare, Handshake, Flag, RefreshCw } from 'lucide-react';
import type { OnlineConnectionStatus, OnlinePlayerProfile } from '../../types/online';

interface OnlineGameBannerProps {
  status: OnlineConnectionStatus;
  roomCode: string;
  opponent: OnlinePlayerProfile | null;
  onSendChat: (message: string, isEmoji?: boolean) => void;
  onOfferDraw: () => void;
  onResign: () => void;
  onRematch?: () => void;
  isGameOver?: boolean;
  incomingDrawOffer?: boolean;
  onAcceptDraw?: () => void;
  onDeclineDraw?: () => void;
  lastChatMessage?: { sender: string; text: string } | null;
}

export const OnlineGameBanner: React.FC<OnlineGameBannerProps> = ({
  status,
  roomCode,
  opponent,
  onSendChat,
  onOfferDraw,
  onResign,
  onRematch,
  isGameOver,
  incomingDrawOffer,
  onAcceptDraw,
  onDeclineDraw,
  lastChatMessage,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/play?gameMode=ONLINE&room=${roomCode}&role=guest`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const emojis = ['👋', '🔥', '👏', '😮', '🧠', '⚡', '😎', '🤝'];

  return (
    <div className="w-full space-y-2">
      {/* Main Connection & Room Bar */}
      <div className="w-full py-2.5 px-4 rounded-2xl bg-zinc-950/80 border border-purple-500/20 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs shadow-lg">
        {/* Left: Status & Opponent info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                status === 'CONNECTED'
                  ? 'bg-emerald-400 animate-pulse'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="font-semibold text-zinc-200">
              {status === 'CONNECTED' ? (
                <>Live Match vs <span className="text-purple-300 font-bold">{opponent?.name || 'Opponent'}</span></>
              ) : status === 'WAITING_FOR_OPPONENT' ? (
                'Waiting for friend to join...'
              ) : (
                'Connecting to game room...'
              )}
            </span>
          </div>

          {/* Room Code Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-white/10 font-mono text-[11px] text-zinc-300">
            <span className="text-zinc-500">Room:</span>
            <span className="font-bold text-white tracking-wider">{roomCode}</span>
            <button
              type="button"
              onClick={handleCopyLink}
              title="Copy Invite Link"
              className="ml-1 text-zinc-400 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Right: Quick In-Game Online Actions */}
        <div className="flex items-center gap-2">
          {/* Reaction / Quick Chat Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 flex items-center gap-1.5 transition-colors font-medium text-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
              Reactions
            </button>

            {/* Quick Emoji Menu */}
            {showEmojiPicker && (
              <div className="absolute right-0 top-9 z-30 p-2 bg-zinc-900 border border-purple-500/30 rounded-xl shadow-xl flex items-center gap-1.5 animate-scale-in">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onSendChat(emoji, true);
                      setShowEmojiPicker(false);
                    }}
                    className="p-1 text-base hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Draw Offer Button */}
          {!isGameOver && (
            <>
              <button
                type="button"
                onClick={onOfferDraw}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-zinc-300 flex items-center gap-1.5 transition-colors font-medium text-xs"
              >
                <Handshake className="w-3.5 h-3.5 text-amber-400" />
                Offer Draw
              </button>

              <button
                type="button"
                onClick={onResign}
                className="px-2.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/40 hover:text-red-400 border border-white/5 text-zinc-400 flex items-center gap-1.5 transition-colors font-medium text-xs"
              >
                <Flag className="w-3.5 h-3.5" />
                Resign
              </button>
            </>
          )}

          {/* Rematch Button on Game Over */}
          {isGameOver && onRematch && (
            <button
              type="button"
              onClick={onRematch}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white flex items-center gap-1.5 transition-colors font-semibold text-xs shadow-md shadow-purple-900/30"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Request Rematch
            </button>
          )}
        </div>
      </div>

      {/* Floating Incoming Chat / Reaction Toast */}
      {lastChatMessage && (
        <div className="w-max max-w-sm px-3 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-200 text-xs flex items-center gap-2 shadow-lg animate-fade-in">
          <span className="font-bold text-white">{lastChatMessage.sender}:</span>
          <span>{lastChatMessage.text}</span>
        </div>
      )}

      {/* Incoming Draw Offer Banner */}
      {incomingDrawOffer && (
        <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-center justify-between gap-3 text-xs animate-slide-up">
          <div className="flex items-center gap-2 text-amber-200">
            <Handshake className="w-4 h-4 text-amber-400" />
            <span>Opponent has offered a draw. Accept?</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onAcceptDraw}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={onDeclineDraw}
              className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
