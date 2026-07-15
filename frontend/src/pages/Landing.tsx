import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { 
  Shield, 
  Target, 
  Layers, 
  ArrowRight 
} from 'lucide-react';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen text-zinc-300 relative flex flex-col justify-between overflow-hidden">
      {/* Top Header/Logo Area for Unauthenticated Users */}
      <div className="max-w-5xl w-full mx-auto px-6 py-6 flex justify-between items-center z-10">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-gradient-to-tr from-violet-600 to-sky-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="font-display font-extrabold text-white text-xs">Ch</span>
          </div>
          <span className="font-display font-bold text-sm tracking-wider text-white">Chaturang</span>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/login')}
            className="text-zinc-400 hover:text-white"
          >
            Sign In
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={() => navigate('/register')}
          >
            Register
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <section className="max-w-5xl w-full mx-auto px-6 pt-16 md:pt-24 pb-20 grid grid-cols-1 md:grid-cols-12 gap-12 items-center z-10">
        <div className="md:col-span-7 text-left space-y-8 animate-fade-in">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/5 bg-zinc-900/40 text-[10px] uppercase font-bold tracking-widest text-brand-accent shadow-md">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-accent animate-pulse" />
              Advanced Tactical Calibration
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display tracking-tight text-white leading-[1.05]">
              Master Chess.<br />
              Unravel Your <span className="text-zinc-550">Blunders</span>.
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base md:text-lg leading-relaxed max-w-xl font-light">
              Chaturang parses your chess records, isolates recurring patterns in your mistakes, and dynamically suggests tactical materials for your exact ELO rating.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              variant="primary" 
              onClick={() => navigate('/register')}
              className="px-8 py-3 bg-white text-zinc-950 font-bold tracking-wider hover:bg-zinc-200"
            >
              Start Free Journey
              <ArrowRight className="ml-2 w-4 h-4" strokeWidth={1.5} />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')}
              className="px-8 py-3"
            >
              Analyze Existing Games
            </Button>
          </div>
        </div>

        {/* Abstract Chess Vector Graphic (Linear/Porsche Design Style) */}
        <div className="md:col-span-5 flex justify-center items-center animate-fade-in delay-100">
          <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
            {/* Ambient Background Circle */}
            <div className="absolute inset-0 bg-brand-accent/5 rounded-full filter blur-3xl" />
            
            {/* Geometric SVG illustration */}
            <svg 
              viewBox="0 0 200 200" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-full h-full max-h-[300px] text-white opacity-80"
            >
              {/* Radial grid circles */}
              <circle cx="100" cy="100" r="80" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" strokeDasharray="3 3" />
              <circle cx="100" cy="100" r="60" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
              <circle cx="100" cy="100" r="40" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" strokeDasharray="5 5" />
              
              {/* Abstract tactical line grids */}
              <line x1="20" y1="100" x2="180" y2="100" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              <line x1="100" y1="20" x2="100" y2="180" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              <line x1="43.4" y1="43.4" x2="156.6" y2="156.6" stroke="rgba(255, 255, 255, 0.02)" strokeWidth="1" strokeDasharray="2 2" />

              {/* Glowing highlight indicator */}
              <circle cx="140" cy="60" r="6" fill="#6d4aff" fillOpacity="0.4" />
              <circle cx="140" cy="60" r="2" fill="#6d4aff" />
              <line x1="100" y1="100" x2="140" y2="60" stroke="#6d4aff" strokeWidth="1.5" strokeOpacity="0.6" strokeDasharray="2 2" />

              {/* Minimalist Abstract Chess Piece (King outline) */}
              {/* Crown cross */}
              <path d="M100 58 V66 M96 62 H104" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" strokeLinecap="round" />
              {/* Crown Head */}
              <path d="M88 74 L94 68 L100 72 L106 68 L112 74" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* Body */}
              <path d="M92 74 C92 74 90 98 88 120 C88 126 94 130 100 130 C106 130 112 126 112 120 C110 98 108 74 108 74" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" strokeLinejoin="round" />
              {/* Neck ring */}
              <path d="M91 80 H109" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
              <path d="M90 86 H110" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1.5" />
              {/* Base */}
              <path d="M84 136 H116 L114 142 H86 L84 136 Z" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1.5" strokeLinejoin="round" />
              <rect x="80" y="142" width="40" height="4" rx="1" fill="rgba(255, 255, 255, 0.1)" stroke="rgba(255, 255, 255, 0.6)" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </section>

      {/* Trusted Features Grid */}
      <section className="border-t border-white/5 bg-zinc-950/20 py-24 z-10">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          <div className="text-left space-y-2 max-w-lg">
            <h2 className="text-xs uppercase font-bold tracking-widest text-brand-accent">Precision Driven</h2>
            <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">Engineered for Fast Progress</h3>
            <p className="text-zinc-400 text-sm font-light">We focus purely on parsing patterns, removing gaming distractions, and optimizing performance statistics.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-zinc-900/10 border-white/5 space-y-4 hover:border-white/10 transition-all text-left">
              <div className="p-2.5 bg-white/5 rounded-lg w-fit text-white">
                <Target className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h4 className="font-display font-semibold text-white text-base">Pattern Isolation</h4>
              <p className="text-zinc-400 text-xs leading-relaxed font-light">Our system parses games to isolate repeating tactical themes where you consistently lose material or match initiative.</p>
            </Card>

            <Card className="p-6 bg-zinc-900/10 border-white/5 space-y-4 hover:border-white/10 transition-all text-left">
              <div className="p-2.5 bg-white/5 rounded-lg w-fit text-white">
                <Layers className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h4 className="font-display font-semibold text-white text-base">ELO Tailored Academy</h4>
              <p className="text-zinc-400 text-xs leading-relaxed font-light">Access structured study files, coordinate drills, and basic tactics, calibrated for your exact approximate chess rating.</p>
            </Card>

            <Card className="p-6 bg-zinc-900/10 border-white/5 space-y-4 hover:border-white/10 transition-all text-left">
              <div className="p-2.5 bg-white/5 rounded-lg w-fit text-white">
                <Shield className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <h4 className="font-display font-semibold text-white text-base">Local Board Validation</h4>
              <p className="text-zinc-400 text-xs leading-relaxed font-light">Practice move combinations, analyze target positions in real time, and securely save profile game history.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* How Chaturang Works */}
      <section className="border-t border-white/5 py-24 z-10">
        <div className="max-w-5xl mx-auto px-6 space-y-16">
          <div className="text-left space-y-2">
            <h2 className="text-xs uppercase font-bold tracking-widest text-brand-accent">Seamless Pipeline</h2>
            <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">How Chaturang Works</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative text-left">
            <div className="space-y-4 relative">
              <div className="text-6xl font-extrabold font-display text-zinc-900 select-none">01</div>
              <h4 className="font-display font-semibold text-white text-base">Register Profile</h4>
              <p className="text-zinc-400 text-xs leading-relaxed font-light">
                Calibrate your account rating from 100 to 3500 ELO to establish study baselines.
              </p>
            </div>

            <div className="space-y-4 relative">
              <div className="text-6xl font-extrabold font-display text-zinc-900 select-none">02</div>
              <h4 className="font-display font-semibold text-white text-base">Play & Study</h4>
              <p className="text-zinc-400 text-xs leading-relaxed font-light">
                Complete modules across basics, middlegames, strategies, or openings, and practice positions.
              </p>
            </div>

            <div className="space-y-4 relative">
              <div className="text-6xl font-extrabold font-display text-zinc-900 select-none">03</div>
              <h4 className="font-display font-semibold text-white text-base">Save & Audit</h4>
              <p className="text-zinc-400 text-xs leading-relaxed font-light">
                Save played matches directly to your profile, review exact moves using the timeline replay panel.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chess Academy Preview */}
      <section className="border-t border-white/5 bg-zinc-950/20 py-24 z-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center text-left">
          <div className="md:col-span-5 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xs uppercase font-bold tracking-widest text-brand-accent">Structured Learning</h2>
              <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">Apple Books-Style Chess Academy</h3>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-light">
              Ditch heavy tutorials. Chaturang organises lessons into clean, visual files covering tactical forks, pins, endgame geometry, and common opening coordinates, keeping reading light and formatting sharp.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
              Explore Academy Modules
            </Button>
          </div>

          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 bg-zinc-900/10 border-white/5 text-left">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Tactics</span>
              <h4 className="font-display font-bold text-white text-sm mt-1 mb-2">Tactical Pin Exercises</h4>
              <p className="text-zinc-400 text-xs font-light leading-relaxed">Study relative and absolute pinning mechanics to restrict opponent pieces.</p>
            </Card>

            <Card className="p-5 bg-zinc-900/10 border-white/5 text-left">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Openings</span>
              <h4 className="font-display font-bold text-white text-sm mt-1 mb-2">The Sicilian Defence</h4>
              <p className="text-zinc-400 text-xs font-light leading-relaxed">Master standard coordinates in the Open Sicilian to control central files early.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Game Analysis Preview */}
      <section className="border-t border-white/5 py-24 z-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center text-left">
          <div className="md:col-span-7 bg-zinc-950 border border-white/5 rounded-2xl p-4 shadow-xl flex gap-4">
            {/* Visual Representation of Replay Board */}
            <div className="w-1/2 aspect-square bg-zinc-900 rounded-lg flex items-center justify-center text-zinc-700 text-xs border border-white/5 font-mono">
              [Board Replayer]
            </div>
            <div className="flex-1 space-y-3 font-mono text-[10px] text-zinc-500">
              <div className="font-semibold text-zinc-400 uppercase tracking-wider text-[8px] pb-1 border-b border-white/5">Moves Timeline</div>
              <div className="flex justify-between py-1 border-b border-white/5 text-zinc-300">
                <span>1. e4</span>
                <span>e5</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>2. Nf3</span>
                <span>Nc6</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span>3. Bb5</span>
                <span>a6</span>
              </div>
              <div className="text-[8px] text-brand-accent pt-1">Active Ply: 6</div>
            </div>
          </div>

          <div className="md:col-span-5 space-y-6">
            <div className="space-y-2">
              <h2 className="text-xs uppercase font-bold tracking-widest text-brand-accent">Interactive Timeline</h2>
              <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">Step-by-Step Game Replay</h3>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed font-light">
              Review saved matches ply by ply. Study positions at your own speed using interactive sliders, next/prev step controls, and monospaced move records.
            </p>
            <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
              View Game Analyzer
            </Button>
          </div>
        </div>
      </section>

      {/* Call To Action & Footer */}
      <section className="border-t border-white/5 bg-zinc-950/20 py-24 z-10 text-center space-y-12">
        <div className="max-w-xl mx-auto px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display text-white tracking-tight leading-tight">
            Ready to calibrate your game strategy?
          </h2>
          <p className="text-zinc-400 text-sm font-light">
            Create an account in minutes. Input your rating, complete lessons, and start logging tactical outcomes.
          </p>
          <Button 
            variant="primary" 
            onClick={() => navigate('/register')}
            className="px-8 py-3 bg-white text-zinc-950 font-bold tracking-wider hover:bg-zinc-200"
          >
            Create Your Account
          </Button>
        </div>

        <div className="max-w-5xl mx-auto px-6 pt-16 border-t border-white/5 grid grid-cols-1 md:grid-cols-12 gap-8 text-left text-xs text-zinc-500">
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2 text-zinc-300">
              <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-violet-600 to-sky-400 flex items-center justify-center">
                <span className="font-display font-extrabold text-white text-[10px]">Ch</span>
              </div>
              <span className="font-display font-bold text-xs tracking-wider text-white">Chaturang</span>
            </div>
            <p className="font-light max-w-sm">
              Sleek, targeted chess blunder analysis and training platform for players of all levels.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2">
            <h4 className="font-bold text-zinc-300 uppercase tracking-widest text-[9px]">Academy</h4>
            <ul className="space-y-1.5 font-light">
              <li><span className="hover:text-zinc-300 cursor-pointer">Tactical Pins</span></li>
              <li><span className="hover:text-zinc-300 cursor-pointer">Sicilian Defence</span></li>
              <li><span className="hover:text-zinc-300 cursor-pointer">Endgame Opposition</span></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-2">
            <h4 className="font-bold text-zinc-300 uppercase tracking-widest text-[9px]">Account</h4>
            <ul className="space-y-1.5 font-light">
              <li><span onClick={() => navigate('/login')} className="hover:text-zinc-300 cursor-pointer">Sign In</span></li>
              <li><span onClick={() => navigate('/register')} className="hover:text-zinc-300 cursor-pointer">Register Profile</span></li>
            </ul>
          </div>

          <div className="md:col-span-12 pt-8 text-center text-[10px] text-zinc-600 font-light">
            © {new Date().getFullYear()} Chaturang Chess Platform. All rights reserved.
          </div>
        </div>
      </section>
    </div>
  );
};
