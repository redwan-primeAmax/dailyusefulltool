import { AlertTriangle, Phone } from 'lucide-react';
import { getTargetSafetyNote } from '../addictionModel';

export function HealthSafetyCard({ presetId }: { presetId?: string }) {
  const targetNote = getTargetSafetyNote(presetId);

  return (
    <section className="overflow-hidden rounded-3xl border border-amber-500/25 bg-amber-500/[0.08]">
      <div className="flex gap-3 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-500/15 text-amber-300">
          <AlertTriangle className="size-5" />
        </span>
        <div className="min-w-0 space-y-2">
          <div>
            <p className="text-[13px] font-bold text-amber-100">Your safety comes first</p>
            {targetNote && <p className="mt-1 text-[12px] leading-relaxed text-amber-100/80">{targetNote}</p>}
          </div>
          {!targetNote && (
            <p className="text-[12px] leading-relaxed text-amber-100/80">
              Some substances and medicines can cause dangerous withdrawal or other health risks. Talk with a qualified clinician before stopping, reducing, or changing prescribed use.
            </p>
          )}
          <p className="text-[11.5px] leading-relaxed text-amber-100/75">
            This app is self-help support, not medical treatment or emergency care. Do not manage severe withdrawal alone.
          </p>
        </div>
      </div>

      <div className="border-t border-amber-500/15 bg-black/10 px-4 py-3">
        <p className="text-[11.5px] leading-relaxed text-amber-100/80">
          If there may be an overdose, trouble breathing, a seizure, severe confusion, or immediate risk of harm, contact emergency services or go to the nearest emergency department now.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <a
            href="tel:999"
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1.5 text-[11px] font-bold text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <Phone className="size-3.5" /> 999 in Bangladesh
          </a>
          <span className="text-[10.5px] text-amber-100/55">Elsewhere, use your local emergency number.</span>
        </div>
      </div>
    </section>
  );
}
