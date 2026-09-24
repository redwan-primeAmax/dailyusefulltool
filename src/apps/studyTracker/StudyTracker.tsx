import { useState } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';
import { useStudyTracker } from './useStudyTracker';
import { useSessionTimer } from './useSessionTimer';
import { StudyRing } from './components/StudyRing';
import { SessionCard } from './components/SessionCard';
import { StudyHistory } from './components/StudyHistory';
import { formatMinutes } from '../../utils/format';

/** Study Tracker — main dashboard. */
export function StudyTracker() {
  const { openScreen, notify } = useOS();
  const study = useStudyTracker();
  const [subjectId, setSubjectId] = useState(study.settings.subjects[0]?.id ?? '');

  const activeSubject = study.settings.subjects.find((s) => s.id === subjectId) ?? study.settings.subjects[0];

  const timer = useSessionTimer((seconds) => {
    const minutes = Math.round(seconds / 60);
    void study.addSession({
      minutes,
      subjectId: activeSubject?.id ?? 's1',
      note: 'Timer session',
      source: 'timer',
    });
    notify({
      title: `Saved ${formatMinutes(minutes)} of focus`,
      description: activeSubject?.name,
      tone: 'success',
    });
  });

  const avgSession =
    study.sessions.length > 0
      ? study.sessions.reduce((sum, s) => sum + s.minutes, 0) / study.sessions.length
      : 0;

  return (
    <ScreenShell
      title="Study Tracker"
      subtitle={`${formatMinutes(study.todayMinutes)} today · ${study.todaySessions.length} session${
        study.todaySessions.length === 1 ? '' : 's'
      }`}
      icon={<GraduationCap className="size-[19px]" />}
      onOpenSettings={() => openScreen('study', 'settings')}
      hero={
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        >
          <StudyRing
            todayMinutes={study.todayMinutes}
            weekMinutes={study.weekMinutes}
            sessionsToday={study.todaySessions.length}
            settings={study.settings}
            todayBySubject={study.todayBySubject}
          />
        </motion.div>
      }
    >
      <SessionCard
        status={timer.status}
        elapsed={timer.elapsed}
        subjectId={activeSubject?.id ?? ''}
        subjects={study.settings.subjects}
        presets={study.settings.quickSessions}
        defaultSessionMin={study.settings.defaultSessionMin}
        onSelectSubject={setSubjectId}
        onStart={timer.start}
        onPause={timer.pause}
        onFinish={timer.finish}
        onDiscard={timer.reset}
        onQuickLog={(minutes) => {
          void study.addSession({
            minutes,
            subjectId: activeSubject?.id ?? 's1',
            note: 'Quick log',
            source: 'quick',
          });
          notify({ title: `${minutes}m logged`, description: activeSubject?.name, tone: 'success' });
        }}
      />
      <StudyHistory
        sessions={study.sessions}
        week={study.week}
        settings={study.settings}
        todayMinutes={study.todayMinutes}
        weekMinutes={study.weekMinutes}
        avgSession={avgSession}
        streak={study.streak}
        subjectName={study.subjectName}
        subjectColor={study.subjectColor}
        onDelete={(id) => void study.removeSession(id)}
      />
    </ScreenShell>
  );
}
