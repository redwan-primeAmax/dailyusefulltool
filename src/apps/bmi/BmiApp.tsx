import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { CircularProgress } from '../../components/CircularProgress';
import { Segmented } from '../../components/ui/controls';
import { useOS } from '../../context/OSContext';

type Unit = 'metric' | 'imperial';

const CATEGORIES = [
  { max: 18.5, label: 'Underweight', color: '#38bdf8', tip: 'Consider increasing caloric intake with nutritious foods.' },
  { max: 25.0, label: 'Normal weight', color: '#22c55e', tip: 'Great! Maintain your healthy lifestyle.' },
  { max: 30.0, label: 'Overweight', color: '#f59e0b', tip: 'Regular exercise and a balanced diet can help.' },
  { max: Infinity, label: 'Obese', color: '#ef4444', tip: 'Consult a healthcare professional for guidance.' },
];

function getCategory(bmi: number) {
  return CATEGORIES.find(c => bmi < c.max) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function BmiApp() {
  const { openScreen } = useOS();
  const [unit, setUnit] = useState<Unit>('metric');
  const [height, setHeight] = useState(170);
  const [weight, setWeight] = useState(70);
  const [heightFt, setHeightFt] = useState(5);
  const [heightIn, setHeightIn] = useState(7);
  const [weightLb, setWeightLb] = useState(154);
  const [age, setAge] = useState(25);

  // BMI = mass (kg) / height (m)². Imperial conversion: lb / in² × 703.
  const bmi = useMemo(() => {
    if (unit === 'metric') {
      const hm = height / 100;
      return weight / (hm * hm);
    }
    const totalIn = heightFt * 12 + heightIn;
    return (weightLb / (totalIn * totalIn)) * 703;
  }, [unit, height, weight, heightFt, heightIn, weightLb]);

  const bmiRounded = Math.round(bmi * 10) / 10;
  const category = getCategory(bmiRounded);
  // Ring + marker position: BMI 10→0%, 40→100% (clamped).
  const progress = (Math.min(40, Math.max(10, bmiRounded)) - 10) / 30;
  // Proportional segment widths matching the true boundary distances.
  const SEGMENTS = [
    { from: 10, to: 18.5, color: '#38bdf8' },
    { from: 18.5, to: 25, color: '#22c55e' },
    { from: 25, to: 30, color: '#f59e0b' },
    { from: 30, to: 40, color: '#ef4444' },
  ];

  const idealWeight = useMemo(() => {
    if (unit === 'metric') {
      const hm = height / 100;
      return { min: (18.5 * hm * hm).toFixed(1), max: (24.9 * hm * hm).toFixed(1) };
    } else {
      const totalIn = heightFt * 12 + heightIn;
      return {
        min: ((18.5 * totalIn * totalIn) / 703).toFixed(1),
        max: ((24.9 * totalIn * totalIn) / 703).toFixed(1),
      };
    }
  }, [unit, height, heightFt, heightIn]);

  return (
    <ScreenShell title="BMI Calculator" subtitle="Body Mass Index" icon={<Activity className="size-4" />}
      contentClassName="!space-y-5"
      onOpenSettings={() => openScreen('bmi', 'settings')}>

      <Segmented value={unit} onChange={v => setUnit(v as Unit)} ariaLabel="unit"
        options={[{ value: 'metric', label: 'Metric (kg/cm)' }, { value: 'imperial', label: 'Imperial (lb/in)' }]} />

      {/* Inputs */}
      <div className="card p-4 space-y-4">
        {unit === 'metric' ? (
          <>
            <InputSlider label="Height" value={height} onChange={setHeight} min={100} max={250} suffix="cm" />
            <InputSlider label="Weight" value={weight} onChange={setWeight} min={20} max={300} suffix="kg" />
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <InputSlider label="Feet" value={heightFt} onChange={setHeightFt} min={3} max={8} suffix="ft" />
              <InputSlider label="Inches" value={heightIn} onChange={setHeightIn} min={0} max={11} suffix="in" />
            </div>
            <InputSlider label="Weight" value={weightLb} onChange={setWeightLb} min={44} max={660} suffix="lb" />
          </>
        )}
        <InputSlider label="Age" value={age} onChange={setAge} min={5} max={100} suffix="yrs" />
      </div>

      {/* Result */}
      <div className="flex flex-col items-center gap-5 card py-6">
        <CircularProgress value={Math.max(0, Math.min(1, progress))} size={180} thickness={16}
          from={category.color} to={category.color + '99'} gradientId="bmi-ring" trackClassName="stroke-white/8">
          <div className="text-center">
            <p className="text-[38px] font-bold text-ink leading-none">{bmiRounded.toFixed(1)}</p>
            <p className="text-[11px] font-semibold text-ink3 mt-1">BMI · kg/m²</p>
          </div>
        </CircularProgress>

        <div className="text-center">
          <span className="inline-block rounded-full px-4 py-1.5 text-[13px] font-bold"
            style={{ background: category.color + '22', color: category.color }}>
            {category.label}
          </span>
          <p className="mt-2 text-[12px] text-ink3 max-w-[260px] leading-relaxed">{category.tip}</p>
        </div>

        {/* Scale — segments sized proportionally to their BMI range */}
        <div className="w-full px-2">
          <div className="relative">
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              {SEGMENTS.map((s) => (
                <div key={s.from} style={{ width: `${((s.to - s.from) / 30) * 100}%`, background: s.color }} />
              ))}
            </div>
            <div className="relative mt-0.5 h-3 text-[9px] font-semibold text-ink3">
              {[10, 18.5, 25, 30, 40].map((mark) => (
                <span key={mark} className="absolute -translate-x-1/2"
                  style={{ left: `${((mark - 10) / 30) * 100}%` }}>
                  {mark === 40 ? '40+' : mark}
                </span>
              ))}
            </div>
            <motion.span
              animate={{ left: `${progress * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 18 }}
              className="absolute -top-4 size-3 -translate-x-1/2 rounded-full ring-2 ring-white/70"
              style={{ background: category.color }}
            />
          </div>
        </div>
      </div>

      {/* Ideal weight */}
      <div className="card p-4">
        <p className="text-[12px] font-bold text-ink mb-2">Healthy Weight Range</p>
        <p className="text-[15px] font-semibold text-emerald-400">
          {idealWeight.min} – {idealWeight.max} {unit === 'metric' ? 'kg' : 'lb'}
        </p>
        <p className="text-[11px] text-ink3 mt-1">For a BMI between 18.5 and 24.9 at your height</p>
      </div>

      <p className="text-[10.5px] text-ink3 text-center">BMI is a screening tool, not a diagnostic measure.</p>
    </ScreenShell>
  );
}

function InputSlider({ label, value, onChange, min, max, suffix }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; suffix: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between">
        <span className="text-[12px] font-semibold text-ink2">{label}</span>
        <span className="text-[13px] font-bold text-ink tabular-nums">{value} <span className="text-ink3 text-[11px]">{suffix}</span></span>
      </div>
      <div className="relative flex h-7 items-center">
        <div className="absolute inset-x-0 h-2 rounded-full bg-surface3">
          <div className="h-2 rounded-full bg-gradient-to-r from-lime-400 to-emerald-400" style={{ width: `${pct}%` }} />
        </div>
        <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
          aria-label={label}
          className="relative z-10 h-7 w-full cursor-pointer appearance-none bg-transparent
            [&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-accent
            [&::-webkit-slider-thumb]:shadow-md" />
      </div>
    </div>
  );
}
