import React, { useEffect, useState } from 'react';
import { Leaf, ArrowRight, ChevronRight, ShieldCheck, BookOpen, Sprout } from 'lucide-react';

interface Props {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<Props> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const features = [
    {
      icon: <BookOpen className="w-5 h-5" />,
      title: 'Science-backed answers',
      desc: 'Every response is grounded in peer-reviewed research from IPCC, IPBES, IUCN, and FAO — not hallucinated content.',
    },
    {
      icon: <Sprout className="w-5 h-5" />,
      title: 'Site-specific intelligence',
      desc: 'Provide your soil type, rainfall, land use, and climate zone. Get recommendations tailored to your exact conditions.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5" />,
      title: 'Private document analysis',
      desc: 'Upload your own environmental reports and field assessments. Your documents stay private and are only accessible by you.',
    },
  ];

  const steps = [
    { n: '01', title: 'Describe your land', body: 'Tell us your region, climate, soil conditions, and land use. The more detail, the better the recommendations.' },
    { n: '02', title: 'Ask anything', body: 'Ask questions about soil carbon, biodiversity, water management, or sustainable farming practices.' },
    { n: '03', title: 'Get cited answers', body: 'Receive scientifically grounded responses with source citations you can trace and verify.' },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* Nav */}
      <nav className={`landing-nav px-6 py-4 flex items-center justify-between ${scrolled ? 'scrolled' : ''}`}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
            <Leaf className="w-4 h-4 text-[var(--color-accent-light)]" />
          </div>
          <span className="text-base font-semibold text-[var(--color-text-primary)] tracking-tight font-sans">
            Prakriti AI
          </span>
        </div>
        <button
          onClick={onGetStarted}
          className="btn-primary text-sm py-2 px-4"
        >
          Sign in <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-20 pb-16 overflow-hidden">
        {/* Subtle background texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(rgba(78,136,98,0.06) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(78,136,98,0.07) 0%, transparent 70%)' }}
        />

        <div className="relative max-w-4xl mx-auto text-center space-y-8 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent-light)] inline-block" />
            Environmental AI · Grounded in peer-reviewed science
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[var(--color-text-primary)] leading-[1.1]">
            Nature intelligence
            <br />
            <span style={{ color: 'var(--color-accent-light)' }}>for the real world</span>
          </h1>

          <p className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed font-light">
            Ask questions about soil health, carbon sequestration, biodiversity recovery, and sustainable land management. Answers sourced from peer-reviewed science — not guesswork.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onGetStarted}
              className="btn-primary text-base py-3 px-6 rounded-xl w-full sm:w-auto justify-center"
            >
              Get started — it's free <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#how-it-works"
              className="btn-ghost text-sm py-2.5 px-5 w-full sm:w-auto justify-center"
            >
              See how it works
            </a>
          </div>

          {/* Social proof */}
          <p className="text-xs text-[var(--color-text-muted)] pt-2">
            Powered by IPCC · IPBES · IUCN · FAO global research corpus
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
            Built for serious environmental work
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto">
            Not a generic chatbot. Purpose-built for ecological complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="feature-card p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent-light)] mb-4">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2 font-sans">
                {f.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-20 max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)] mb-4">
            How it works
          </h2>
        </div>

        <div className="space-y-6">
          {steps.map((s, i) => (
            <div
              key={i}
              className="flex gap-6 p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] feature-card"
            >
              <div className="text-3xl font-bold text-[var(--color-text-muted)] font-serif flex-shrink-0 w-12">
                {s.n}
              </div>
              <div>
                <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1.5 font-sans">
                  {s.title}
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-10 space-y-6">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center mx-auto">
              <Leaf className="w-7 h-7 text-[var(--color-accent-light)]" />
            </div>
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
              Start your first consultation
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              Free to use. No credit card required.
            </p>
            <button
              onClick={onGetStarted}
              className="btn-primary text-base py-3 px-8 rounded-xl mx-auto"
            >
              Get started <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[var(--color-border)] text-center">
        <p className="text-xs text-[var(--color-text-muted)]">
          © 2025 Prakriti AI · Inspired by{' '}
          <a href="https://darukaa.earth" target="_blank" rel="noopener noreferrer"
            className="text-[var(--color-accent-light)] hover:underline">
            Darukaa.Earth
          </a>
        </p>
      </footer>
    </div>
  );
};
