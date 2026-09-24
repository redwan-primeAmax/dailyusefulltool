import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search, Edit3, X } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { writeRecord, readAll, deleteRecord } from '../../db/indexedDB';
import { uid } from '../../utils/format';
import { relativeTime } from '../../utils/date';
import { useOS } from '../../context/OSContext';

interface Note {
  id: string;
  ts: number;
  dateKey: string;
  title: string;
  body: string;
  color: string;
  pinned: boolean;
}

const COLORS = ['#1e293b','#1a2a1a','#2a1a1a','#1a1a2a','#2a2a1a','#1a2a2a'];
const COLOR_LABELS = ['Slate','Forest','Rose','Ink','Gold','Teal'];

const STORE = 'notes';

export function NotesApp() {
  const { notify, openScreen } = useOS();
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Note | null>(null);

  useEffect(() => {
    readAll<Note>(STORE).then(ns => setNotes(ns.sort((a,b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.ts - a.ts)));
  }, []);

  const openNew = () => {
    const n: Note = { id: uid(), ts: Date.now(), dateKey: '', title: '', body: '', color: COLORS[0], pinned: false };
    setEditing(n);
  };

  const save = async (n: Note) => {
    const updated = { ...n, ts: n.ts || Date.now() };
    await writeRecord(STORE, updated as { id: string });
    setNotes(prev => {
      const filtered = prev.filter(x => x.id !== n.id);
      const sorted = [updated, ...filtered].sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0)||b.ts-a.ts);
      return sorted;
    });
    setEditing(null);
    notify({ title: 'Note saved', tone: 'success' });
  };

  const remove = async (id: string) => {
    await deleteRecord(STORE, id);
    setNotes(prev => prev.filter(n => n.id !== id));
    notify({ title: 'Note deleted', tone: 'warning' });
  };

  const togglePin = async (note: Note) => {
    const updated = { ...note, pinned: !note.pinned };
    await writeRecord(STORE, updated as { id: string });
    setNotes(prev => prev.map(n => n.id === note.id ? updated : n).sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0)||b.ts-a.ts));
  };

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(query.toLowerCase()) || n.body.toLowerCase().includes(query.toLowerCase())
  );

  if (editing) {
    return <NoteEditor note={editing} onSave={save} onDiscard={() => setEditing(null)} />;
  }

  return (
    <ScreenShell title="Notes" subtitle={`${notes.length} note${notes.length !== 1 ? 's' : ''}`}
      icon={<Edit3 className="size-4" />}
      contentClassName="!space-y-4"
      onOpenSettings={() => openScreen('notes', 'settings')}
    >
      <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-surface2/80 px-4 py-3">
        <Search className="size-4 text-ink3" />
        <input type="search" name="notes-search" autoComplete="off" autoCorrect="off" spellCheck={false}
          data-1p-ignore="true" data-lpignore="true" data-form-type="other"
          value={query} onChange={e => setQuery(e.target.value)} placeholder="Search notes…"
          className="flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink3" />
        {query && <button type="button" onClick={() => setQuery('')}><X className="size-4 text-ink3" /></button>}
      </div>

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center">
            <Edit3 className="size-10 mx-auto text-ink3 mb-3" />
            <p className="text-[15px] font-semibold text-ink">{query ? 'No results' : 'No notes yet'}</p>
            <p className="text-[12px] text-ink3 mt-1">{query ? 'Try a different search' : 'Tap + to create your first note'}</p>
          </motion.div>
        )}
        <div className="columns-2 gap-3">
          {filtered.map((note, i) => (
            <motion.div key={note.id} layout
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }} transition={{ delay: i * 0.03 }}
              onClick={() => setEditing(note)}
              className="mb-3 break-inside-avoid cursor-pointer rounded-2xl border border-hairline p-3.5 hover:scale-[1.02] transition-transform"
              style={{ background: note.color }}>
              {note.pinned && <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">📌 Pinned</span>}
              {note.title && <p className="text-[14px] font-semibold text-white line-clamp-2 mt-0.5">{note.title}</p>}
              <p className="text-[12px] text-white/70 mt-1 line-clamp-4">{note.body || 'Empty note'}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-white/40">{relativeTime(note.ts)}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={e => { e.stopPropagation(); void togglePin(note); }}
                    className="p-1 rounded-full hover:bg-white/10 text-white/50 text-[11px]">📌</button>
                  <button type="button" onClick={e => { e.stopPropagation(); void remove(note.id); }}
                    className="p-1 rounded-full hover:bg-red-500/20">
                    <Trash2 className="size-3.5 text-red-300" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={openNew}
        className="fixed bottom-24 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-accent shadow-2xl shadow-accent/40 text-white">
        <Plus className="size-6" />
      </motion.button>
    </ScreenShell>
  );
}

function NoteEditor({ note, onSave, onDiscard }: { note: Note; onSave: (n: Note) => void; onDiscard: () => void }) {
  const [draft, setDraft] = useState(note);

  return (
    <div className="flex h-full flex-col bg-surface" style={{ background: draft.color }}>
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button type="button" onClick={onDiscard} className="text-[13px] font-semibold text-white/60">Cancel</button>
        <span className="text-[14px] font-bold text-white">{draft.id ? 'Edit Note' : 'New Note'}</span>
        <button type="button" onClick={() => onSave(draft)} className="text-[13px] font-bold text-accent">Save</button>
      </header>

      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2">
        {COLORS.map((c, i) => (
          <button key={c} type="button" onClick={() => setDraft(d => ({ ...d, color: c }))}
            className="size-6 rounded-full shrink-0 border-2 transition-all"
            style={{ background: c, borderColor: draft.color === c ? '#fff' : 'transparent' }}
            aria-label={COLOR_LABELS[i]} />
        ))}
      </div>

      <input type="text" name="note-title" autoComplete="off" autoCorrect="off" spellCheck={true}
        data-1p-ignore="true" data-lpignore="true" data-form-type="other"
        value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
        placeholder="Title"
        className="px-4 py-3 bg-transparent text-[20px] font-bold text-white outline-none placeholder:text-white/30" />
      <textarea name="note-body" autoComplete="off" autoCorrect="off" data-1p-ignore="true" data-lpignore="true" data-form-type="other"
        value={draft.body} onChange={e => setDraft(d => ({ ...d, body: e.target.value }))}
        placeholder="Start writing…"
        className="flex-1 resize-none px-4 py-2 bg-transparent text-[15px] text-white/80 outline-none placeholder:text-white/30 leading-relaxed" />
    </div>
  );
}
