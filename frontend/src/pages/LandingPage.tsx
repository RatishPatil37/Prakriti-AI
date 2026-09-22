import React, { useEffect, useState, useRef } from 'react';
import {
  Leaf, ArrowRight, ChevronRight, ChevronDown, ShieldCheck, BookOpen, Sprout,
  Sun, Moon, Database, CheckCircle2, Layers, Cpu, Compass, FileText,
  ExternalLink, HelpCircle
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onGetStarted: () => void;
}

const HERO_DOMAINS = [
  'soil carbon sequestration.',
  'biodiversity recovery.',
  'microclimate & agroforestry.',
  'moisture & water retention.',
  'land degradation neutrality.',
];

export const LandingPage: React.FC<Props> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggle: toggleTheme } = useTheme();

  // Typewriter effect state for hero
  const [domainIndex, setDomainIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Scroll observer for reveal animations
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const currentWord = HERO_DOMAINS[domainIndex % HERO_DOMAINS.length];
    const typingSpeed = isDeleting ? 28 : 55;
    const pauseDelay = 2200;

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (charIndex < currentWord.length) {
          setCharIndex(prev => prev + 1);
        } else {
          setTimeout(() => setIsDeleting(true), pauseDelay);
        }
      } else {
        if (charIndex > 0) {
          setCharIndex(prev => prev - 1);
        } else {
          setIsDeleting(false);
          setDomainIndex(prev => (prev + 1) % HERO_DOMAINS.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, domainIndex]);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.12 }
    );

    const revealElements = document.querySelectorAll('.scroll-reveal');
    revealElements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  const currentDomainText = HERO_DOMAINS[domainIndex % HERO_DOMAINS.length].slice(0, charIndex);

  const pillars = [
    {
      icon: <Database className="w-5 h-5 text-emerald-400" />,
      tag: 'Hybrid Retrieval',
      title: 'Dense & Sparse Rank Fusion',
      desc: 'Combines contextual dense vectors (bge-small-en) with lexical BM25 token frequencies via Reciprocal Rank Fusion to ensure zero relevant ecological passages are missed.',
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-teal-400" />,
      tag: 'Citation Gate',
      title: 'Zero Bogus Grounding',
      desc: 'Uncited search results are stripped before rendering. Conversational greetings and out-of-scope prompts return clean responses with zero fabricated citations.',
    },
    {
      icon: <BookOpen className="w-5 h-5 text-emerald-400" />,
      tag: 'Scientific Corpus',
      title: 'IPCC, IPBES & IUCN Reports',
      desc: 'All core evidence is derived from authoritative, peer-reviewed assessments covering global land degradation, biodiversity conservation, and agricultural resilience.',
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-cyan-400" />,
      tag: 'Tenant Isolation',
      title: 'Private Field Document Vault',
      desc: 'Securely upload custom farm soil audits, hydrological surveys, and regional GIS maps into an isolated vector partition that is never shared or leaked.',
    },
  ];

  const domains = [
    {
      title: 'Soil Organic Carbon (SOC)',
      desc: 'Understand microbial carbon stabilization, humification, and tillage reduction dynamics across variable soil textures.',
      metrics: 'SOC % · Microbial biomass · Bulk density',
    },
    {
      title: 'Biodiversity & Native Buffers',
      desc: 'Design ecological hedgerows, pollinator corridors, and multi-trophic habitat structures to reverse agricultural monoculture.',
      metrics: 'Species richness · Pollinator density · Trophic levels',
    },
    {
      title: 'Canopy Agroforestry & Microclimate',
      desc: 'Optimize intercropping arrangements to buffer vapor pressure deficits and moderate soil surface temperatures.',
      metrics: 'VPD buffering · Canopy strata · Radiative cooling',
    },
    {
      title: 'Moisture Retention & Infiltration',
      desc: 'Evaluate residue mulch retention, swales, and deep-rooting species to maximize volumetric water content in drylands.',
      metrics: 'Infiltration rate · VWC · Runoff mitigation',
    },
    {
      title: 'Land Degradation Neutrality (LDN)',
      desc: 'Formulate site-specific remediation plans aligned with UNCCD targets for degraded arable lands and semi-arid basins.',
      metrics: 'Erosion index · Salinization risk · Vegetation index',
    },
    {
      title: 'Soil Microbiome & Mycorrhizae',
      desc: 'Harness arbuscular mycorrhizal networks and nitrogen-fixing associations to lower synthetic fertilizer dependency.',
      metrics: 'Glomalin production · Symbiosis index · N-fixation rate',
    },
  ];

  const steps = [
    {
      num: '01',
      title: 'Define Site Conditions',
      desc: 'Specify your local realities: climate zone, annual precipitation, soil texture, pH, and historical tillage practices. Or attach your lab soil test.',
    },
    {
      num: '02',
      title: 'Scientific Hybrid Search',
      desc: 'Prakriti queries both our global scientific knowledge repository and your private vault using hybrid lexical-semantic rank fusion.',
    },
    {
      num: '03',
      title: 'Verified Ecological Guidance',
      desc: 'Receive clear, deterministic recommendations with inline citations [S1] linking directly to DOI-registered scientific literature.',
    },
  ];

  const faqs = [
    {
      q: 'What is Prakriti AI?',
      a: 'Prakriti AI is an evidence-grounded environmental research intelligence platform designed to assist agronomists, ecologists, farmers, and researchers with verifiable scientific answers regarding soil health, biodiversity, carbon sequestration, and ecological restoration.',
    },
    {
      q: 'How does Prakriti AI ensure scientific grounding without hallucinations?',
      a: 'Prakriti AI uses a multi-stage hybrid retrieval architecture combining dense semantic vectors with sparse BM25 token frequencies via Reciprocal Rank Fusion (RRF). All model responses are verified against an immutable evidence manifest, and uncited search results or out-of-scope queries are strictly filtered out.',
    },
    {
      q: 'Can I upload my own soil test reports or farm surveys?',
      a: 'Yes. Authenticated users can upload private PDF, TXT, or MD documents (up to 25MB). These documents are partitioned inside an isolated vector tenant that is never shared with or exposed to any other users.',
    },
    {
      q: 'Which scientific organizations ground Prakriti AI\'s citations?',
      a: 'Prakriti AI grounds responses in peer-reviewed scientific reports and assessments from authoritative bodies including the IPCC, IPBES, FAO, IUCN, and international agroecological research bodies.',
    },
    {
      q: 'How does the hybrid search mechanism work?',
      a: 'When you ask a question, Prakriti generates both high-dimensional dense embeddings (capturing semantic intent) and BM25 sparse vectors (capturing exact scientific terms and Latin species names). Qdrant performs Reciprocal Rank Fusion to rank and select the highest-quality candidate evidence.',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)] selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Fixed Navigation */}
      <nav className={`landing-nav px-6 md:px-12 py-3.5 flex items-center justify-between ${scrolled ? 'scrolled' : ''}`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center shadow-sm">
            <Leaf className="w-4 h-4 text-[var(--color-accent-light)]" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-tight text-[var(--color-text-primary)] font-sans">
              Prakriti AI
            </span>
            <span className="text-[10px] font-mono text-[var(--color-text-muted)] -mt-0.5">
              Ecological Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border border-[var(--color-border)] transition cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Launch Portal CTA */}
          <button
            onClick={onGetStarted}
            className="btn-emerald-glow text-xs py-2 px-4 cursor-pointer"
          >
            <span>Research Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[92vh] flex items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: 'radial-gradient(rgba(46,125,82,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Ambient subtle light gradient */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[720px] rounded-full pointer-events-none blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #2E7D52 0%, transparent 65%)' }}
        />

        <div className="relative max-w-4xl mx-auto text-center space-y-8 animate-fadeIn z-10">
          {/* Scientific Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono text-[var(--color-text-secondary)] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
            <span>Grounded in IPCC · IPBES · IUCN · FAO Peer-Reviewed Science</span>
          </div>

          {/* Main Title with Typewriter */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[var(--color-text-primary)] leading-[1.15]">
            Scientific intelligence for
            <br />
            <span className="inline-block min-h-[1.2em] text-emerald-400 font-serif font-normal italic">
              {currentDomainText}
              <span className="w-1.5 h-10 ml-1 bg-emerald-400 inline-block animate-pulse align-middle" />
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed font-light">
            Ask precise questions regarding soil organic carbon, moisture retention, pollinator buffers,
            and ecosystem restoration. Grounded strictly in verified empirical literature — zero hallucinations tolerated.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={onGetStarted}
              className="btn-emerald-glow text-sm py-3 px-6 w-full sm:w-auto justify-center cursor-pointer"
            >
              <span>Launch Research Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#architecture"
              className="btn-ghost text-xs py-3 px-5 rounded-xl w-full sm:w-auto justify-center font-mono hover:border-emerald-500/40 transition"
            >
              Explore Architecture & Citations
            </a>
          </div>

          {/* Technical Specs Bar */}
          <div className="pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto text-left">
            <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <p className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Grounding</p>
              <p className="text-xs font-semibold text-[var(--color-text-primary)] mt-0.5">100% Peer-Reviewed</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <p className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Retrieval</p>
              <p className="text-xs font-semibold text-[var(--color-text-primary)] mt-0.5">Dense + BM25 RRF</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <p className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Hallucinations</p>
              <p className="text-xs font-semibold text-emerald-400 mt-0.5">Citation-Gated (0%)</p>
            </div>
            <div className="p-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
              <p className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase">Privacy</p>
              <p className="text-xs font-semibold text-[var(--color-text-primary)] mt-0.5">Tenant-Isolated Vault</p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture & Verification Section */}
      <section id="architecture" className="px-6 md:px-12 py-24 max-w-6xl mx-auto">
        <div className="text-center mb-16 space-y-3 scroll-reveal">
          <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-widest">
            Deterministic Scientific Pipeline
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]">
            Engineered to eliminate AI guesswork
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
            Generic LLMs invent agricultural facts and hallucinate citations. Prakriti uses a multi-stage evidence gate to guarantee truthfulness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pillars.map((p, i) => (
            <div
              key={i}
              className="scroll-reveal p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-emerald-500/30 transition-all shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center">
                  {p.icon}
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                  {p.tag}
                </span>
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                {p.title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Core Ecological Domains */}
      <section id="domains" className="px-6 md:px-12 py-20 max-w-6xl mx-auto border-t border-[var(--color-border)]">
        <div className="text-center mb-16 space-y-3 scroll-reveal">
          <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-widest">
            Scope of Analysis
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]">
            Comprehensive ecological scope
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto leading-relaxed">
            From degraded semi-arid soils to complex riparian zones, explore questions with deep empirical backing.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {domains.map((d, i) => (
            <div
              key={i}
              className="scroll-reveal feature-card p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {d.title}
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {d.desc}
                </p>
              </div>
              <div className="pt-3 border-t border-[var(--color-border)]">
                <span className="text-[11px] font-mono text-emerald-400/90 font-medium">
                  {d.metrics}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works: 3-Step Methodology */}
      <section id="workflow" className="px-6 md:px-12 py-24 max-w-5xl mx-auto border-t border-[var(--color-border)]">
        <div className="text-center mb-16 space-y-3 scroll-reveal">
          <span className="text-xs font-mono font-semibold text-emerald-400 uppercase tracking-widest">
            Workflow
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]">
            How a consultation works
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div
              key={i}
              className="scroll-reveal p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] feature-card space-y-3"
            >
              <div className="text-2xl font-bold font-mono text-emerald-400">
                {s.num}
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
                {s.title}
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) Section for Google SEO & User Trust */}
      <section id="faq" className="px-6 md:px-12 py-24 max-w-4xl mx-auto border-t border-[var(--color-border)]">
        <div className="text-center mb-14 space-y-3 scroll-reveal">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] text-xs font-mono text-emerald-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]">
            Everything you need to know about Prakriti AI
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-lg mx-auto">
            Scientific evidence boundaries, hybrid vector retrieval, and private field document security.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="scroll-reveal rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-emerald-500/30 transition-colors overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 cursor-pointer"
                  aria-expanded={isOpen}
                >
                  <h3 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
                    {faq.q}
                  </h3>
                  <div className={`p-1.5 rounded-lg bg-[var(--color-surface-2)] text-[var(--color-text-muted)] transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border)]/40 animate-fadeIn">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Card */}
      <section className="px-6 py-20">
        <div className="max-w-3xl mx-auto text-center scroll-reveal">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-emerald-500/30 rounded-3xl p-10 md:p-14 space-y-6 shadow-xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center mx-auto shadow-sm">
              <Leaf className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">
                Ready for verified ecological intelligence?
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-md mx-auto">
                No credit card required. Free access to public scientific synthesis.
              </p>
            </div>
            <button
              onClick={onGetStarted}
              className="btn-emerald-glow text-sm py-3 px-8 mx-auto cursor-pointer"
            >
              <span>Open Research Workspace</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-10 border-t border-[var(--color-border)] text-center space-y-2">
        <p className="text-xs text-[var(--color-text-muted)] font-mono">
          © 2025–2026 Prakriti AI · Grounded in IPCC, IPBES & IUCN Scientific Literature
        </p>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Inspired by{' '}
          <a
            href="https://darukaa.earth"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:underline inline-flex items-center gap-0.5"
          >
            Darukaa.Earth <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
