import { useCallback, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BookOpenCheck, CalendarDays, GraduationCap, Menu } from 'lucide-react';
import { IconButton } from '../../components/CustomButton';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';
import { AddSubjectPage } from './pages/AddSubjectPage';
import { ExamHomePage } from './pages/ExamHomePage';
import { ExamSettingsPage } from './pages/ExamSettingsPage';
import { TodayPlanPage } from './pages/TodayPlanPage';
import { ExamNavigationDrawer } from './components/ExamNavigationDrawer';
import { LiquidTransition } from './components/LiquidTransition';
import type { ExamPage } from './examModel';
import { useExamTracker } from './useExamTracker';

const PAGE_CONTENT: Record<ExamPage, { title: string; subtitle: string; icon: typeof GraduationCap }> = {
  home: { title: 'Exam Tracker', subtitle: 'Exam readiness and subject progress', icon: GraduationCap },
  today: { title: "Today's Plan", subtitle: 'Your next focused study sections', icon: CalendarDays },
  addSubject: { title: 'Add Subject', subtitle: 'Create or update an exam subject', icon: BookOpenCheck },
  settings: { title: 'Settings', subtitle: 'Gemini API configuration', icon: GraduationCap },
};

export function ExamTrackerApp() {
  const tracker = useExamTracker();
  const { notify } = useOS();
  const [page, setPage] = useState<ExamPage>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const didNavigateAfterTransition = useRef(false);
  const pageContent = PAGE_CONTENT[page];

  const navigate = useCallback((nextPage: ExamPage) => {
    setPage(nextPage);
    setMenuOpen(false);
  }, []);

  const handleLiquidComplete = useCallback(() => {
    if (didNavigateAfterTransition.current) return;
    didNavigateAfterTransition.current = true;
    setPage('today');
    setTransitioning(false);
  }, []);

  const startStudy = () => {
    didNavigateAfterTransition.current = false;
    setTransitioning(true);
  };

  const completeCategory = (subjectId: string, categoryId: string) => {
    tracker.setCategoryCompleted(subjectId, categoryId, true);
    notify({
      title: 'Section complete',
      description: 'Great work. Your exam readiness has been updated.',
      tone: 'success',
    });
  };

  return (
    <ScreenShell
      title={pageContent.title}
      subtitle={pageContent.subtitle}
      icon={<pageContent.icon className="size-5" />}
      scrollKey={page}
      contentClassName="!space-y-0 !px-0 !pt-4"
      headerActions={(
        <IconButton
          label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          aria-controls="exam-tracker-navigation"
          onClick={() => setMenuOpen((open) => !open)}
          tone="glass"
          className="rounded-xl"
        >
          <Menu className="size-5" />
        </IconButton>
      )}
    >
      {!tracker.loaded ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-5 text-center" role="status" aria-live="polite">
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-200/25 border-t-emerald-200" />
          <p className="text-sm font-medium text-slate-400">Loading your exam plan…</p>
        </div>
      ) : (
        <>
          {page === 'home' && (
            <ExamHomePage
              subjects={tracker.settings.subjects}
              onStartStudy={startStudy}
              onAddSubject={() => navigate('addSubject')}
            />
          )}
          {page === 'today' && (
            <TodayPlanPage
              subjects={tracker.settings.subjects}
              onComplete={completeCategory}
              onAddSubject={() => navigate('addSubject')}
            />
          )}
          {page === 'addSubject' && (
            <AddSubjectPage
              subjects={tracker.settings.subjects}
              geminiApiKey={tracker.settings.geminiApiKey}
              onAddSubject={tracker.addSubject}
              onRemoveSubject={tracker.removeSubject}
              onOpenSettings={() => navigate('settings')}
            />
          )}
          {page === 'settings' && (
            <ExamSettingsPage
              settings={tracker.settings}
              onUpdateApiKey={tracker.updateApiKey}
              onReset={tracker.resetAll}
            />
          )}
        </>
      )}

      <ExamNavigationDrawer
        open={menuOpen}
        currentPage={page}
        onNavigate={navigate}
        onClose={() => setMenuOpen(false)}
      />
      <AnimatePresence>
        {transitioning && <LiquidTransition onComplete={handleLiquidComplete} />}
      </AnimatePresence>
    </ScreenShell>
  );
}
