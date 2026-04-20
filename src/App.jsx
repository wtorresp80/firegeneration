import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, Mail, ExternalLink, MessageCircle, Menu, X } from 'lucide-react';

// --- COMPONENTE DEL FUEGO (CANVAS OPTIMIZADO) ---
const FireCanvas = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const isMobile = window.innerWidth < 768;
    const MAX_FLAMES = isMobile ? 350 : 1100; 
    const MAX_EMBERS = isMobile ? 120 : 450;  
    const SPAWN_RATE = isMobile ? 0.7 : 1.6;  

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // --- INICIO OPTIMIZACIÓN: PRE-RENDER DE SPRITES ---
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
      } else { 
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

    const mkFlame = (x, baseY, intensity) => {
      const sz = 12 + Math.random() * intensity * 44;
      return {
        x: x + (Math.random() - 0.5) * intensity * 58,
        y: baseY + Math.random() * 6,
        vx: (Math.random() - 0.5) * 0.8,
        vy: -(1.2 + Math.random() * intensity * 6.0),
        size: sz,
        life: 1,
        decay: 0.0035 + Math.random() * 0.008,
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
        tx: (Math.random() - 0.5) * 0.055,
        colorRg: Math.floor(120 + Math.random() * 100) 
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
        const hr = e.size * 5.5;
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
      const W = canvas.width, H = canvas.height;
      
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);

      for (let s = 0; s < sources.length; s++) {
        const src = sources[s];
        const flicker = 0.62 + 0.38 * sn(t * src.fr + src.phase);
        const intensity = src.base * flicker;
        const x = src.frac * W;

        if (Math.random() < src.sr * intensity * SPAWN_RATE) {
          flames.push(mkFlame(x, H, intensity));
          if (Math.random() < 0.48) flames.push(mkFlame(x + (Math.random()-0.5)*55, H, intensity * 0.62));
          if (Math.random() < 0.22) flames.push(mkFlame(x + (Math.random()-0.5)*85, H, intensity * 0.38));
        }
        if (eTimer > 0.065 && Math.random() < intensity * 0.20) {
          const tipY = H - intensity * H * 0.62 + Math.random() * 45;
          embers.push(mkEmber(x + (Math.random()-0.5)*38, tipY));
        }
      }

      if (Math.random() < (isMobile ? 0.15 : 0.40)) embers.push(mkEmber(Math.random() * W, H * 0.52 + Math.random() * H * 0.44));
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
      
      if (flames.length > MAX_FLAMES) flames.splice(0, flames.length - MAX_FLAMES);
      if (embers.length > MAX_EMBERS)  embers.splice(0, embers.length - MAX_EMBERS);
    };

    tick();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute bottom-0 left-0 w-full h-[65vh] min-h-[500px] z-0 pointer-events-none" />;
};

// --- APLICACIÓN PRINCIPAL ---
export default function App() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Efecto para menú transparente al bajar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enlaces actualizados con toque juvenil
  const navLinks = [
    { name: 'Inicio', href: '#' },
    { name: 'Reflexión', href: '#reflexion' },
    { name: 'Quiénes Somos', href: '#nosotros' },
    { name: 'Actividades', href: '#actividades' },
    { name: 'Únete', href: '#contacto' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0805] text-[#F5EFE0] font-sans selection:bg-[#FF6B00]/30 overflow-x-hidden">
      
      {/* Importación de fuentes caligráficas */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        .font-cinzel { font-family: 'Cinzel', serif; }
        .font-playfair { font-family: 'Playfair Display', serif; }
      `}} />

      {/* Navigation Desktop y Botón Móvil */}
      <nav className={`fixed top-0 left-0 w-full z-40 transition-all duration-300 ${isScrolled ? 'bg-[#0A0805]/95 backdrop-blur-md py-4 shadow-lg border-b border-[#FFB300]/10' : 'bg-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <a href="#" className="font-cinzel text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFB300] to-[#FF6B00]">
            FIREGENERATION
          </a>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="text-xs lg:text-sm font-bold tracking-[0.15em] uppercase text-[#F5EFE0]/90 hover:text-white hover:bg-[#FF6B00]/20 px-4 py-2 rounded-full transition-all duration-300">
                {link.name}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-[#FFB300] focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu size={28} />
          </button>
        </div>
      </nav>

      {/* Menú Móvil Desplegable (Estilo Pantalla Completa Oscura) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed top-0 left-0 w-full h-screen bg-[#0A0805] z-50 flex flex-col pt-6 px-6">
          <div className="flex justify-between items-center mb-12">
            <span className="font-cinzel text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFB300] to-[#FF6B00]">
              FIREGENERATION
            </span>
            <button className="text-[#FFB300] focus:outline-none" onClick={() => setIsMobileMenuOpen(false)}>
              <X size={28} />
            </button>
          </div>
          <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="text-base font-bold tracking-[0.15em] uppercase text-[#F5EFE0]/90 hover:text-[#FFB300] hover:translate-x-2 transition-all pb-4 border-b border-white/10"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <a href="https://wesleyansuba.org" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-bold tracking-[0.15em] text-[#4A90E2] mt-2 hover:text-[#FFB300] transition-colors">
              wesleyansuba.org <ExternalLink size={16} />
            </a>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-12 px-4 overflow-hidden">
        <FireCanvas />
        
        <div className="relative z-10 text-center flex flex-col items-center w-full max-w-4xl mx-auto">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#FFB300]/50"></div>
            <p className="text-[#FFB300] tracking-[0.3em] text-xs font-bold uppercase">Iglesia Wesleyana Suba</p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#FFB300]/50"></div>
          </div>
          
          <h1 className="font-cinzel text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFF] via-[#FFB300] to-[#FF6B00] drop-shadow-[0_0_15px_rgba(255,107,0,0.4)] mb-4 tracking-wider leading-none">
            FIRE<br />GENERATION
          </h1>
          
          <p className="text-[10px] md:text-xs tracking-[0.2em] uppercase text-[#4A90E2] font-bold mb-6">
            Lugar de <span className="text-[#F5EFE0]">Provisión</span> y Crecimiento <span className="text-[#F5EFE0]">|</span> Iglesia Wesleyana Suba
          </p>
          
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
        
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0A0805] to-transparent z-10 pointer-events-none"></div>
      </section>

      {/* Reflexion Section */}
      <section id="reflexion" className="py-24 px-6 relative bg-gradient-to-br from-[#150F07] to-[#1A0D00] border-y border-[#FF6B00]/15">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#FF6B00] font-bold mb-3">Conectando con Dios</p>
            <h2 className="font-cinzel text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFB300] to-[#FF6B00] mb-6 leading-tight">Palabra<br/>de Vida</h2>
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
            <blockquote className="border-l-2 border-[#FF6B00] pl-4 py-2 italic text-[#FFB300] text-sm leading-relaxed mt-4">
              "Porque Dios no nos ha dado un espíritu de cobardía, sino de poder, de amor y de dominio propio."
              <br/><span className="not-italic text-xs tracking-wider uppercase mt-2 block">— 2 Timoteo 1:7</span>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Nosotros Section */}
      <section id="nosotros" className="py-24 px-6 bg-[#0A0805]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#FF6B00] font-bold mb-3">Quiénes Somos</p>
          <h2 className="font-cinzel text-3xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FFB300] to-[#FF6B00] mb-8">Una Generación</h2>
          <p className="text-[#F5EFE0]/80 leading-relaxed text-lg max-w-2xl mx-auto">
            Somos los jóvenes de la Iglesia Wesleyana Suba. Creemos en vivir una fe auténtica, radical y apasionada. Un espacio para hacer amigos, crecer espiritualmente y descubrir el propósito de Dios para tu vida.
          </p>
        </div>
      </section>

      {/* Actividades Section (Restaurada desde imagen) */}
      <section id="actividades" className="py-24 px-6 bg-gradient-to-b from-[#0A0805] to-[#150F07]">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#FF6B00] font-bold mb-3">Calendario</p>
          <h2 className="font-cinzel text-3xl md:text-5xl font-bold text-[#FFB300] mb-6">Actividades</h2>
          <div className="w-16 h-1 bg-[#FF6B00] mb-12"></div>

          <div className="flex flex-col gap-8 md:gap-10">
            {/* Actividad 1 */}
            <div className="flex gap-6 items-start border-b border-white/5 pb-8">
              <div className="flex-shrink-0 bg-[#120A02] border border-[#FF6B00]/20 rounded-md p-4 text-center w-24">
                <p className="text-[10px] tracking-widest uppercase text-[#FFB300] mb-2 font-bold">Sáb</p>
                <p className="font-cinzel text-xl font-bold text-[#FF6B00] leading-tight">CADA<br/>SEM</p>
              </div>
              <div className="pt-1">
                <h3 className="font-cinzel text-xl md:text-2xl text-[#FFB300] mb-3 font-bold">Reunión de Jóvenes</h3>
                <p className="text-[#F5EFE0]/70 text-sm md:text-base leading-relaxed">
                  Nuestro encuentro semanal — adoración, Palabra y comunidad. El lugar donde el fuego se renueva. <span className="text-[#FFB300] font-medium block md:inline mt-1 md:mt-0">5:00 pm</span>
                </p>
              </div>
            </div>

            {/* Actividad 2 */}
            <div className="flex gap-6 items-start border-b border-white/5 pb-8">
              <div className="flex-shrink-0 bg-[#120A02] border border-[#FF6B00]/20 rounded-md p-4 text-center w-24">
                <p className="text-[10px] tracking-widest uppercase text-[#FFB300] mb-2 font-bold">Dom</p>
                <p className="font-cinzel text-xl font-bold text-[#FF6B00] leading-tight">CADA<br/>SEM</p>
              </div>
              <div className="pt-1">
                <h3 className="font-cinzel text-xl md:text-2xl text-[#FFB300] mb-3 font-bold">Culto Dominical</h3>
                <p className="text-[#F5EFE0]/70 text-sm md:text-base leading-relaxed">
                  Acompáñanos en el culto principal de la Iglesia Wesleyana Suba. <span className="text-[#FFB300] font-medium block md:inline mt-1 md:mt-0">7:00 am y 10:30 am</span>
                </p>
              </div>
            </div>

            {/* Actividad 3 */}
            <div className="flex gap-6 items-start border-b border-white/5 pb-8">
              <div className="flex-shrink-0 bg-[#120A02] border border-[#FF6B00]/20 rounded-md p-4 text-center w-24">
                <p className="text-[10px] tracking-widest uppercase text-[#FFB300] mb-2 font-bold">Mar</p>
                <p className="font-cinzel text-xl font-bold text-[#FF6B00] leading-tight">CADA<br/>SEM</p>
              </div>
              <div className="pt-1">
                <h3 className="font-cinzel text-xl md:text-2xl text-[#FFB300] mb-3 font-bold">Noche de Alabanza</h3>
                <p className="text-[#F5EFE0]/70 text-sm md:text-base leading-relaxed">
                  Una noche especial de adoración y fuego. Invita a tus amigos. <span className="text-[#FFB300] font-medium block md:inline mt-1 md:mt-0">6:30 pm</span>
                </p>
              </div>
            </div>

            {/* Actividad 4 */}
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 bg-[#120A02] border border-[#FF6B00]/20 rounded-md p-4 text-center w-24">
                <p className="text-[10px] tracking-widest uppercase text-[#FFB300] mb-2 font-bold">Jue</p>
                <p className="font-cinzel text-xl font-bold text-[#FF6B00] leading-tight">CADA<br/>SEM</p>
              </div>
              <div className="pt-1">
                <h3 className="font-cinzel text-xl md:text-2xl text-[#FFB300] mb-3 font-bold">Noche de Oración</h3>
                <p className="text-[#F5EFE0]/70 text-sm md:text-base leading-relaxed">
                  Un tiempo dedicado a la intercesión y la comunión espiritual. <span className="text-[#FFB300] font-medium block md:inline mt-1 md:mt-0">6:30 pm</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contacto Section */}
      <section id="contacto" className="py-24 px-6 bg-gradient-to-b from-[#150F07] to-[#0A0805] border-t border-[#FFB300]/10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#FF6B00] font-bold mb-3">Contacto</p>
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-[#FFB300] mb-8">¿Listo para encenderte?</h2>
          <p className="text-[#F5EFE0]/80 mb-12">
            Si eres joven y quieres ser parte de una comunidad que te desafíe a crecer, te esperamos. Escríbenos o visítanos el próximo sábado.
          </p>

          <div className="flex flex-col items-center gap-4 mb-12">
            <a href="#" className="flex items-center gap-2 text-[#4A90E2] hover:text-[#FFB300] transition-colors font-medium">
              <MapPin size={18} />
              <span className="text-sm underline underline-offset-4">Cra. 99a #135 - 06, Bogotá — Iglesia Wesleyana Suba</span>
            </a>
            <div className="flex items-center gap-2 text-[#F5EFE0]/80">
              <Clock className="text-[#FFB300]" size={18} />
              <span className="text-sm">Sábados a las 5:00 PM</span>
            </div>
            <a href="mailto:fireiws@wesleyansuba.org" className="flex items-center gap-2 text-[#F5EFE0]/80 hover:text-white transition-colors">
              <Mail className="text-[#FFB300]" size={18} />
              <span className="text-sm">fireiws@wesleyansuba.org</span>
            </a>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4">
            <a href="#" className="flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-white border border-[#FF6B00] hover:bg-[#CC2200] transition-colors rounded-sm text-sm font-bold tracking-wider uppercase shadow-lg">
              <MessageCircle size={18} /> Escríbenos por WhatsApp
            </a>
            <a href="#" className="flex items-center gap-2 px-6 py-3 bg-transparent text-[#FFB300] border border-[#FFB300] hover:bg-[#FFB300]/10 transition-colors rounded-sm text-sm font-bold tracking-wider uppercase">
              {/* Icono de Instagram en puro SVG para evitar errores de compilación */}
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
              </svg> 
              Instagram
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 text-center">
        <h3 className="font-cinzel text-xl text-[#FFB300] font-bold mb-4">FIREGENERATION</h3>
        <p className="text-[10px] tracking-[0.1em] uppercase text-[#4A90E2] font-bold mb-6">
          Lugar de Provisión y Crecimiento · Iglesia Wesleyana Suba
        </p>
        <a href="https://wesleyansuba.org" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[#4A90E2] hover:text-[#FFB300] transition-colors text-sm mb-8 font-bold tracking-[0.1em]">
          wesleyansuba.org <ExternalLink size={14} />
        </a>
        <div className="text-[#F5EFE0]/40 text-xs">
          <p className="mb-2">BOGOTÁ, COLOMBIA</p>
          <p>© 2026 FireGeneration — Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}