import { useState } from 'react';
import { BookOpen, Database, Trash2 } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { SettingsGroup, SettingsRow } from '../../components/ui/SettingsRow';
import { ConfirmDialog } from '../../components/Modal';
import { useOS } from '../../context/OSContext';
import { clearStore } from '../../db/indexedDB';

/**
 * Flashcard settings — deck management only.
 * All import / export / backup operations live in the Backup app.
 */
export function FlashcardSettings() {
  const { notify, openScreen } = useOS();
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <ScreenShell
      title="Flashcard settings"
      subtitle="Deck & data management"
      icon={<BookOpen className="size-[19px]" />}
      contentClassName="space-y-5"
    >
      <SettingsGroup title="Deck">
        <SettingsRow
          icon={<BookOpen className="size-[17px]" />}
          label="Decks"
          description="Create decks from the main screen while adding cards"
        />
        <SettingsRow
          icon={<Database className="size-[17px]" />}
          label="Import, export & backup"
          description="Handled by the Data Sync & Backup app"
          onClick={() => openScreen('backup', 'main')}
        />
      </SettingsGroup>

      <SettingsGroup title="Data">
        <SettingsRow
          danger
          icon={<Trash2 className="size-[17px]" />}
          label="Delete all cards"
          description="Removes every deck and card from storage"
          onClick={() => setConfirmClear(true)}
        />
      </SettingsGroup>

      <ConfirmDialog
        open={confirmClear}
        tone="danger"
        title="Delete all flashcards?"
        description="Every deck and card will be permanently removed."
        confirmLabel="Delete all"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          void clearStore('flashcards');
          setConfirmClear(false);
          notify({ title: 'All cards deleted', tone: 'warning' });
        }}
      />

      <section className="pb-2 text-center text-[11.5px] text-ink3">
        Flashcards · v2.6.0 · data via Backup
      </section>
    </ScreenShell>
  );
}
