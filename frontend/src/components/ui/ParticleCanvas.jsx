import React, { useRef, useEffect, useState, useCallback, memo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePrefersReducedMotion } from '@/components/motion';

const ParticleCanvas = ({ className = '' }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const { activeTheme } = useTheme();
  
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const getParticleCount = useCallback(() => {
    if (typeof window === 'undefined') return 40;
    const w = window.innerWidth;
    if (w < 768) return 20;
    if (w < 1024) return 40;
    return 60;
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsIntersecting(entry.isIntersecting),
      { threshold: 0 }
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !isIntersecting || !isVisible) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let width = canvas.offsetWidth;
    let height = canvas.offsetHeight;

    canvas.width = width;
    canvas.height = height;

    const particleColor = activeTheme === 'dark' ? 'rgba(139, 92, 246, 0.5)' : 'rgba(99, 102, 241, 0.3)';
    const lineColor = activeTheme === 'dark' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(99, 102, 241, 0.08)';

    const initParticles = () => {
      particles = [];
      const count = getParticleCount();
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: (Math.random() - 0.5) * 0.6,
          radius: Math.random() * 1.5 + 1.5,
        });
      }
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      initParticles();
    };

    window.addEventListener('resize', handleResize);
    initParticles();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = particleColor;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = lineColor;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [activeTheme, getParticleCount, isIntersecting, isVisible, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div
        className={`w-full h-full ${className}`}
        style={{
          background: activeTheme === 'dark'
            ? 'linear-gradient(to bottom right, rgba(139, 92, 246, 0.05), transparent)'
            : 'linear-gradient(to bottom right, rgba(99, 102, 241, 0.05), transparent)'
        }}
      />
    );
  }

  return (
    <div ref={containerRef} className={`w-full h-full ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
};

const MemoizedParticleCanvas = memo(ParticleCanvas);
export { MemoizedParticleCanvas as ParticleCanvas };
export default MemoizedParticleCanvas;
