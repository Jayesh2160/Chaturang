import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ThreeChessboard } from '../components/ThreeChessboard';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  ChevronRight
} from 'lucide-react';

// Counter Component for Stats Section
const AnimatedCounter: React.FC<{ value: number; suffix?: string; prefix?: string }> = ({ value, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const [inView, setInView] = useState(false);
  const elementRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;

    let start = 0;
    const end = value;
    const duration = 2.0; // seconds
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      setCount(Math.floor(easeProgress * (end - start) + start));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [inView, value]);

  return (
    <div ref={elementRef} className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight">
      {prefix}{count.toLocaleString()}{suffix}
    </div>
  );
};

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeSection, setActiveSection] = useState('home');

  // Handle smooth scroll to elements
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
    }
  };

  // Scroll spy to update active section in navbar
  useEffect(() => {
    const sections = ['home', 'quote', 'learn', 'stats', 'timeline', 'features', 'testimonials', 'cta'];
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Framer Motion spring transition
  const springTransition = {
    type: 'spring' as const,
    stiffness: 100,
    damping: 15,
  };

  return (
    <div className="min-h-screen text-zinc-300 relative bg-[#030303] overflow-hidden font-sans">
      
      {/* Background System: Vignette + Grid + Purple Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.007)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.007)_1px,transparent_1px)] bg-[size:48px_48px] opacity-75" />
        
        {/* Ambient Top Purple Gradient highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] bg-gradient-to-b from-[#6d4aff]/8 to-transparent rounded-full filter blur-[120px] opacity-60" />
        
        {/* Vignette Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(3,3,3,0.95)_100%)]" />
      </div>

      {/* Floating Apple-Style Navigation Bar */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-5xl">
        <div className="backdrop-blur-md bg-zinc-950/40 border border-white/5 rounded-full px-6 py-3 flex justify-between items-center shadow-2xl">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('home')}>
            <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-zinc-200 to-zinc-550 flex items-center justify-center shadow-lg">
              <span className="font-display font-extrabold text-zinc-950 text-xs">Ch</span>
            </div>
            <span className="font-display font-bold text-xs tracking-wider text-white">Chaturang</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-widest text-zinc-400">
            {['HOME', 'ACADEMY', 'PLAY', 'ANALYSIS', 'ABOUT'].map((link) => {
              const sectionId = link === 'ABOUT' ? 'testimonials' : link.toLowerCase();
              const isActive = activeSection === sectionId || (link === 'ABOUT' && activeSection === 'testimonials');
              
              return (
                <button
                  key={link}
                  onClick={() => scrollToSection(sectionId)}
                  className={`hover:text-white transition-colors relative py-1 cursor-pointer tracking-widest ${
                    isActive ? 'text-white' : ''
                  }`}
                >
                  {link}
                  {isActive && (
                    <motion.span
                      layoutId="activeNavIndicator"
                      className="absolute bottom-0 left-0 w-full h-[1.5px] bg-white"
                      transition={springTransition}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Dynamic Sign In / Dashboard CTA */}
          <div>
            {isAuthenticated ? (
              <button 
                onClick={() => navigate('/dashboard')}
                className="px-4 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-all shadow-md shadow-white/5 cursor-pointer"
              >
                Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => navigate('/login')}
                  className="px-4 py-1.5 text-zinc-400 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="px-4 py-1.5 rounded-full bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-all shadow-md shadow-white/5 cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section id="home" className="min-h-screen max-w-6xl mx-auto px-6 flex flex-col md:grid md:grid-cols-12 items-center gap-12 pt-28 pb-12 z-10 relative">
        {/* Left Side: Typography Content */}
        <div className="md:col-span-6 flex flex-col justify-center space-y-10 text-left pt-8 md:pt-0">
          <div className="space-y-4">
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#6d4aff] uppercase block">
              CHESS REIMAGINED
            </span>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold font-display tracking-tight text-white leading-[1.05]">
              Master Chess.<br />
              Unravel Brilliance.
            </h1>
            
            {/* Minimalist, clean verb list */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-zinc-400 text-sm font-semibold tracking-wider">
              {['Learn.', 'Practice.', 'Analyze.', 'Improve.'].map((verb) => (
                <span key={verb} className="flex items-center gap-2">
                  <span className="h-1 w-1 bg-white/20 rounded-full" />
                  {verb}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => {
                if (isAuthenticated) navigate('/academy');
                else navigate('/login');
              }}
              className="px-8 py-3.5 rounded-lg bg-white text-zinc-950 font-bold text-xs tracking-widest hover:bg-zinc-200 transition-all duration-300 shadow-xl shadow-white/5 flex items-center gap-2 group cursor-pointer"
            >
              EXPLORE ACADEMY
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button 
              onClick={() => {
                if (isAuthenticated) navigate('/play');
                else navigate('/login');
              }}
              className="px-8 py-3.5 rounded-lg bg-zinc-900/60 border border-white/10 text-white font-bold text-xs tracking-widest hover:bg-zinc-800 transition-all duration-300 cursor-pointer"
            >
              PLAY CHESS
            </button>
          </div>

          {/* Apple-style subtle scroll down indicator */}
          <div 
            onClick={() => scrollToSection('quote')}
            className="pt-6 text-zinc-550 flex items-center gap-2 text-xs font-medium cursor-pointer hover:text-white transition-colors"
          >
            <span>↓ Scroll</span>
          </div>
        </div>

        {/* Right Side: Immersive 3D Chessboard */}
        <div className="md:col-span-6 w-full flex justify-center items-center relative aspect-square md:aspect-auto">
          {/* Outer glowing frame backing */}
          <div className="absolute inset-0 bg-[#6d4aff]/5 rounded-full filter blur-[100px] pointer-events-none" />
          
          <div className="w-full max-w-[500px] md:max-w-none h-[400px] md:h-[550px] relative z-10">
            <ThreeChessboard />
          </div>
        </div>
      </section>


      {/* --- SCROLL EXPERIENCE SECTIONS --- */}

      {/* --- QUOTE SECTION --- */}
      <section id="quote" className="py-32 border-t border-white/5 bg-zinc-950/20 relative z-10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-12"
          >
            {/* Styled Minimalist SVG King Outline */}
            <div className="w-24 h-24 mx-auto flex items-center justify-center text-white relative">
              <div className="absolute inset-0 bg-white/5 rounded-full filter blur-xl" />
              <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-full h-full text-zinc-100 opacity-90">
                <path d="M50 15v10M45 20h10" strokeLinecap="round"/>
                <path d="M38 32l12-8 12 8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M42 32c0 0-2 20-4 35c0 5 4 8 12 8s12-3 12-8c-2-15-4-35-4-35" strokeLinejoin="round"/>
                <path d="M40 40h20M39 48h22" strokeOpacity="0.4"/>
                <path d="M30 83h40l-2 5H32l-2-5z" fill="currentColor" fillOpacity="0.05" strokeLinejoin="round"/>
                <rect x="26" y="88" width="48" height="3" rx="1.5" fill="currentColor" fillOpacity="0.1"/>
              </svg>
            </div>

            <blockquote className="space-y-6">
              <p className="text-3xl sm:text-4xl md:text-5xl font-medium font-display tracking-tight text-white leading-tight italic max-w-3xl mx-auto">
                "Chess is not a game. It is the art of decision making."
              </p>
              <footer className="text-xs uppercase tracking-[0.25em] text-[#6d4aff] font-bold">
                Chaturang Philosophy
              </footer>
            </blockquote>
          </motion.div>
        </div>
      </section>


      {/* --- LEARN CHESS CARDS --- */}
      <section id="academy" className="py-32 border-t border-white/5 relative z-10">
        <div className="max-w-5xl mx-auto px-6 space-y-16">
          <div className="text-left space-y-3">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#6d4aff] uppercase">Structured Learning</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">Learn Chess</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                glyph: '♔',
                title: 'Chess Basics',
                desc: 'Start from zero. Master piece mechanics, baseline rules, board coordinates, and structural goals.',
                link: '/academy'
              },
              {
                glyph: '♘',
                title: 'Tactical Openings',
                desc: 'Develop patterns. Understand opening principles, central control, and initial tactical threats.',
                link: '/academy'
              },
              {
                glyph: '♕',
                title: 'Endgame Geometry',
                desc: 'Close the game. Study pawn promotion routes, opposition rules, and standard checkmate loops.',
                link: '/academy'
              }
            ].map((card, idx) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => {
                  if (isAuthenticated) navigate(card.link);
                  else navigate('/login');
                }}
                className="group backdrop-blur-md bg-zinc-950/20 border border-white/5 rounded-2xl p-8 hover:border-[#6d4aff]/30 transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[280px]"
              >
                <div className="space-y-6 text-left">
                  <div className="text-4xl text-zinc-100 font-display font-light group-hover:text-[#6d4aff] transition-colors">
                    {card.glyph}
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display font-bold text-white text-lg tracking-wide">{card.title}</h3>
                    <p className="text-zinc-400 text-xs leading-relaxed font-light">{card.desc}</p>
                  </div>
                </div>

                <div className="pt-6 flex items-center text-xs font-semibold text-white tracking-widest group-hover:text-[#6d4aff] transition-colors mt-auto">
                  <span>START FROM ZERO</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-1 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* --- STATISTICS SECTION --- */}
      <section id="stats" className="py-32 border-t border-white/5 bg-zinc-950/10 relative z-10">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-8 text-center">
            {[
              { value: 15000, suffix: '+', label: 'Players' },
              { value: 250000, suffix: '+', label: 'Games Played' },
              { value: 24, suffix: '', label: 'Lessons' },
              { value: 96, suffix: '%', label: 'Improvement Rate' }
            ].map((stat) => (
              <div key={stat.label} className="space-y-2">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                <div className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#6d4aff]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* --- TIMELINE ROADMAP --- */}
      <section id="timeline" className="py-32 border-t border-white/5 relative z-10">
        <div className="max-w-5xl mx-auto px-6 space-y-20">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#6d4aff] uppercase">Development Curve</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">Your Chess Roadmap</h2>
          </div>

          {/* Horizontal Timeline flow */}
          <div className="relative">
            {/* Background connection line */}
            <div className="absolute top-[26px] left-[10%] right-[10%] h-[1px] bg-white/10 hidden md:block" />

            <div className="grid grid-cols-1 md:grid-cols-5 gap-12 md:gap-4 relative text-center">
              {[
                { title: 'Learn', subtitle: 'Calibrate fundamentals and rules.', num: '01' },
                { title: 'Practice', subtitle: 'Solve ELO-targeted chess coordinates.', num: '02' },
                { title: 'Analyze', subtitle: 'Scan your blunder history.', num: '03' },
                { title: 'Improve', subtitle: 'Target exact categories.', num: '04' },
                { title: 'Compete', subtitle: 'Test metrics against live players.', num: '05' }
              ].map((step, idx) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: idx * 0.12, ease: 'easeOut' }}
                  className="space-y-4 flex flex-col items-center"
                >
                  {/* Circle Indicator */}
                  <div className="h-12 w-12 rounded-full border border-white/10 bg-zinc-950 flex items-center justify-center font-display font-bold text-xs text-white z-10 relative group hover:border-[#6d4aff]/40 transition-colors shadow-lg">
                    <span className="group-hover:text-[#6d4aff] transition-colors">{step.num}</span>
                  </div>

                  <div className="space-y-1.5 max-w-[160px]">
                    <h4 className="font-display font-bold text-white text-base tracking-wide">{step.title}</h4>
                    <p className="text-zinc-550 text-[11px] leading-relaxed font-light">{step.subtitle}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>


      {/* --- FEATURES SECTION --- */}
      <section id="features" className="py-32 border-t border-white/5 bg-zinc-950/20 relative z-10">
        <div className="max-w-5xl mx-auto px-6 space-y-16">
          <div className="text-left space-y-3">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#6d4aff] uppercase">Tactical Calibrator</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">Engine Capabilities</h2>
          </div>

          <div className="space-y-12">
            {[
              {
                tag: 'PATTERNS',
                title: 'Tactical Calibration',
                desc: 'Our engine parses played matches and automatically highlights recurring categories where you lose control. We build dynamic sets targeted precisely at your chess rating.',
                art: (
                  <svg viewBox="0 0 400 300" fill="none" className="w-full h-full text-zinc-600 max-h-[220px]">
                    <circle cx="200" cy="150" r="100" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 6" opacity="0.3"/>
                    <circle cx="200" cy="150" r="60" stroke="currentColor" strokeWidth="1" opacity="0.1"/>
                    <line x1="200" y1="20" x2="200" y2="280" stroke="currentColor" strokeWidth="0.8" opacity="0.1"/>
                    <line x1="50" y1="150" x2="350" y2="150" stroke="currentColor" strokeWidth="0.8" opacity="0.1"/>
                    {/* Glowing highlight nodes */}
                    <circle cx="200" cy="90" r="4" fill="#6d4aff"/>
                    <circle cx="200" cy="90" r="10" stroke="#6d4aff" strokeWidth="0.8" opacity="0.4"/>
                    <circle cx="260" cy="150" r="3" fill="#6d4aff" opacity="0.7"/>
                    {/* Connected path */}
                    <path d="M200 90 L260 150 L200 210 L140 150 Z" stroke="#6d4aff" strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>
                  </svg>
                )
              },
              {
                tag: 'REPLAY ENGINE',
                title: 'Step-by-Step Analysis',
                desc: 'Review matches ply by ply. Watch positions at your speed using sliders, move coordinate history logs, and instant pattern calibration overlays that feel light and clean.',
                art: (
                  <svg viewBox="0 0 400 300" fill="none" className="w-full h-full text-zinc-600 max-h-[220px]">
                    <rect x="100" y="50" width="200" height="200" rx="12" stroke="currentColor" strokeWidth="0.8" opacity="0.2"/>
                    <line x1="100" y1="180" x2="300" y2="180" stroke="currentColor" strokeWidth="0.8" opacity="0.1"/>
                    {/* Grid lines inside */}
                    <line x1="150" y1="50" x2="150" y2="250" stroke="currentColor" strokeWidth="0.8" opacity="0.05"/>
                    <line x1="200" y1="50" x2="200" y2="250" stroke="currentColor" strokeWidth="0.8" opacity="0.05"/>
                    <line x1="250" y1="50" x2="250" y2="250" stroke="currentColor" strokeWidth="0.8" opacity="0.05"/>
                    {/* Timeline line */}
                    <path d="M120 210 H280" stroke="currentColor" strokeWidth="1.5" opacity="0.3"/>
                    <circle cx="220" cy="210" r="5" fill="#ffffff"/>
                    <circle cx="220" cy="210" r="12" stroke="#ffffff" strokeWidth="0.8" opacity="0.3"/>
                    <circle cx="160" cy="210" r="3" fill="#6d4aff"/>
                    <circle cx="270" cy="210" r="3" fill="#6d4aff"/>
                  </svg>
                )
              }
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="backdrop-blur-md bg-zinc-950/20 border border-white/5 rounded-3xl p-8 sm:p-12 flex flex-col md:grid md:grid-cols-12 items-center gap-12 text-left"
              >
                <div className="md:col-span-7 space-y-6">
                  <span className="text-[10px] font-bold tracking-[0.25em] text-[#6d4aff] uppercase block">
                    {feature.tag}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm font-light leading-relaxed max-w-xl">
                    {feature.desc}
                  </p>
                </div>
                
                <div className="md:col-span-5 w-full flex justify-center items-center">
                  {feature.art}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* --- TESTIMONIALS (FAMOUS QUOTES) --- */}
      <section id="testimonials" className="py-32 border-t border-white/5 relative z-10">
        <div className="max-w-5xl mx-auto px-6 space-y-20">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#6d4aff] uppercase">Intellectual Heritage</span>
            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white">Chess Wisdom</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "The blunders are all there waiting to be made.",
                author: "Savielly Tartakower"
              },
              {
                quote: "Chess is the gymnasium of the mind.",
                author: "Blaise Pascal"
              },
              {
                quote: "Only the player who has command over himself can play Chess with success.",
                author: "Emanuel Lasker"
              }
            ].map((item, idx) => (
              <motion.div
                key={item.author}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8, delay: idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className="backdrop-blur-md bg-zinc-950/10 border border-white/5 rounded-2xl p-8 text-left flex flex-col justify-between"
              >
                <p className="text-zinc-300 text-sm font-light leading-relaxed italic">
                  "{item.quote}"
                </p>
                <div className="pt-6 border-t border-white/5 mt-6">
                  <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#6d4aff]">
                    — {item.author}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* --- CTA SECTION --- */}
      <section id="cta" className="py-36 border-t border-white/5 relative z-10">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-white/5 bg-gradient-to-b from-zinc-950/40 to-zinc-950/10 backdrop-blur-md p-12 sm:p-20 text-center space-y-10 relative overflow-hidden"
          >
            {/* Glowing spot light background */}
            <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#6d4aff]/5 rounded-full filter blur-[80px] pointer-events-none" />

            <div className="space-y-4 max-w-2xl mx-auto">
              <h2 className="text-4xl sm:text-5xl font-extrabold font-display text-white tracking-tight leading-tight">
                Ready to become a better chess player?
              </h2>
              <p className="text-zinc-400 text-sm font-light max-w-md mx-auto">
                Log played games, review precise tactical errors, and calibrate your rating curve.
              </p>
            </div>

            <div>
              <button 
                onClick={() => {
                  if (isAuthenticated) navigate('/academy');
                  else navigate('/register');
                }}
                className="px-10 py-4 rounded-lg bg-white text-zinc-950 font-bold text-xs tracking-widest hover:bg-zinc-200 transition-all duration-300 shadow-xl shadow-white/5 cursor-pointer inline-flex items-center gap-2 group"
              >
                START LEARNING
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t border-white/5 bg-zinc-950/50 py-16 z-10 relative text-xs text-zinc-550">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 text-left">
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-2 text-white">
              <div className="h-5 w-5 rounded bg-zinc-200 flex items-center justify-center">
                <span className="font-display font-extrabold text-zinc-950 text-[10px]">Ch</span>
              </div>
              <span className="font-display font-bold text-xs tracking-wider">Chaturang</span>
            </div>
            <p className="font-light max-w-sm text-zinc-400">
              Sleek, targeted chess blunder analysis and training platform designed to optimize your decision curve.
            </p>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-widest text-[9px]">Academy</h4>
            <ul className="space-y-2 font-light">
              <li><button onClick={() => navigate('/login')} className="hover:text-white cursor-pointer transition-colors">Tactical Pins</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-white cursor-pointer transition-colors">Sicilian Defence</button></li>
              <li><button onClick={() => navigate('/login')} className="hover:text-white cursor-pointer transition-colors">Endgame Opposition</button></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-3">
            <h4 className="font-bold text-white uppercase tracking-widest text-[9px]">Account</h4>
            <ul className="space-y-2 font-light">
              <li><button onClick={() => navigate('/login')} className="hover:text-white cursor-pointer transition-colors">Sign In</button></li>
              <li><button onClick={() => navigate('/register')} className="hover:text-white cursor-pointer transition-colors">Register Profile</button></li>
            </ul>
          </div>

          <div className="md:col-span-12 pt-8 text-center text-[10px] text-zinc-600 font-light border-t border-white/5">
            © {new Date().getFullYear()} Chaturang Chess Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
