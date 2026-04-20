import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ChevronRight, ExternalLink, MapPin, Clock, Info } from 'lucide-react';

// --- COMPONENTE DEL FUEGO (CANVAS) ---
const FireCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    let flames = [];
    let embers = [];
    let t = 0;
    let eTimer = 0;

    const sn = (x) => Math.sin(x * 1.73) * 0.5 + Math.sin(x * 3.07 + 1.2) * 0.3 + Math.sin(x * 0.91 + 2.4) * 0.2;

    const mkFlame = (x, baseY, intensity) => {
      const sz = 12 + Math.random() * intensity * 44;
      return {
        x: x + (Math.random() - 0.5) * intensity * 58,
        y: baseY + Math.random() * 6,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(1.2 + Math.random() * intensity * 6.0), // Velocidad vertical aumentada
        size: sz,
        life: 1,
        decay: 0.0035 + Math.random() * 0.008, // Decadencia reducida para que vivan más tiempo y suban más
        phase: Math.random() * Math.PI * 2,
        wAmp: 5 + Math.random() * 16,
        wFreq: 1.4 + Math.random() * 2.8,
        core: Math.random() < 0.28
      };
    };

    const mkEmber = (x, y) => {
      const spd = 0.7 + Math.random() * 3.5;
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      return {
        x: x, y: y,
        vx: Math.cos(ang) * spd + (Math.random() - 0.5) * 1.1,
        vy: Math.sin(ang) * spd - 0.4,
        life: 1, decay: 0.0022 + Math.random() * 0.0058,
        size: 0.7 + Math.random() * 2.3, bright: Math.random() < 0.55,
        tx: (Math.random() - 0.5) * 0.055
      };
    };

    const N = 30;
    const sources = [];
    for (let i = 0; i < N; i++) {
      const f = i / (N - 1);
      const profile = 0.42 + 0.58 * Math.pow(Math.sin(f * Math.PI), 0.6);
      sources.push({
        frac: f,
        base: profile * (0.68 + Math.random() * 0.32),
        phase: Math.random() * Math.PI * 2,
        fr: 0.7 + Math.random() * 1.5,
        sr: 0.5 + Math.random() * 0.5
      });
    }

    const drawFlame = (p) => {
      const wobX = Math.sin(p.phase + t * p.wFreq) * p.wAmp * (1 - p.life);
      const cx = p.x + wobX;
      const cy = p.y;
      const r = p.size * p.life * 1.2;
      if (r < 0.5) return;
      const a = p.life;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      if (p.core) {
        g.addColorStop(0,    `rgba(255,255,215,${(a * 0.95).toFixed(2)})`);
        g.addColorStop(0.15, `rgba(255,245,110,${(a * 0.88).toFixed(2)})`);
        g.addColorStop(0.38, `rgba(255,155,15,${(a * 0.76).toFixed(2)})`);
        g.addColorStop(0.65, `rgba(205,45,0,${(a * 0.52).toFixed(2)})`);
        g.addColorStop(1,    'rgba(100,5,0,0)');
      } else if (a > 0.55) {
        g.addColorStop(0,    `rgba(255,175,25,${(a * 0.80).toFixed(2)})`);
        g.addColorStop(0.28, `rgba(255,95,0,${(a * 0.72).toFixed(2)})`);
        g.addColorStop(0.58, `rgba(185,28,0,${(a * 0.54).toFixed(2)})`);
        g.addColorStop(1,    'rgba(75,5,0,0)');
      } else {
        g.addColorStop(0,    `rgba(220,70,0,${(a * 0.68).toFixed(2)})`);
        g.addColorStop(0.42, `rgba(150,18,0,${(a * 0.46).toFixed(2)})`);
        g.addColorStop(1,    'rgba(40,0,0,0)');
      }
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    };

    const drawEmber = (e) => {
      const a = e.life;
      if (e.bright) {
        const hr = e.size * 5.5;
        const hg = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, hr);
        hg.addColorStop(0,   `rgba(255,210,55,${(a * 0.72).toFixed(2)})`);
        hg.addColorStop(0.45,`rgba(255,115,0,${(a * 0.28).toFixed(2)})`);
        hg.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(e.x, e.y, hr, 0, Math.PI * 2);
        ctx.fillStyle = hg; ctx.fill();
      }
      const rg = Math.floor(120 + Math.random() * 100);
      ctx.beginPath(); ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${rg},15,${a.toFixed(2)})`;
      ctx.fill();
    };

    const tick = () => {
      animationFrameId = requestAnimationFrame(tick);
      t += 0.016; eTimer += 0.016;
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      for (let s = 0; s < sources.length; s++) {
        const src = sources[s];
        const flicker = 0.62 + 0.38 * sn(t * src.fr + src.phase);
        const intensity = src.base * flicker;
        const x = src.frac * W;

        if (Math.random() < src.sr * intensity * 1.6) {
          flames.push(mkFlame(x, H, intensity));
          if (Math.random() < 0.48) flames.push(mkFlame(x + (Math.random()-0.5)*55, H, intensity * 0.62));
          if (Math.random() < 0.22) flames.push(mkFlame(x + (Math.random()-0.5)*85, H, intensity * 0.38));
        }
        if (eTimer > 0.065 && Math.random() < intensity * 0.20) {
          const tipY = H - intensity * H * 0.62 + Math.random() * 45;
          embers.push(mkEmber(x + (Math.random()-0.5)*38, tipY));
        }
      }

      if (Math.random() < 0.40) embers.push(mkEmber(Math.random() * W, H * 0.52 + Math.random() * H * 0.44));
      if (eTimer > 0.065) eTimer = 0;

      ctx.globalCompositeOperation = 'screen';

      for (let fi = flames.length - 1; fi >= 0; fi--) {
        const p = flames[fi];
        p.life -= p.decay;
        if (p.life <= 0) { flames.splice(fi, 1); continue; }
        p.y += p.vy; p.vy *= 0.993;
        p.x += p.vx + sn(t * 2.1 + p.phase) * 0.4;
        drawFlame(p);
      }

      for (let ei = embers.length - 1; ei >= 0; ei--) {
        const e = embers[ei];
        e.life -= e.decay;
        if (e.life <= 0 || e.y < -40) { embers.splice(ei, 1); continue; }
        e.x += e.vx + Math.sin(t * 1.6 + ei * 0.37) * 0.22;
        e.y += e.vy; e.vy -= 0.018;
        e.vx += e.tx; e.vx *= 0.993;
        drawEmber(e);
      }

      ctx.globalCompositeOperation = 'source-over';
      if (flames.length > 1100) flames.splice(0, flames.length - 1100);
      if (embers.length > 450)  embers.splice(0, embers.length - 450);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Altura del canvas aumentada usando vh (viewport height) para ser responsivo
  return <canvas ref={canvasRef} className="absolute bottom-0 left-0 w-full h-[65vh] min-h-[500px] z-0 pointer-events-none" />;
};

// --- APLICACIÓN PRINCIPAL ---
export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCookies, setShowCookies] = useState(true);
  const [showPolicy, setShowPolicy] = useState(false); // Nuevo estado para la política

  // Intentar leer si ya se aceptaron las cookies al cargar
  useEffect(() => {
    const cookiesAccepted = localStorage.getItem('cookiesAccepted_iws');
    if (cookiesAccepted) {
      setShowCookies(false);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookiesAccepted_iws', 'true');
    setShowCookies(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0805] text-[#F5EFE0] font-raleway overflow-x-hidden selection:bg-[#FF6B00] selection:text-white">
      
      {/* --- ESTILOS GLOBALES E IMPORTACIÓN DE FUENTES --- */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Raleway:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
        
        .font-cinzel { font-family: 'Cinzel Decorative', serif; }
        .font-raleway { font-family: 'Raleway', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }

        .text-gradient-gold-orange {
          background: linear-gradient(135deg, #FFB300, #FF6B00);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-title {
          background: linear-gradient(160deg, #FFE066 0%, #FFB300 30%, #FF6B00 60%, #CC2200 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: glow-pulse 3s ease-in-out infinite alternate;
        }

        @keyframes glow-pulse {
          0% { filter: brightness(1) drop-shadow(0 0 20px rgba(255,107,0,0.4)); }
          100% { filter: brightness(1.15) drop-shadow(0 0 45px rgba(255,179,0,0.65)); }
        }

        .hero-bg {
          background: radial-gradient(ellipse 80% 60% at 50% 85%, rgba(180,30,0,0.28) 0%, transparent 70%), #0A0805;
        }

        .hero-subtitle::before, .hero-subtitle::after {
          content: ''; display: block; width: 40px; height: 1px; background: #FFB300; opacity: 0.6;
        }

        .reflection-card::before {
          content: '\\201C'; position: absolute; top: -0.5rem; left: 1rem;
          font-family: 'Playfair Display', serif; font-size: 8rem; line-height: 1;
          color: rgba(255,179,0,0.07); pointer-events: none;
        }
      `}} />

      {/* --- NAVEGACIÓN --- */}
      <nav className="fixed w-full z-50 bg-gradient-to-b from-[#0A0805]/95 to-transparent backdrop-blur-sm px-6 lg:px-12 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="font-cinzel text-xl font-bold tracking-wider text-gradient-gold-orange cursor-pointer">
            FireGeneration
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#reflexion" className="text-[#B09070] hover:text-[#FFB300] font-semibold text-xs tracking-widest uppercase transition-colors">Reflexión</a>
            <a href="#nosotros" className="text-[#B09070] hover:text-[#FFB300] font-semibold text-xs tracking-widest uppercase transition-colors">Nosotros</a>
            <a href="#actividades" className="text-[#B09070] hover:text-[#FFB300] font-semibold text-xs tracking-widest uppercase transition-colors">Actividades</a>
            <a href="#contacto" className="text-[#B09070] hover:text-[#FFB300] font-semibold text-xs tracking-widest uppercase transition-colors">Contacto</a>
            {/* Link a la página de la iglesia */}
            <a href="https://wesleyansuba.org" target="_blank" rel="noopener noreferrer" 
               className="ml-4 px-4 py-2 flex items-center gap-2 border border-[#4DB8E8]/30 rounded-full text-[#4DB8E8] hover:bg-[#4DB8E8]/10 text-xs font-bold uppercase tracking-widest transition-all">
              IWS Principal <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-[#B09070] hover:text-white">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#0A0805] border-b border-[#FF6B00]/20 pb-4 shadow-2xl">
            <div className="flex flex-col px-6 space-y-4 pt-4">
              <a href="#reflexion" onClick={() => setIsMenuOpen(false)} className="text-[#B09070] font-semibold text-sm tracking-widest uppercase">Reflexión</a>
              <a href="#nosotros" onClick={() => setIsMenuOpen(false)} className="text-[#B09070] font-semibold text-sm tracking-widest uppercase">Nosotros</a>
              <a href="#actividades" onClick={() => setIsMenuOpen(false)} className="text-[#B09070] font-semibold text-sm tracking-widest uppercase">Actividades</a>
              <a href="#contacto" onClick={() => setIsMenuOpen(false)} className="text-[#B09070] font-semibold text-sm tracking-widest uppercase">Contacto</a>
              <a href="https://wesleyansuba.org" target="_blank" rel="noopener noreferrer" className="text-[#4DB8E8] flex items-center gap-2 font-semibold text-sm tracking-widest uppercase pt-2 border-t border-zinc-800">
                WesleyanSuba.org <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col justify-center items-center text-center overflow-hidden pt-24 pb-16 hero-bg">
        <FireCanvas />
        
        <div className="relative z-10 px-4 mt-8">
          <p className="hero-subtitle text-xs tracking-[0.3em] uppercase text-[#FFB300] font-semibold mb-6 flex items-center justify-center gap-4">
            Iglesia Wesleyana Suba
          </p>
          <h1 className="hero-title font-cinzel text-5xl md:text-7xl lg:text-8xl font-black leading-none mb-4">
            Fire<br />Generation
          </h1>
          <p className="font-playfair italic text-lg md:text-2xl text-[#F5EFE0]/80 mb-10">
            Una generación encendida por el Espíritu
          </p>
          
          <div className="max-w-md mx-auto mb-12 bg-[#0A0805]/20 backdrop-blur-sm p-6 rounded-xl border border-[#FFB300]/20 shadow-xl">
            <p className="text-[#F5EFE0] text-sm md:text-base leading-relaxed italic drop-shadow-md font-medium">
              "No dejes que nadie te menosprecie por ser joven, sino sé un ejemplo para los creyentes en palabra, conducta, amor, fe y pureza."
            </p>
            <cite className="block mt-3 text-[#FFB300] not-italic text-sm font-bold tracking-wider">
              — 1 Timoteo 4:12
            </cite>
          </div>

          <a href="#reflexion" className="inline-block px-10 py-4 bg-gradient-to-br from-[#FF6B00]/60 to-[#CC2200]/60 backdrop-blur-md border border-[#FF6B00]/40 text-white font-bold text-sm tracking-[0.15em] uppercase rounded-sm shadow-[0_4px_20px_rgba(204,34,0,0.3)] hover:shadow-[0_8px_30px_rgba(255,107,0,0.5)] hover:from-[#FF6B00]/80 hover:to-[#CC2200]/80 hover:-translate-y-1 transition-all duration-300">
            Reflexión de la semana
          </a>
        </div>

        <div className="absolute bottom-0 w-full z-20 py-3 bg-[#0A0805]/80 backdrop-blur-sm border-t border-[#FFB300]/15 flex justify-center items-center gap-3">
          <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-[#4DB8E8] font-semibold">Lugar de <strong className="text-white">Provisión</strong> y Crecimiento</span>
          <span className="text-white/20">|</span>
          <span className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-[#4DB8E8] font-semibold">Iglesia Wesleyana Suba</span>
        </div>
      </section>

      {/* --- SECCIÓN: REFLEXIÓN --- */}
      <section id="reflexion" className="py-24 px-6 relative bg-gradient-to-br from-[#150F07] to-[#1A0D00] border-y border-[#FF6B00]/15">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#FF6B00] font-bold mb-3">Conectando con Dios</p>
            <h2 className="font-cinzel text-3xl md:text-5xl font-bold text-gradient-gold-orange mb-6 leading-tight">Palabra<br/>de Vida</h2>
            <div className="w-16 h-0.5 bg-gradient-to-r from-[#FF6B00] to-[#FFB300] mb-6"></div>
            <p className="text-[#F5EFE0]/70 leading-relaxed text-base">
              Compartimos una palabra que enciende nuestra fe y nos recuerda que somos parte de algo más grande. No estás solo en este camino — somos una generación que arde con propósito.
            </p>
          </div>

          <div className="reflection-card bg-white/5 border border-[#FFB300]/20 rounded p-8 md:p-10 relative">
            <p className="text-xs tracking-[0.25em] uppercase text-[#FFB300] font-bold mb-2">Reflexión Destacada</p>
            <h3 className="font-playfair text-2xl md:text-3xl italic text-[#F5EFE0] mb-6 leading-tight">"El fuego que no se apaga"</h3>
            <p className="text-[#F5EFE0]/75 leading-relaxed text-sm md:text-base mb-5">
              Dios no nos llamó a una fe tibia. Nos llamó a arder con Su presencia, a ser luz en medio de la oscuridad. Recuerda que el mismo Espíritu que levantó a Cristo de los muertos vive en ti.
            </p>
            <p className="text-[#F5EFE0]/75 leading-relaxed text-sm md:text-base mb-6">
              Cuando sientas que el fuego disminuye, vuelve a Sus pies. La adoración, la Palabra y la comunidad son el combustible que mantiene la llama viva. Somos <em className="text-[#FFB300]">FireGeneration</em> — una generación que no teme brillar.
            </p>
            <blockquote className="border-l-2 border-[#FF6B00] pl-4 py-1 italic text-[#FFB300] text-sm leading-relaxed">
              "Porque Dios no nos ha dado un espíritu de cobardía, sino de poder, de amor y de dominio propio."
              <cite className="block mt-2 not-italic text-xs font-bold text-[#FF6B00] tracking-widest uppercase">— 2 Timoteo 1:7</cite>
            </blockquote>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN: NOSOTROS --- */}
      <section id="nosotros" className="py-24 px-6 bg-[#0A0805]">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#FF6B00] font-bold mb-3">Quiénes somos</p>
          <h2 className="font-cinzel text-3xl md:text-5xl font-bold text-gradient-gold-orange mb-6 leading-tight">Una generación<br/>con propósito</h2>
          <div className="w-16 h-0.5 bg-gradient-to-r from-[#FF6B00] to-[#FFB300] mb-8"></div>
          
          <div className="max-w-3xl space-y-4 mb-12">
            <p className="text-[#F5EFE0]/75 leading-relaxed text-base md:text-lg">
              <strong className="text-[#FFB300] font-semibold">FireGeneration</strong> es el grupo de jóvenes de la Iglesia Wesleyana Suba "Lugar de Provisión y Crecimiento". Somos jóvenes que creemos en un Dios que todavía hace milagros, que todavía llama, y que todavía transforma vidas.
            </p>
            <p className="text-[#F5EFE0]/75 leading-relaxed text-base md:text-lg">
              Nos reunimos para adorar, crecer en la Palabra y ser una comunidad auténtica donde cada joven se siente amado y valorado. Creemos que la juventud no es una etapa de espera, sino una temporada de fuego y propósito.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/5 border border-[#FF6B00]/10 rounded p-6 hover:border-[#FFB300]/40 hover:-translate-y-1 transition-all duration-300">
              <span className="text-3xl block mb-4">🔥</span>
              <p className="font-cinzel text-base font-bold text-gradient-gold-orange mb-3">Fuego</p>
              <p className="text-sm text-[#F5EFE0]/60 leading-relaxed">Vivimos con pasión por Dios. La tibieza no nos define — somos jóvenes encendidos por el Espíritu.</p>
            </div>
            <div className="bg-white/5 border border-[#FF6B00]/10 rounded p-6 hover:border-[#FFB300]/40 hover:-translate-y-1 transition-all duration-300">
              <span className="text-3xl block mb-4">🤝</span>
              <p className="font-cinzel text-base font-bold text-gradient-gold-orange mb-3">Comunidad</p>
              <p className="text-sm text-[#F5EFE0]/60 leading-relaxed">Nadie camina solo. Somos familia que se sostiene, que celebra y que crece junto.</p>
            </div>
            <div className="bg-white/5 border border-[#FF6B00]/10 rounded p-6 hover:border-[#FFB300]/40 hover:-translate-y-1 transition-all duration-300">
              <span className="text-3xl block mb-4">📖</span>
              <p className="font-cinzel text-base font-bold text-gradient-gold-orange mb-3">Palabra</p>
              <p className="text-sm text-[#F5EFE0]/60 leading-relaxed">La Biblia es nuestra guía. La estudiamos, la vivimos y la compartimos con el mundo.</p>
            </div>
            <div className="bg-white/5 border border-[#FF6B00]/10 rounded p-6 hover:border-[#FFB300]/40 hover:-translate-y-1 transition-all duration-300">
              <span className="text-3xl block mb-4">🌍</span>
              <p className="font-cinzel text-base font-bold text-gradient-gold-orange mb-3">Misión</p>
              <p className="text-sm text-[#F5EFE0]/60 leading-relaxed">Fuimos llamados a ser sal y luz. Transformamos nuestros barrios, ciudades y naciones.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN: ACTIVIDADES --- */}
      <section id="actividades" className="py-24 px-6 bg-[#150F07] border-t border-[#FF6B00]/10">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#FF6B00] font-bold mb-3">Calendario</p>
          <h2 className="font-cinzel text-3xl md:text-5xl font-bold text-gradient-gold-orange mb-6">Actividades</h2>
          <div className="w-16 h-0.5 bg-gradient-to-r from-[#FF6B00] to-[#FFB300] mb-12"></div>
          
          <div className="space-y-0">
            {/* Actividad 1 */}
            <div className="flex gap-6 py-6 border-b border-[#FF6B00]/10">
              <div className="w-20 shrink-0 text-center bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded py-3">
                <span className="text-[10px] tracking-widest uppercase text-[#FFB300] font-bold block mb-1">Sáb</span>
                <span className="font-cinzel text-2xl leading-none text-[#FF6B00] block">Cada<br/><span className="text-lg">sem</span></span>
              </div>
              <div>
                <h4 className="font-cinzel text-lg font-bold text-gradient-gold-orange mb-2">Reunión de jóvenes</h4>
                <p className="text-[#F5EFE0]/60 text-sm md:text-base leading-relaxed">Nuestro encuentro semanal — adoración, Palabra y comunidad. El lugar donde el fuego se renueva. <span className="text-[#FFB300] font-semibold">5:00 pm</span></p>
              </div>
            </div>
            
            {/* Actividad 2 */}
            <div className="flex gap-6 py-6 border-b border-[#FF6B00]/10">
              <div className="w-20 shrink-0 text-center bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded py-3">
                <span className="text-[10px] tracking-widest uppercase text-[#FFB300] font-bold block mb-1">Dom</span>
                <span className="font-cinzel text-2xl leading-none text-[#FF6B00] block">Cada<br/><span className="text-lg">sem</span></span>
              </div>
              <div>
                <h4 className="font-cinzel text-lg font-bold text-gradient-gold-orange mb-2">Culto dominical</h4>
                <p className="text-[#F5EFE0]/60 text-sm md:text-base leading-relaxed">Acompáñanos en el culto principal de la Iglesia Wesleyana Suba. <span className="text-[#FFB300] font-semibold">7:00 am</span> y <span className="text-[#FFB300] font-semibold">10:30 am</span></p>
              </div>
            </div>

            {/* Actividad 3 */}
            <div className="flex gap-6 py-6 border-b border-[#FF6B00]/10">
              <div className="w-20 shrink-0 text-center bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded py-3">
                <span className="text-[10px] tracking-widest uppercase text-[#FFB300] font-bold block mb-1">Mar</span>
                <span className="font-cinzel text-2xl leading-none text-[#FF6B00] block">Cada<br/><span className="text-lg">sem</span></span>
              </div>
              <div>
                <h4 className="font-cinzel text-lg font-bold text-gradient-gold-orange mb-2">Noche de alabanza</h4>
                <p className="text-[#F5EFE0]/60 text-sm md:text-base leading-relaxed">Una noche especial de adoración y fuego. Invita a tus amigos. <span className="text-[#FFB300] font-semibold">6:30 pm</span></p>
              </div>
            </div>

             {/* Actividad 4 */}
             <div className="flex gap-6 py-6 border-b border-[#FF6B00]/10">
              <div className="w-20 shrink-0 text-center bg-[#FF6B00]/10 border border-[#FF6B00]/20 rounded py-3">
                <span className="text-[10px] tracking-widest uppercase text-[#FFB300] font-bold block mb-1">Jue</span>
                <span className="font-cinzel text-2xl leading-none text-[#FF6B00] block">Cada<br/><span className="text-lg">sem</span></span>
              </div>
              <div>
                <h4 className="font-cinzel text-lg font-bold text-gradient-gold-orange mb-2">Noche de oración</h4>
                <p className="text-[#F5EFE0]/60 text-sm md:text-base leading-relaxed">Un tiempo dedicado a la intercesión y la comunión espiritual. <span className="text-[#FFB300] font-semibold">6:30 pm</span></p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- SECCIÓN: CONTACTO & FOOTER --- */}
      <section id="contacto" className="py-24 px-6 bg-[#0A0805] text-center">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#FF6B00] font-bold mb-3">Únete</p>
          <h2 className="font-cinzel text-3xl md:text-5xl font-bold text-gradient-gold-orange mb-6">¿Listo para<br/>encenderte?</h2>
          <div className="w-16 h-0.5 bg-gradient-to-r from-[#FF6B00] to-[#FFB300] mx-auto mb-8"></div>
          
          <p className="text-[#F5EFE0]/65 leading-relaxed text-base mb-8 max-w-xl mx-auto">
            Si eres joven y quieres ser parte de una comunidad que te desafíe a crecer, te esperamos. Escríbenos o visítanos el próximo sábado.
          </p>

          <div className="flex flex-col items-center gap-4 mb-10 text-[#B09070] text-sm">
            <a href="https://maps.google.com/?q=Cra.+99a+%23135-06,+Bogotá" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#FFB300] transition-colors">
              <MapPin className="w-4 h-4" /> Cra. 99a #135 - 06, Bogotá — Iglesia Wesleyana Suba
            </a>
            <p className="flex items-center gap-2">
              <Clock className="w-4 h-4" /> Sábados a las 5:00 PM
            </p>
            <p className="flex items-center gap-2">
               ✉️ fireiws@wesleyansuba.org
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-16">
            <a href="https://wa.me/573204700154" target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-gradient-to-br from-[#FF6B00] to-[#CC2200] text-white font-bold text-xs tracking-widest uppercase rounded shadow-[0_4px_20px_rgba(204,34,0,0.5)] hover:shadow-[0_8px_30px_rgba(255,107,0,0.6)] hover:-translate-y-1 transition-all duration-300">
              Escríbenos por WhatsApp
            </a>
            <a href="https://www.instagram.com/firegenerationiws/" target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-transparent border border-[#FFB300]/30 text-[#FFB300] font-bold text-xs tracking-widest uppercase rounded hover:bg-[#FFB300]/10 hover:border-[#FFB300] transition-all duration-300">
              Instagram
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#050403] border-t border-[#FF6B00]/10 py-16 px-6 text-center relative z-10">
        <p className="font-cinzel text-2xl text-gradient-gold-orange font-bold mb-2">FireGeneration</p>
        <p className="text-[10px] md:text-xs text-[#4DB8E8] tracking-widest uppercase mb-6">
          Lugar de Provisión y Crecimiento · Iglesia Wesleyana Suba
        </p>

        <div className="flex justify-center mb-8">
           <a href="https://wesleyansuba.org" target="_blank" rel="noopener noreferrer" 
              className="flex items-center gap-2 text-sm text-[#F5EFE0]/60 hover:text-[#4DB8E8] transition-colors">
             Visita el sitio principal de la iglesia <ExternalLink className="w-4 h-4" />
           </a>
        </div>

        <p className="text-[10px] text-[#4DB8E8]/50 tracking-[0.15em] mb-4">BOGOTÁ, COLOMBIA</p>
        <p className="text-xs text-[#F5EFE0]/30">&copy; {new Date().getFullYear()} FireGeneration — Todos los derechos reservados.</p>
      </footer>

      {/* --- AVISO DE COOKIES Y PRIVACIDAD --- */}
      {showCookies && (
        <div className="fixed bottom-0 left-0 w-full bg-[#050403] border-t border-[#FF6B00]/30 shadow-2xl z-50 p-4 md:p-6 translate-y-0 transition-transform">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-[#FFB300] shrink-0 mt-1" />
              <div className="text-sm text-[#F5EFE0]/80">
                <p className="font-bold text-[#FFB300] mb-1">Aviso de Privacidad y Cookies</p>
                <p className="leading-relaxed text-xs md:text-sm">
                  Utilizamos cookies y tecnologías similares para mejorar tu experiencia en nuestra web comunitaria, analizar nuestro tráfico de forma anónima y compartir información relevante sobre nuestras actividades en la Iglesia Wesleyana Suba. Al continuar navegando, aceptas nuestro uso de cookies de acuerdo con nuestros principios y políticas.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-3 w-full md:w-auto">
              <button onClick={() => setShowPolicy(true)} className="flex-1 md:flex-none text-center px-4 py-2 border border-[#F5EFE0]/20 text-[#F5EFE0]/80 hover:bg-[#F5EFE0]/10 hover:text-white rounded text-xs tracking-widest uppercase transition-colors">
                Política
              </button>
              <button onClick={handleAcceptCookies} className="flex-1 md:flex-none px-6 py-2 bg-gradient-to-r from-[#FF6B00] to-[#CC2200] text-white rounded font-bold text-xs tracking-widest uppercase shadow-lg hover:shadow-orange-500/30 transition-all">
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE POLÍTICA DE PRIVACIDAD --- */}
      {showPolicy && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A0805]/80 backdrop-blur-sm">
          <div className="bg-[#150F07] border border-[#FFB300]/20 rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto relative shadow-2xl">
            <button 
              onClick={() => setShowPolicy(false)}
              className="absolute top-4 right-4 text-[#B09070] hover:text-[#FFB300] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <h3 className="font-cinzel text-2xl font-bold text-gradient-gold-orange mb-4">Política de Privacidad y Cookies</h3>
            <div className="space-y-4 text-[#F5EFE0]/75 text-sm leading-relaxed">
              <p>
                <strong>1. Información General:</strong> Esta política describe cómo recogemos, utilizamos y protegemos la información cuando interactúas con el sitio web de FireGeneration, un ministerio de la Iglesia Wesleyana Suba.
              </p>
              <p>
                <strong>2. Uso de Cookies:</strong> Utilizamos "cookies" (pequeños archivos de texto almacenados en tu dispositivo) principalmente para:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Recordar tus preferencias (como haber aceptado este aviso).</li>
                <li>Analizar de forma anónima cómo se utiliza nuestro sitio para mejorar el contenido y la experiencia.</li>
              </ul>
              <p>
                <strong>3. Datos Personales:</strong> No recolectamos información personal identificable a través de este sitio web sin tu consentimiento explícito (por ejemplo, si nos contactas directamente a través de WhatsApp o correo electrónico). Cualquier información que nos proporciones voluntariamente será utilizada únicamente para responder a tu consulta o facilitarte información sobre nuestras actividades.
              </p>
              <p>
                <strong>4. Enlaces a Terceros:</strong> Nuestro sitio incluye enlaces a plataformas externas (como Instagram o WhatsApp). Te recomendamos revisar las políticas de privacidad de esas plataformas, ya que no tenemos control sobre sus prácticas.
              </p>
              <p>
                <strong>5. Cambios en la Política:</strong> Nos reservamos el derecho de actualizar esta política. Los cambios serán reflejados en esta misma página.
              </p>
              <p className="pt-4 border-t border-[#FF6B00]/20 text-[#B09070]">
                Última actualización: Abril 2026. Para consultas, contáctanos en: fireiws@wesleyansuba.org
              </p>
            </div>
            <div className="mt-6 text-center">
               <button 
                onClick={() => setShowPolicy(false)}
                className="px-6 py-2 bg-gradient-to-r from-[#FF6B00] to-[#CC2200] text-white rounded font-bold text-xs tracking-widest uppercase hover:shadow-orange-500/30 transition-all"
               >
                 Cerrar
               </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}