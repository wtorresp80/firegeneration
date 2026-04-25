import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, ExternalLink, Info } from 'lucide-react';

// --- COMPONENTE DEL FUEGO (CANVAS OPTIMIZADO PARA MÓVILES - "SPRITES") ---
const FireCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let _w = 0;
    let _h = 0;

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      _w = w;
      _h = h;
    };
    
    resize();
    window.addEventListener('resize', resize);

    // --- OPTIMIZACIÓN "VIDEOJUEGOS": PRE-RENDER DE SPRITES ---
    const createSprite = (type) => {
      const cvs = document.createElement('canvas');
      const size = 64; 
      cvs.width = size;
      cvs.height = size;
      const c = cvs.getContext('2d');
      const r = size / 2;
      const g = c.createRadialGradient(r, r, 0, r, r, r);

      if (type === 'core') {
        g.addColorStop(0, 'rgba(255,255,215,1)');
        g.addColorStop(0.15, 'rgba(255,245,110,0.9)');
        g.addColorStop(0.38, 'rgba(255,155,15,0.7)');
        g.addColorStop(0.65, 'rgba(205,45,0,0.5)');
        g.addColorStop(1, 'rgba(100,5,0,0)');
      } else if (type === 'base') {
        g.addColorStop(0, 'rgba(255,175,25,0.8)');
        g.addColorStop(0.28, 'rgba(255,95,0,0.7)');
        g.addColorStop(0.58, 'rgba(185,28,0,0.5)');
        g.addColorStop(1, 'rgba(75,5,0,0)');
      } else if (type === 'dark') {
        g.addColorStop(0, 'rgba(220,70,0,0.7)');
        g.addColorStop(0.42, 'rgba(150,18,0,0.5)');
        g.addColorStop(1, 'rgba(40,0,0,0)');
      } else { // ember (chispa)
        g.addColorStop(0, 'rgba(255,210,55,0.8)');
        g.addColorStop(0.45, 'rgba(255,115,0,0.3)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
      }

      c.fillStyle = g;
      c.beginPath();
      c.arc(r, r, r, 0, Math.PI * 2);
      c.fill();
      return cvs;
    };

    const coreSprite = createSprite('core');
    const baseSprite = createSprite('base');
    const darkSprite = createSprite('dark');
    const emberSprite = createSprite('ember');
    // --- FIN OPTIMIZACIÓN ---

    let flames = [];
    let embers = [];
    let t = 0;
    let eTimer = 0;

    const sn = (x) => Math.sin(x * 1.73) * 0.5 + Math.sin(x * 3.07 + 1.2) * 0.3 + Math.sin(x * 0.91 + 2.4) * 0.2;

    const mkFlame = (x, baseY, intensity, isMobile) => {
      const sz = (isMobile ? 10 : 16) + Math.random() * intensity * (isMobile ? 38 : 56);
      return {
        x: x + (Math.random() - 0.5) * intensity * (isMobile ? 45 : 65),
        y: baseY + Math.random() * 6,
        vx: (Math.random() - 0.5) * 0.7,
        vy: -(1.2 + Math.random() * intensity * (isMobile ? 5.0 : 6.5)),
        size: sz,
        life: 1,
        decay: 0.004 + Math.random() * 0.009,
        phase: Math.random() * Math.PI * 2,
        wAmp: 4 + Math.random() * 14,
        wFreq: 1.4 + Math.random() * 2.8,
        core: Math.random() < 0.28
      };
    };

    const mkEmber = (x, y) => {
      const spd = 0.6 + Math.random() * 3.2;
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.5;
      return {
        x: x, y: y,
        vx: Math.cos(ang) * spd + (Math.random() - 0.5) * 1.0,
        vy: Math.sin(ang) * spd - 0.35,
        life: 1, decay: 0.002 + Math.random() * 0.006,
        size: 0.7 + Math.random() * 2.0, bright: Math.random() < 0.55,
        tx: (Math.random() - 0.5) * 0.05,
        colorRg: Math.floor(120 + Math.random() * 100) 
      };
    };

    const N = 28;
    const sources = [];
    for (let i = 0; i < N; i++) {
      const f = i / (N - 1);
      const profile = 0.58 + 0.42 * Math.pow(Math.sin(f * Math.PI), 0.6);
      sources.push({
        frac: f,
        base: profile * (0.82 + Math.random() * 0.18),
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

      ctx.globalAlpha = p.life;
      let sprite = darkSprite;
      if (p.core) sprite = coreSprite;
      else if (p.life > 0.55) sprite = baseSprite;

      ctx.drawImage(sprite, cx - r, cy - r, r * 2, r * 2);
    };

    const drawEmber = (e) => {
      const a = e.life;
      ctx.globalAlpha = a;

      if (e.bright) {
        const hr = e.size * 5;
        ctx.drawImage(emberSprite, e.x - hr, e.y - hr, hr * 2, hr * 2);
      }
      
      ctx.beginPath(); 
      ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${e.colorRg},15,${a.toFixed(2)})`;
      ctx.fill();
    };

    const tick = () => {
      animationFrameId = requestAnimationFrame(tick);
      t += 0.016; eTimer += 0.016;
      const W = _w, H = _h;
      
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);

      const isMobile = W < 680;
      const maxFlames = isMobile ? 500 : 1100;
      const maxEmbers = isMobile ? 200 : 450;

      for (let s = 0; s < sources.length; s++) {
        const src = sources[s];
        const flicker = 0.62 + 0.38 * sn(t * src.fr + src.phase);
        const intensity = src.base * flicker;
        const x = src.frac * W;

        if (Math.random() < src.sr * intensity * 1.5) {
          flames.push(mkFlame(x, H, intensity, isMobile));
          if (Math.random() < 0.45) flames.push(mkFlame(x + (Math.random()-0.5)*50, H, intensity * 0.60, isMobile));
          if (!isMobile && Math.random() < 0.20) flames.push(mkFlame(x + (Math.random()-0.5)*80, H, intensity * 0.36, isMobile));
        }
        if (eTimer > 0.07 && Math.random() < intensity * 0.18) {
          const tipY = H - intensity * H * 0.80 + Math.random() * 40;
          embers.push(mkEmber(x + (Math.random()-0.5)*35, tipY));
        }
      }

      if (Math.random() < 0.35) embers.push(mkEmber(Math.random() * W, H * 0.5 + Math.random() * H * 0.45));
      if (eTimer > 0.07) eTimer = 0;

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
      
      if (flames.length > maxFlames) flames.splice(0, flames.length - maxFlames);
      if (embers.length > maxEmbers)  embers.splice(0, embers.length - maxEmbers);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute bottom-0 left-0 w-full h-[80vh] z-[1] pointer-events-none block" />;
};


// --- APLICACIÓN PRINCIPAL ---
export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Cerrar menú y evitar scroll cuando está abierto
  useEffect(() => {
    if (isMobileMenuOpen || showPrivacyModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isMobileMenuOpen, showPrivacyModal]);

  // Revisar si ya aceptó las cookies
  useEffect(() => {
    const cookiesAccepted = localStorage.getItem('fireGenCookies');
    if (!cookiesAccepted) {
      setShowCookieBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('fireGenCookies', 'true');
    setShowCookieBanner(false);
  };

  const navLinks = [
    { name: 'Reflexión', href: '#reflexion' },
    { name: 'Nosotros', href: '#nosotros' },
    { name: 'Actividades', href: '#actividades' },
    { name: 'Contacto', href: '#contacto' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0805] text-[#F5EFE0] font-sans overflow-x-hidden selection:bg-[#FF6B00]/30 scroll-smooth">
      
      {/* Importación de fuentes y animaciones personalizadas */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Raleway:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,700;1,400&display=swap');
        
        .font-cinzel-dec { font-family: 'Cinzel Decorative', serif; }
        .font-raleway { font-family: 'Raleway', sans-serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        
        @keyframes glow-pulse {
          0%   { filter: brightness(1)    drop-shadow(0 0 16px rgba(255,107,0,0.4)); }
          100% { filter: brightness(1.15) drop-shadow(0 0 38px rgba(255,179,0,0.65)); }
        }
        .animate-glow-pulse {
          animation: glow-pulse 3s ease-in-out infinite alternate;
        }
      `}} />

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 right-0 z-[200] flex items-center justify-between px-6 md:px-8 py-4 bg-[#0A0805]/95 border-b border-[#FFB300]/10">
        <div className="font-cinzel-dec text-base tracking-[0.04em] bg-gradient-to-br from-[#FFB300] to-[#FF6B00] text-transparent bg-clip-text shrink-0">
          FireGeneration
        </div>

        {/* Desktop Links */}
        <ul className="hidden md:flex gap-7 list-none m-0 p-0">
          {navLinks.map((link) => (
            <li key={link.name}>
              <a href={link.href} className="text-[#B09070] text-[0.8rem] tracking-[0.12em] uppercase font-semibold hover:text-[#FFB300] transition-colors decoration-transparent">
                {link.name}
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile Hamburger Button */}
        <button 
          className="md:hidden flex flex-col justify-center gap-[5px] bg-transparent border-none cursor-pointer p-1 z-[201] text-[#FFB300]"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Menú"
        >
          <Menu size={28} />
        </button>
      </nav>

      {/* --- MOBILE DRAWER (PANTALLA COMPLETA SÓLIDA) --- */}
      {/* Añadimos style={{ backgroundColor: '#0A0805' }} para asegurar que sea sólido 100% */}
      <div 
        className={`md:hidden fixed inset-0 z-[300] bg-black flex flex-col transition-all duration-300 ${isMobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
        style={{ backgroundColor: '#0A0805' }}
      >
        {/* Cabecera del menú móvil */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#FFB300]/10">
          <div className="font-cinzel-dec text-base tracking-[0.04em] bg-gradient-to-br from-[#FFB300] to-[#FF6B00] text-transparent bg-clip-text">
            FireGeneration
          </div>
          <button 
            className="text-[#FFB300] p-1 cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={30} />
          </button>
        </div>
        
        {/* Enlaces centrales */}
        <div className="flex flex-col items-center justify-center flex-1 gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-cinzel-dec text-[1.4rem] text-[#B09070] tracking-[0.08em] hover:text-[#FFB300] transition-colors decoration-transparent"
            >
              {link.name}
            </a>
          ))}
          {/* Enlace a la iglesia (Móvil) */}
          <a href="https://wesleyansuba.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[0.85rem] font-bold tracking-[0.15em] text-[#4DB8E8] mt-4 hover:text-[#FFB300] transition-colors">
            wesleyansuba.org <ExternalLink size={16} />
          </a>
        </div>

        {/* Pie de página del menú móvil (Políticas) */}
        <div className="pb-8 pt-4 flex flex-col items-center gap-4 text-[#F5EFE0]/40 text-[0.7rem] uppercase tracking-widest border-t border-white/5 mx-6">
          <button onClick={() => setShowPrivacyModal(true)} className="hover:text-[#FFB300] transition-colors uppercase tracking-widest bg-transparent border-none">Política de privacidad</button>
          <button onClick={() => setShowPrivacyModal(true)} className="hover:text-[#FFB300] transition-colors uppercase tracking-widest bg-transparent border-none">Cookies</button>
        </div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-28 pb-20 overflow-hidden font-raleway">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0 bg-[#0A0805]" style={{ background: 'radial-gradient(ellipse 90% 50% at 50% 90%, rgba(180,30,0,0.3) 0%, transparent 70%), #0A0805' }}></div>
        
        <FireCanvas />
        
        {/* Se amplió el max-w a 900px para que el texto grande nunca choque con los bordes del contenedor */}
        <div className="relative z-[5] w-full max-w-[900px] mx-auto">
          <p className="text-[0.65rem] tracking-[0.25em] uppercase text-[#FFB300] font-semibold mb-[1.2rem] flex items-center justify-center gap-[0.8rem]">
            <span className="block w-[28px] h-[1px] bg-[#FFB300] opacity-60"></span>
            Iglesia Wesleyana Suba
            <span className="block w-[28px] h-[1px] bg-[#FFB300] opacity-60"></span>
          </p>
          
          {/* Se ajustó el clamp y el px-[0.4em] para darle todo el espacio necesario a la tipografía sin cortes */}
          <h1 className="font-cinzel-dec text-[clamp(2.2rem,11vw,6.5rem)] font-black leading-[1] tracking-[-0.02em] bg-clip-text text-transparent mb-[0.6rem] animate-glow-pulse px-[0.4em] py-2 overflow-visible" style={{ backgroundImage: 'linear-gradient(160deg, #FFE066 0%, #FFB300 30%, #FF6B00 60%, #CC2200 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Fire<br />Generation
          </h1>
          
          <p className="font-playfair italic text-[clamp(0.95rem,3.5vw,1.4rem)] text-[#F5EFE0]/75 mb-8 max-w-[600px] mx-auto">
            Una generación encendida por el Espíritu
          </p>
          
          <p className="text-[clamp(0.8rem,2.5vw,0.9rem)] text-[#B09070] max-w-[400px] mx-auto mb-10 leading-[1.7] italic px-2">
            "No dejes que nadie te menosprecie por ser joven, sino sé un ejemplo para los creyentes en palabra, conducta, amor, fe y pureza."
            <cite className="block mt-2 text-[#FFB300] not-italic text-[0.78rem] font-semibold">
              — 1 Timoteo 4:12
            </cite>
          </p>
          
          <a href="#reflexion" className="inline-block px-8 py-[0.85rem] text-white font-bold text-[0.8rem] tracking-[0.12em] uppercase rounded-sm shadow-[0_4px_20px_rgba(204,34,0,0.5)] transition-transform hover:scale-95 active:scale-95" style={{ background: 'linear-gradient(135deg, #FF6B00, #CC2200)' }}>
            Reflexión de la semana
          </a>
        </div>

        {/* Church Strip Bottom */}
        <div className="absolute bottom-0 left-0 right-0 z-[6] py-[0.55rem] px-4 flex items-center justify-center gap-2 flex-wrap bg-[#0A0805]/80 border-t border-[#FFB300]/10">
          <span className="text-[0.62rem] tracking-[0.15em] uppercase text-[#4DB8E8] font-semibold whitespace-nowrap">
            Lugar de <strong className="text-[#4DB8E8] font-bold">Provisión</strong> y Crecimiento
          </span>
          <span className="hidden sm:inline text-white/20">|</span>
          <span className="text-[0.62rem] tracking-[0.15em] uppercase text-[#4DB8E8] font-semibold whitespace-nowrap">
            Iglesia Wesleyana Suba
          </span>
        </div>
      </section>

      {/* --- REFLEXIÓN SEMANAL --- */}
      <section id="reflexion" className="relative px-6 py-20 border-y border-[#FF6B00]/15" style={{ background: 'linear-gradient(135deg, #150F07, #1A0D00)' }}>
        <div className="max-w-[900px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center">
          <div>
            <p className="text-[0.65rem] tracking-[0.3em] uppercase text-[#FF6B00] font-bold mb-3">Semana a semana</p>
            <h2 className="font-cinzel-dec text-[clamp(1.5rem,5vw,2.6rem)] font-bold mb-5 leading-[1.2] bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #FFB300, #FF6B00)' }}>
              Reflexión<br />Semanal
            </h2>
            <div className="w-[50px] h-[2px] mb-5" style={{ background: 'linear-gradient(90deg, #FF6B00, #FFB300)' }}></div>
            <p className="text-[#F5EFE0]/65 leading-[1.85] text-[0.93rem]">
              Cada semana compartimos una palabra que enciende nuestra fe y nos recuerda que somos parte de algo más grande. No estás solo en este camino — somos una generación que arde con propósito.
            </p>
          </div>

          <div className="bg-white/5 border border-[#FFB300]/20 rounded-sm p-6 md:p-8 relative overflow-hidden">
            <span className="absolute -top-2 left-4 font-playfair text-[7rem] leading-none text-[#FFB300] opacity-5 pointer-events-none">“</span>
            
            <p className="text-[0.65rem] tracking-[0.25em] uppercase text-[#FFB300] font-bold mb-2">Reflexión de la semana</p>
            <h3 className="font-playfair text-[1.3rem] italic text-[#F5EFE0] mb-[1.1rem] leading-[1.3]">"El fuego que no se apaga"</h3>
            <p className="text-[#F5EFE0]/75 leading-[1.85] text-[0.92rem] mb-4">
              Dios no nos llamó a una fe tibia. Nos llamó a arder con Su presencia, a ser luz en medio de la oscuridad. Esta semana, recuerda que el mismo Espíritu que levantó a Cristo de los muertos vive en ti.
            </p>
            <p className="text-[#F5EFE0]/75 leading-[1.85] text-[0.92rem] mb-4">
              Cuando sientas que el fuego disminuye, vuelve a Sus pies. La adoración, la Palabra y la comunidad son el combustible que mantiene la llama viva. Somos <em className="text-[#FFB300] not-italic font-semibold">FireGeneration</em> — una generación que no teme brillar.
            </p>
            <blockquote className="border-l-2 border-[#FF6B00] pl-4 italic text-[#FFB300] text-[0.88rem] leading-[1.7] mt-4">
              "Porque Dios no nos ha dado un espíritu de cobardía, sino de poder, de amor y de dominio propio."
              <cite className="block mt-[0.4rem] not-italic font-bold text-[0.72rem] text-[#FF6B00] tracking-[0.1em]">— 2 Timoteo 1:7</cite>
            </blockquote>
          </div>
        </div>
      </section>

      {/* --- NOSOTROS --- */}
      <section id="nosotros" className="relative px-6 py-20 max-w-[1000px] mx-auto">
        <p className="text-[0.65rem] tracking-[0.3em] uppercase text-[#FF6B00] font-bold mb-3">Quiénes somos</p>
        <h2 className="font-cinzel-dec text-[clamp(1.5rem,5vw,2.6rem)] font-bold mb-5 leading-[1.2] bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, #FFB300, #FF6B00)' }}>
          Una generación<br />con propósito
        </h2>
        <div className="w-[50px] h-[2px] mb-5" style={{ background: 'linear-gradient(90deg, #FF6B00, #FFB300)' }}></div>
        
        <p className="text-[#F5EFE0]/75 leadin