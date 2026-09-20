import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Sliders, Upload, BookOpen, Sun, Moon, Plus,
  Sparkles, Compass, Check, ArrowRight
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface CommandItem {
  id: string;
  category: 'Presets' | 'Workspace' | 'Tools' | 'Preferences';
  label: string;
  detail?: string;
  icon: React.ReactNode;
  action: () => void;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNewSession: () => void;
  onOpenContext: () => void;
  onOpenDocuments: () => void;
  onToggleSources: () => void;
  onStartTour: () => void;
  onApplyPreset: (preset: 'semi_arid_wheat' | 'degraded_pasture') => void;
}

export const CommandPalette: React.FC<Props> = ({
  isOpen,
  onClose,
  onNewSession,
  onOpenContext,
  onOpenDocuments,
  onToggleSources,
  onStartTour,
  onApplyPreset,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  const commands: CommandItem[] = [
    {
      id: 'new_session',
      category: 'Workspace',
      label: 'New Research Session',
      detail: 'Clear conversation and start fresh scientific inquiry',
      icon: <Plus className="w-4 h-4 text-emerald-400" />,
      action: () => { onNewSession(); onClose(); },
    },
    {
      id: 'tour',
      category: 'Workspace',
      label: 'Start Interactive Workspace Tour',
      detail: 'Replay the guided spotlight walkthrough for site parameters & citations',
      icon: <Compass className="w-4 h-4 text-cyan-400" />,
      action: () => { onStartTour(); onClose(); },
    },
    {
      id: 'preset_semi_arid',
      category: 'Presets',
      label: 'Apply Preset: Semi-Arid Vertisol',
      detail: 'SOC 0.3% · 350mm rainfall · Semi-arid wheat baseline',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      action: () => { onApplyPreset('semi_arid_wheat'); onClose(); },
    },
    {
      id: 'preset_pasture',
      category: 'Presets',
      label: 'Apply Preset: Degraded Pasture',
      detail: 'SOC 0.45% · 550mm rainfall · Deccan dry zone silvopasture',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => { onApplyPreset('degraded_pasture'); onClose(); },
    },
    {
      id: 'context',
      category: 'Tools',
      label: 'Calibrate Field Context Parameters',
      detail: 'Adjust soil texture, pH, annual rainfall, and climate zone',
      icon: <Sliders className="w-4 h-4 text-[var(--color-accent-light)]" />,
      action: () => { onOpenContext(); onClose(); },
    },
    {
      id: 'documents',
      category: 'Tools',
      label: 'Open Field Knowledge Base (Vault)',
      detail: 'Manage uploaded private soil surveys and PDF reports',
      icon: <Upload className="w-4 h-4 text-[var(--color-text-muted)]" />,
      action: () => { onOpenDocuments(); onClose(); },
    },
    {
      id: 'sources',
      category: 'Tools',
      label: 'Toggle Evidence Rail',
      detail: 'Expand or collapse grounded scientific citations and excerpts',
      icon: <BookOpen className="w-4 h-4 text-[var(--color-accent-light)]" />,
      action: () => { onToggleSources(); onClose(); },
    },
    {
      id: 'theme',
      category: 'Preferences',
      label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      detail: 'Toggle between Obsidian Botanical and Warm Paper themes',
      icon: theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-400" />,
      action: () => { toggleTheme(); onClose(); },
    },
  ];

  const filtered = commands.filter(c =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.detail?.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % (filtered.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filtered.length) % (filtered.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filtered[selectedIndex];
        if (cmd) cmd.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-slideUp">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--color-border)]">
          <Search className="w-4 h-4 text-[var(--color-text-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, tool, or baseline preset..."
            className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none font-sans"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-muted)] bg-[var(--color-surface-2)] rounded border border-[var(--color-border)]">
            ESC
          </kbd>
        </div>

        {/* Command Items List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[var(--color-border)]/40">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--color-text-muted)] font-mono">
              No matching commands or benchmarks found.
            </div>
          ) : (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  type="button"
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                        {cmd.label}
                      </p>
                      {cmd.detail && (
                        <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                          {cmd.detail}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--color-text-muted)] uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--color-surface)]/60 border border-[var(--color-border)]/60 flex-shrink-0">
                    {cmd.category}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-[var(--color-surface-2)]/60 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)] font-mono">
          <span>Navigate with ↑↓</span>
          <span>Enter to select</span>
        </div>
      </div>
    </div>
  );
};
