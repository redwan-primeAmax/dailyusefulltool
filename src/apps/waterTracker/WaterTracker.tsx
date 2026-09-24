import { motion } from 'framer-motion';
import { useState } from 'react';
import { Droplets } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';
import { useWaterTracker } from './useWaterTracker';
import { WaterRing } from './components/WaterRing';
import { QuickAddBar } from './components/QuickAddBar';
import { WaterTimeline } from './components/WaterTimeline';
import { formatVolume } from '../../utils/format';
import type { VolumeUnit } from '../../types';
import {
  WaterRangeEstimatorPage,
  WaterSchedulePage,
  type WaterToolView,
} from './components/WaterTools';

/** Water Tracker — main dashboard screen. */
export function WaterTracker() {
  const { openScreen, notify } = useOS();
  const water = useWaterTracker();
  const unit: VolumeUnit = water.settings.unit;
  const [toolView, setToolView] = useState<WaterToolView>('main');
  const avg7 = water.week.reduce((sum, day) => sum + day.total, 0) / Math.max(1, water.week.length);

  const handleAdd = (ml: number, container?: string) => {
    void water.addWater(ml, container);
    notify({
      title: `${formatVolume(ml, unit)} logged`,
      description: container ? `Added from ${container.toLowerCase()}` : 'Custom entry saved',
      tone: 'success',
    });
  };

  if (toolView === 'schedule') {
    return (
      <WaterSchedulePage
        targetMl={water.settings.dailyTargetMl}
        unit={unit}
        scheduleStartMin={water.settings.scheduleStartMin}
        scheduleEndMin={water.settings.scheduleEndMin}
        scheduleStepMin={water.settings.scheduleStepMin}
        onBack={() => setToolView('main')}
      />
    );
  }

  if (toolView === 'range') {
    return (
      <WaterRangeEstimatorPage
        targetMl={water.settings.dailyTargetMl}
        unit={unit}
        scheduleStartMin={water.settings.scheduleStartMin}
        scheduleEndMin={water.settings.scheduleEndMin}
        onBack={() => setToolView('main')}
      />
    );
  }

  return (
    <ScreenShell
      title="Water Tracker"
      subtitle={`${formatVolume(water.todayMl, unit)} · goal ${formatVolume(water.settings.dailyTargetMl, unit)}`}
      icon={<Droplets className="size-[19px]" />}
      onOpenSettings={() => openScreen('water', 'settings')}
      hero={
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22 }}
        >
          <WaterRing todayMl={water.todayMl} settings={water.settings} unit={unit} />
        </motion.div>
      }
    >
      <QuickAddBar
        quickAdds={water.settings.quickAdds}
        unit={unit}
        onAdd={handleAdd}
        canUndo={water.today.length > 0}
        onUndo={() => {
          void water.undoLast();
          notify({ title: 'Last entry removed', tone: 'info' });
        }}
      />
      <WaterTimeline
        today={water.today}
        week={water.week}
        unit={unit}
        targetMl={water.settings.dailyTargetMl}
        streak={water.streak}
        avg7={avg7}
        onDelete={(id) => void water.removeLog(id)}
        showWeek={water.settings.showWeekChart}
        onOpenTool={setToolView}
      />
    </ScreenShell>
  );
}
