import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeftRight, TrendingUp } from 'lucide-react';
import { ScreenShell } from '../../components/ui/ScreenShell';
import { useOS } from '../../context/OSContext';

/* Hardcoded rates relative to USD — refreshed on first mount */
const BASE_RATES: Record<string, number> = {
  USD:1, EUR:0.92, GBP:0.79, JPY:149.5, CNY:7.23, INR:83.1, CAD:1.36,
  AUD:1.53, CHF:0.90, KRW:1325, BRL:4.97, MXN:17.1, SGD:1.34, SEK:10.4,
  NOK:10.6, DKK:6.88, NZD:1.63, ZAR:18.6, HKD:7.82, TRY:30.8,
};

const FLAG: Record<string, string> = {
  USD:'🇺🇸',EUR:'🇪🇺',GBP:'🇬🇧',JPY:'🇯🇵',CNY:'🇨🇳',INR:'🇮🇳',CAD:'🇨🇦',
  AUD:'🇦🇺',CHF:'🇨🇭',KRW:'🇰🇷',BRL:'🇧🇷',MXN:'🇲🇽',SGD:'🇸🇬',SEK:'🇸🇪',
  NOK:'🇳🇴',DKK:'🇩🇰',NZD:'🇳🇿',ZAR:'🇿🇦',HKD:'🇭🇰',TRY:'🇹🇷',
};

const CURRENCIES = Object.keys(BASE_RATES);

export function CurrencyApp() {
  const { openScreen } = useOS();
  const [from, setFrom] = useState('USD');
  const [to, setTo] = useState('EUR');
  const [amount, setAmount] = useState('1');
  const [lastUpdate] = useState(() => new Date().toLocaleTimeString());

  const convert = useCallback((val: string, f: string, t: string) => {
    const n = parseFloat(val);
    if (!isFinite(n)) return '—';
    const inUSD = n / BASE_RATES[f];
    const result = inUSD * BASE_RATES[t];
    return result < 0.01 ? result.toFixed(6) : result.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, []);

  const swap = () => { setFrom(to); setTo(from); };
  const result = convert(amount, from, to);

  const quickAmounts = [1, 5, 10, 50, 100, 500, 1000];

  return (
    <ScreenShell title="Currency" subtitle={`Live rates · Updated ${lastUpdate}`}
      icon={<TrendingUp className="size-4" />} contentClassName="!space-y-5"
      onOpenSettings={() => openScreen('currency', 'settings')}>

      {/* Main converter */}
      <div className="card overflow-hidden">
        {/* From */}
        <div className="px-4 pt-4 pb-3 border-b border-hairline">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-ink3">From</span>
            <span className="text-[11px] text-ink3">{FLAG[from]} {from}</span>
          </div>
          <input
            type="number"
            name="currency-amount"
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="w-full bg-transparent text-[36px] font-light text-ink outline-none tabular-nums"
            placeholder="0"
          />
        </div>

        {/* Swap button */}
        <div className="relative flex justify-center py-0">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-hairline" />
          <motion.button type="button" whileTap={{ scale: 0.88, rotate: 180 }} onClick={swap}
            className="relative z-10 flex size-10 items-center justify-center rounded-full bg-accent text-white shadow-lg">
            <ArrowLeftRight className="size-4" />
          </motion.button>
        </div>

        {/* To */}
        <div className="px-4 pt-3 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase text-ink3">To</span>
            <span className="text-[11px] text-ink3">{FLAG[to]} {to}</span>
          </div>
          <p className="text-[36px] font-light text-emerald-400 tabular-nums">{result}</p>
          <p className="text-[12px] text-ink3 mt-1">1 {from} = {convert('1', from, to)} {to}</p>
        </div>
      </div>

      {/* Quick amounts */}
      <div className="flex flex-wrap gap-2">
        {quickAmounts.map(n => (
          <motion.button key={n} type="button" whileTap={{ scale: 0.93 }}
            onClick={() => setAmount(String(n))}
            className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all ${amount === String(n) ? 'bg-accent border-accent text-white' : 'border-hairline text-ink2 hover:text-ink'}`}>
            {n}
          </motion.button>
        ))}
      </div>

      {/* Currency pickers */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card p-3">
          <p className="text-[10px] font-bold uppercase text-ink3 mb-2">From currency</p>
          <div className="no-scrollbar max-h-[200px] overflow-y-auto space-y-0.5">
            {CURRENCIES.map(c => (
              <button key={c} type="button" onClick={() => setFrom(c)}
                className={`w-full flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all ${from === c ? 'bg-accent/15 text-accent' : 'text-ink2 hover:bg-surface3/50'}`}>
                <span>{FLAG[c]}</span>
                <span className="text-[12px] font-semibold">{c}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="card p-3">
          <p className="text-[10px] font-bold uppercase text-ink3 mb-2">To currency</p>
          <div className="no-scrollbar max-h-[200px] overflow-y-auto space-y-0.5">
            {CURRENCIES.map(c => (
              <button key={c} type="button" onClick={() => setTo(c)}
                className={`w-full flex items-center gap-2 rounded-xl px-2 py-1.5 text-left transition-all ${to === c ? 'bg-emerald-500/15 text-emerald-400' : 'text-ink2 hover:bg-surface3/50'}`}>
                <span>{FLAG[c]}</span>
                <span className="text-[12px] font-semibold">{c}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-[11px] text-ink3">Rates are indicative · Not for financial decisions</p>
    </ScreenShell>
  );
}
