import React, { useState } from 'react';
import {
  Leaf, Plus, MessageSquare, Trash2, LogOut, Upload,
  X, Sliders, Pin, PinOff
} from 'lucide-react';
import { Conversation, togglePinConversation } from '../../lib/conversations';
import { useAuth } from '../../lib/auth';

interface Props {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onPinToggle: (id: string, currentPinned: boolean) => void;
  onOpenDocuments: () => void;
  onOpenContextModal: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const MAX_CONVERSATIONS = 20;

export const ConversationSidebar: React.FC<Props> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onPinToggle,
  onOpenDocuments,
  onOpenContextModal,
  mobileOpen,
  onMobileClose,
}) => {
  const { user, signOut } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pinningId, setPinningId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    await onDeleteConversation(id);
    setDeletingId(null);
  };

  const handlePin = async (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation();
    setPinningId(conv.id);
    await onPinToggle(conv.id, conv.is_pinned);
    setPinningId(null);
  };

  const displayEmail = user?.email ?? '';
  const initials = displayEmail.slice(0, 2).toUpperCase() || '?';

  const pinned = conversations.filter(c => c.is_pinned);
  const unpinned = conversations.filter(c => !c.is_pinned);
  const unpinnedCount = unpinned.length;

  // Group unpinned conversations by date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const grouped = unpinned.reduce<Record<string, Conversation[]>>((acc, conv) => {
    const d = new Date(conv.updated_at);
    let bucket: string;
    if (d >= today) bucket = 'Today';
    else if (d >= yesterday) bucket = 'Yesterday';
    else if (d >= lastWeek) bucket = 'This week';
    else bucket = 'Older';
    (acc[bucket] = acc[bucket] || []).push(conv);
    return acc;
  }, {});

  const bucketOrder = ['Today', 'Yesterday', 'This week', 'Older'];

  const ConvRow = ({ conv }: { conv: Conversation }) => (
    <button
      key={conv.id}
      onClick={() => { onSelectConversation(conv.id); onMobileClose(); }}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all group ${
        conv.id === activeConversationId
          ? 'bg-[var(--color-surface-2)] text-[var(--color-text-primary)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-[var(--color-text-muted)]" />
      <span className="flex-1 truncate text-xs">{conv.title}</span>

      {/* Pin / unpin button */}
      <button
        onClick={(e) => handlePin(e, conv)}
        className={`flex-shrink-0 p-1 rounded transition-opacity ${
          conv.is_pinned || pinningId === conv.id
            ? 'opacity-100 text-[var(--color-accent-light)]'
            : 'opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)]'
        } hover:text-[var(--color-accent-light)]`}
        title={conv.is_pinned ? 'Unpin' : 'Pin conversation'}
      >
        {conv.is_pinned
          ? <PinOff className="w-3 h-3" />
          : <Pin className="w-3 h-3" />
        }
      </button>

      {/* Delete button */}
      <button
        onClick={(e) => handleDelete(e, conv.id)}
        className={`flex-shrink-0 p-1 rounded transition-opacity ${
          deletingId === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } text-[var(--color-text-muted)] hover:text-rose-400`}
        title="Delete conversation"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </button>
  );

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="p-4 flex items-center justify-between border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-[var(--color-accent-light)]" />
          </div>
          <span className="text-sm font-semibold text-[var(--color-text-primary)] tracking-tight font-sans">
            Prakriti
          </span>
        </div>
        {/* Mobile close */}
        <button
          onClick={onMobileClose}
          className="md:hidden p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-surface-2)] transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* New chat button */}
      <div className="px-3 pt-3 pb-2">
        <button
          onClick={() => { onNewConversation(); onMobileClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-2)] text-sm font-medium transition-all"
        >
          <Plus className="w-4 h-4 flex-shrink-0" />
          New research session
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {conversations.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              No sessions yet.
            </p>
          </div>
        ) : (
          <>
            {/* Pinned section */}
            {pinned.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-2 section-label flex items-center gap-1.5">
                  <Pin className="w-2.5 h-2.5" />
                  Pinned
                </div>
                {pinned.map(conv => (
                  <ConvRow key={conv.id} conv={conv} />
                ))}
              </div>
            )}

            {/* Grouped unpinned sections */}
            {bucketOrder.map(bucket => {
              const items = grouped[bucket];
              if (!items?.length) return null;
              return (
                <div key={bucket} className="mb-1">
                  <div className="px-2 py-2 section-label">
                    {bucket}
                  </div>
                  {items.map(conv => (
                    <ConvRow key={conv.id} conv={conv} />
                  ))}
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Bottom tools */}
      <div className="px-2 pb-2 border-t border-[var(--color-border)]">
        <div className="pt-2 section-label px-2 py-2">Tools</div>
        <button
          onClick={() => { onOpenDocuments(); onMobileClose(); }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition"
        >
          <Upload className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
          Knowledge base
        </button>
        <button
          onClick={() => { onOpenContextModal(); onMobileClose(); }}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition"
        >
          <Sliders className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
          Field context
        </button>
      </div>

      {/* User footer */}
      <div className="p-3 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-[var(--color-surface)] transition group">
          <div className="w-7 h-7 rounded-lg bg-[var(--color-accent)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">{displayEmail}</p>
          </div>
          <button
            onClick={signOut}
            title="Sign out"
            className="flex-shrink-0 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded-lg hover:bg-[var(--color-surface-2)] transition opacity-0 group-hover:opacity-100 touch:opacity-100"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 lg:w-72 flex-shrink-0 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex-col h-full z-20">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-72 bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
