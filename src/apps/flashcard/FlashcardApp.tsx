import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Check, X, BookOpen } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { writeRecord, readAll, deleteRecord } from '../../db/indexedDB';
import { uid } from '../../utils/format';
import { useOS } from '../../context/OSContext';
import { Modal } from '../../components/Modal';
import { CustomButton } from '../../components/CustomButton';

interface Flashcard {
  id: string;
  ts: number;
  dateKey: string;
  front: string;
  back: string;
  deck: string;
  known: boolean;
  reviewCount: number;
}

const FC_STORE = 'flashcards';
const DECK_COLORS: Record<string, string> = { General: '#0ea5e9', Science: '#06b6d4', Languages: '#f59e0b', History: '#eab308', Math: '#22c55e' };

export function FlashcardApp() {
  const { notify, openScreen } = useOS();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [deck, setDeck] = useState('General');
  const [studyMode, setStudyMode] = useState(false);
  const [studyCards, setStudyCards] = useState<Flashcard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState({ front: '', back: '', deck: 'General' });

  useEffect(() => {
    readAll<Flashcard>(FC_STORE).then(cs => setCards(cs.sort((a, b) => b.ts - a.ts)));
  }, []);

  const startStudy = () => {
    const shuffled = [...cards.filter(c => c.deck === deck)].sort(() => Math.random() - 0.5);
    if (shuffled.length === 0) { notify({ title: 'No cards in this deck', tone: 'warning' }); return; }
    setStudyCards(shuffled);
    setIdx(0); setFlipped(false); setStudyMode(true);
  };

  const answer = useCallback(async (known: boolean) => {
    const card = studyCards[idx];
    const updated = { ...card, known, reviewCount: card.reviewCount + 1 };
    await writeRecord(FC_STORE, updated as { id: string });
    setCards(prev => prev.map(c => c.id === card.id ? updated : c));
    if (idx < studyCards.length - 1) { setIdx(i => i + 1); setFlipped(false); }
    else { setStudyMode(false); notify({ title: '🎉 Deck complete!', description: `${studyCards.filter(c=>c.known).length}/${studyCards.length} correct`, tone: 'success' }); }
  }, [studyCards, idx, notify]);

  const addCard = useCallback(async () => {
    if (!draft.front.trim() || !draft.back.trim()) { notify({ title: 'Fill both sides', tone: 'warning' }); return; }
    const card: Flashcard = { id: uid(), ts: Date.now(), dateKey: '', front: draft.front.trim(), back: draft.back.trim(), deck: draft.deck, known: false, reviewCount: 0 };
    await writeRecord(FC_STORE, card as { id: string });
    setCards(prev => [card, ...prev]);
    setDraft({ front: '', back: '', deck: draft.deck });
    setModalOpen(false);
    notify({ title: 'Card added', tone: 'success' });
  }, [draft, notify]);

  const remove = useCallback(async (id: string) => {
    await deleteRecord(FC_STORE, id);
    setCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const decks = [...new Set(['General', 'Science', 'Languages', 'History', 'Math', ...cards.map(c => c.deck)])];
  const deckCards = cards.filter(c => c.deck === deck);
  const knownCount = deckCards.filter(c => c.known).length;

  if (studyMode && studyCards.length > 0) {
    const card = studyCards[idx];
    return (
      <div className="flex h-full flex-col bg-surface">
        <header className="flex items-center justify-between px-4 py-3 border-b border-hairline">
          <button type="button" onClick={() => setStudyMode(false)} className="text-[13px] font-semibold text-ink3">Exit</button>
          <span className="text-[13px] font-bold text-ink">{idx + 1} / {studyCards.length}</span>
          <span className="text-[11px] font-semibold" style={{ color: DECK_COLORS[deck] ?? '#0ea5e9' }}>{deck}</span>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-5">
          <div className="w-full text-center text-[11px] font-semibold uppercase tracking-wider text-ink3 mb-2">
            {flipped ? 'Answer' : 'Question'} · Tap to flip
          </div>
          <motion.div onClick={() => setFlipped(f => !f)} key={card.id + flipped}
            className="w-full min-h-[220px] card flex items-center justify-center p-6 cursor-pointer select-none"
            style={{ background: flipped ? (DECK_COLORS[deck] + '22') : undefined }}
            animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.4 }}>
            <AnimatePresence mode="wait">
              <motion.p key={String(flipped)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ transform: flipped ? 'rotateY(180deg)' : undefined }}
                className="text-[18px] font-semibold text-ink text-center leading-relaxed">
                {flipped ? card.back : card.front}
              </motion.p>
            </AnimatePresence>
          </motion.div>
          {flipped && (
            <div className="flex gap-4 w-full">
              <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => void answer(false)}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-500/15 text-red-300 font-bold text-[15px]">
                <X className="size-5" /> Missed
              </motion.button>
              <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => void answer(true)}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-emerald-500/15 text-emerald-300 font-bold text-[15px]">
                <Check className="size-5" /> Got it!
              </motion.button>
            </div>
          )}
          <div className="flex gap-1 mt-2">
            {studyCards.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i < idx ? 'bg-emerald-400' : i === idx ? 'bg-accent' : 'bg-surface3'}`} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ScreenShell title="Flashcards" subtitle={`${cards.length} cards · ${decks.length} decks`}
      icon={<BookOpen className="size-4" />} contentClassName="!space-y-4"
      onOpenSettings={() => openScreen('flashcard', 'settings')}>

      {/* Deck selector */}
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {decks.map(d => (
          <button key={d} type="button" onClick={() => setDeck(d)}
            className="shrink-0 rounded-full border px-3.5 py-1.5 text-[12px] font-bold transition-all"
            style={{ borderColor: deck === d ? (DECK_COLORS[d] ?? '#0ea5e9') : 'transparent',
              background: deck === d ? (DECK_COLORS[d] ?? '#0ea5e9') + '22' : 'transparent',
              color: deck === d ? (DECK_COLORS[d] ?? '#0ea5e9') : '#64748b' }}>
            {d} ({cards.filter(c => c.deck === d).length})
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="text-[24px] font-bold text-ink">{deckCards.length}</p>
          <p className="text-[11px] text-ink3 font-semibold">Cards in {deck}</p>
        </div>
        <div className="text-center">
          <p className="text-[24px] font-bold text-emerald-400">{knownCount}</p>
          <p className="text-[11px] text-ink3 font-semibold">Known</p>
        </div>
        <CustomButton onClick={startStudy} disabled={deckCards.length === 0}>Study Now</CustomButton>
      </div>

      {/* Card list */}
      <div className="card divide-y divide-hairline overflow-hidden">
        {deckCards.length === 0 ? (
          <div className="py-10 text-center">
            <BookOpen className="size-10 mx-auto text-ink3 mb-2" />
            <p className="text-[14px] font-semibold text-ink">No cards in this deck</p>
            <p className="text-[12px] text-ink3 mt-0.5">Tap + to add cards</p>
          </div>
        ) : deckCards.map(card => (
          <div key={card.id} className="flex items-center gap-3 px-4 py-3">
            <div className={`size-2 rounded-full shrink-0 ${card.known ? 'bg-emerald-400' : 'bg-surface3'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-ink truncate">{card.front}</p>
              <p className="text-[11px] text-ink3 truncate">{card.back}</p>
            </div>
            <button type="button" onClick={() => void remove(card.id)} className="tap p-1.5 rounded-full hover:bg-red-500/10">
              <Trash2 className="size-4 text-red-400" />
            </button>
          </div>
        ))}
      </div>

      <motion.button type="button" whileTap={{ scale: 0.92 }} onClick={() => setModalOpen(true)}
        className="fixed bottom-24 right-5 z-50 flex size-14 items-center justify-center rounded-full bg-accent shadow-2xl text-white">
        <Plus className="size-6" />
      </motion.button>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Flashcard" sheet
        footer={<>
          <CustomButton variant="ghost" fullWidth onClick={() => setModalOpen(false)}>Cancel</CustomButton>
          <CustomButton fullWidth onClick={addCard}>Add Card</CustomButton>
        </>}>
        <div className="space-y-3">
          <textarea value={draft.front} onChange={e => setDraft(d => ({ ...d, front: e.target.value }))}
            placeholder="Question / Front side"
            className="w-full h-20 rounded-2xl border border-hairline bg-surface3/60 px-4 py-3 text-[14px] text-ink outline-none placeholder:text-ink3 resize-none" />
          <textarea value={draft.back} onChange={e => setDraft(d => ({ ...d, back: e.target.value }))}
            placeholder="Answer / Back side"
            className="w-full h-20 rounded-2xl border border-hairline bg-surface3/60 px-4 py-3 text-[14px] text-ink outline-none placeholder:text-ink3 resize-none" />
          <div className="flex flex-wrap gap-2">
            {Object.keys(DECK_COLORS).map(d => (
              <button key={d} type="button" onClick={() => setDraft(prev => ({ ...prev, deck: d }))}
                className="rounded-full border px-3 py-1 text-[11px] font-bold transition-all"
                style={{ background: draft.deck === d ? DECK_COLORS[d] : 'transparent',
                  borderColor: DECK_COLORS[d], color: draft.deck === d ? '#fff' : DECK_COLORS[d] }}>
                {d}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    </ScreenShell>
  );
}
