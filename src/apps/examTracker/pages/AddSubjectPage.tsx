import { useMemo, useState } from 'react';
import { Check, Copy, FileJson2, Plus, Sparkles, Trash2, WandSparkles } from 'lucide-react';
import type { ExamSubject } from '../../../types';
import { callGeminiJson, createSubjectGenerationPrompt } from '../geminiService';
import { createSubjectJsonTemplate, validateSubjectJson } from '../examModel';
import type { ParsedExamSubject, SubjectValidationResult } from '../examModel';
import { copyTextToClipboard } from '../clipboard';
import { ErrorReport } from '../components/ErrorReport';

const CATEGORY_PRESETS: Record<string, string[]> = {
  Bengali: ['Essays', 'Comprehension', 'Poetry'],
  General: ['Core concepts', 'Practice questions', 'Revision'],
};

interface Props {
  subjects: ExamSubject[];
  geminiApiKey: string;
  onAddSubject: (subject: ParsedExamSubject) => 'added' | 'updated';
  onRemoveSubject: (subjectId: string) => void;
  onOpenSettings: () => void;
}

export function AddSubjectPage({ subjects, geminiApiKey, onAddSubject, onRemoveSubject, onOpenSettings }: Props) {
  const [subjectName, setSubjectName] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [jsonText, setJsonText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [errorContext, setErrorContext] = useState('Subject JSON validation');
  const [success, setSuccess] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [removingSubject, setRemovingSubject] = useState<string | null>(null);

  const jsonCharacterCount = jsonText.length;
  const parsedPreview = useMemo(() => {
    if (!jsonText.trim()) return null;
    const result = validateSubjectJson(jsonText, subjectName);
    return result.ok ? result.value : null;
  }, [jsonText, subjectName]);

  const updateSubjectName = (value: string) => {
    setSubjectName(value);
    setErrors([]);
    setSuccess('');
  };

  const addCategory = (value = categoryName) => {
    const category = value.trim();
    if (!category) return;
    if (categories.some((item) => item.toLocaleLowerCase() === category.toLocaleLowerCase())) {
      setErrors([`The category "${category}" is already in the category list.`]);
      setErrorContext('Category list');
      return;
    }
    if (categories.length >= 40) {
      setErrors(['A subject can contain no more than 40 categories.']);
      setErrorContext('Category list');
      return;
    }
    setCategories((current) => [...current, category]);
    setCategoryName('');
    setErrors([]);
    setSuccess('');
  };

  const applyPreset = (presetName: string) => {
    const preset = CATEGORY_PRESETS[presetName];
    if (!preset) return;
    const additions = preset.filter(
      (category) => !categories.some((item) => item.toLocaleLowerCase() === category.toLocaleLowerCase()),
    );
    const availableSlots = Math.max(0, 40 - categories.length);
    const added = additions.slice(0, availableSlots);
    setCategories((current) => [...current, ...added]);
    if (presetName === 'Bengali' && !subjectName.trim()) setSubjectName('Bengali');
    setSuccess(additions.length > added.length
      ? `Added ${added.length} ${added.length === 1 ? 'category' : 'categories'}; the 40-category limit was reached.`
      : `${presetName} categories added. You can rename or remove them before creating JSON.`);
    setErrors([]);
  };

  const buildTemplate = async () => {
    const template = createSubjectJsonTemplate(subjectName, categories);
    setJsonText(template);
    setErrors([]);
    setSuccess('Structured JSON template is ready. Review or edit it, then select Done to add the subject.');
    try {
      await copyTextToClipboard(template);
      setCopyStatus('Template copied to the clipboard.');
    } catch {
      setCopyStatus('Template is ready below. Select and copy it manually if clipboard access is unavailable.');
    }
  };

  const generateWithGemini = async () => {
    if (!geminiApiKey.trim()) {
      setErrors(['No Gemini API key is saved. Add a key in Settings before using Gemini generation.']);
      setErrorContext('Gemini API setup');
      return;
    }
    if (!subjectName.trim()) {
      setErrors(['Enter a Subject Name before generating a study plan.']);
      setErrorContext('Gemini generation');
      return;
    }
    setIsGenerating(true);
    setErrors([]);
    setErrorContext('Gemini generation');
    setSuccess('');
    try {
      const response = await callGeminiJson(
        geminiApiKey,
        createSubjectGenerationPrompt(subjectName, categories),
      );
      setJsonText(response);
      const validation = validateSubjectJson(response, subjectName);
      if (validation.ok) {
        setSuccess(`Gemini created ${validation.value.categories.length} categories. Review the JSON and select Done to save.`);
      } else {
        setErrors(validation.errors);
        setErrorContext('Gemini-generated subject JSON');
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'An unexpected error occurred while contacting Gemini.']);
    } finally {
      setIsGenerating(false);
    }
  };

  const addSubject = () => {
    const result: SubjectValidationResult = validateSubjectJson(jsonText, subjectName);
    if (!result.ok) {
      setErrors(result.errors);
      setErrorContext('Subject JSON validation');
      setSuccess('');
      return;
    }
    const alreadyExists = subjects.some(
      (subject) => subject.name.toLocaleLowerCase() === result.value.subject.toLocaleLowerCase(),
    );
    if (!alreadyExists && subjects.length >= 100) {
      setErrors(['Exam Tracker supports up to 100 subjects. Remove one before adding another.']);
      setErrorContext('Subject limit');
      setSuccess('');
      return;
    }
    const action = onAddSubject(result.value);
    setErrors([]);
    setErrorContext('Subject JSON validation');
    setCopyStatus('');
    setSuccess(`${result.value.subject} ${action === 'added' ? 'was added' : 'was updated'} with ${result.value.categories.length} ${result.value.categories.length === 1 ? 'category' : 'categories'}.`);
    setSubjectName('');
    setCategoryName('');
    setCategories([]);
    setJsonText('');
  };

  const removeSubject = (subject: ExamSubject) => {
    if (removingSubject !== subject.id) {
      setRemovingSubject(subject.id);
      return;
    }
    onRemoveSubject(subject.id);
    setRemovingSubject(null);
    setSuccess(`${subject.name} was removed from Exam Tracker.`);
  };

  return (
    <main className="space-y-5 px-4 pb-8">
      <section className="rounded-[26px] border border-violet-300/15 bg-gradient-to-br from-violet-500/10 via-slate-900/95 to-slate-950 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-violet-300/20 bg-violet-400/10 text-violet-200"><FileJson2 size={21} /></div>
          <div>
            <h2 className="text-lg font-black text-white">Build a subject plan</h2>
            <p className="mt-1 text-sm leading-5 text-slate-400">Add category-by-category guidance with structured JSON or ask Gemini to draft it.</p>
          </div>
        </div>
      </section>

      {success && (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-300/15 bg-emerald-400/[0.08] px-4 py-3 text-sm text-emerald-100" role="status" aria-live="polite">
          <Check size={16} className="mt-0.5 shrink-0 text-emerald-300" /> <span>{success}</span>
        </div>
      )}
      <ErrorReport errors={errors} context={errorContext} />

      <section className="space-y-4 rounded-[24px] border border-white/[0.08] bg-slate-900/75 p-4">
        <div>
          <label htmlFor="exam-subject-name" className="mb-2 block text-xs font-bold uppercase tracking-[0.13em] text-slate-300">Subject Name</label>
          <input
            id="exam-subject-name"
            type="text"
            name="examSubjectName"
            value={subjectName}
            onChange={(event) => updateSubjectName(event.target.value)}
            maxLength={100}
            autoComplete="off"
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            placeholder="For example, Bengali"
            className="h-12 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10"
          />
        </div>

        <div>
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-bold uppercase tracking-[0.13em] text-slate-300">Categories</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(CATEGORY_PRESETS).map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => applyPreset(preset)}
                  className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[10px] font-semibold text-slate-300 transition hover:border-emerald-300/30 hover:text-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                >
                  {preset === 'Bengali' ? 'Bengali: Essays · Comprehension · Poetry' : 'General study set'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              name="examCategoryName"
              autoComplete="off"
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addCategory(); } }}
              maxLength={80}
              placeholder="Add a category, e.g. Essays"
              aria-label="New category name"
              className="h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10"
            />
            <button
              type="button"
              onClick={() => addCategory()}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-emerald-300/20 bg-emerald-400/10 px-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-400/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
            >
              <Plus size={16} /> Add
            </button>
          </div>
          {categories.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Selected categories">
              {categories.map((category) => (
                <li key={category} className="inline-flex items-center gap-1 rounded-full border border-emerald-300/15 bg-emerald-400/[0.07] py-1 pl-3 pr-1 text-xs font-medium text-emerald-100">
                  {category}
                  <button
                    type="button"
                    aria-label={`Remove ${category} category`}
                    onClick={() => setCategories((current) => current.filter((item) => item !== category))}
                    className="grid h-6 w-6 place-items-center rounded-full text-emerald-100/70 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-200"
                  >
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-slate-500">Choose a preset or add categories one at a time.</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void buildTemplate()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/20 bg-cyan-400/[0.08] px-3 py-2.5 text-sm font-bold text-cyan-100 transition hover:bg-cyan-400/[0.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
          >
            <Copy size={16} /> Copy JSON template
          </button>
          <button
            type="button"
            disabled={!geminiApiKey.trim() || isGenerating}
            onClick={() => void generateWithGemini()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-3 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/20 transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-200 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isGenerating ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" /> : <WandSparkles size={16} />}
            {isGenerating ? 'Generating…' : 'Generate with Gemini'}
          </button>
        </div>
        {!geminiApiKey.trim() && (
          <p className="-mt-2 text-xs leading-5 text-slate-500">
            Gemini generation is off until you add an API key.{' '}
            <button type="button" onClick={onOpenSettings} className="font-semibold text-emerald-300 underline underline-offset-2 hover:text-emerald-200">Open Settings</button>
          </p>
        )}
        {copyStatus && <p className="text-xs text-cyan-200" role="status" aria-live="polite">{copyStatus}</p>}
      </section>

      <section className="space-y-3 rounded-[24px] border border-white/[0.08] bg-slate-900/75 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <label htmlFor="subject-json" className="text-sm font-bold text-white">Subject JSON</label>
            <p className="mt-1 text-xs text-slate-500">Paste or edit the JSON, then select Done.</p>
          </div>
          <span className="shrink-0 text-[10px] tabular-nums text-slate-500">{jsonCharacterCount.toLocaleString('en-US')} / 100,000</span>
        </div>
        <textarea
          id="subject-json"
          name="examSubjectJson"
          autoComplete="off"
          data-1p-ignore="true"
          data-lpignore="true"
          data-form-type="other"
          value={jsonText}
          onChange={(event) => { setJsonText(event.target.value); setErrors([]); setSuccess(''); }}
          maxLength={100_000}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder={'Paste a subject plan, or create a template above.\n\n{"subject":"Bengali","categories":[...] }'}
          className="min-h-64 w-full resize-y rounded-xl border border-white/10 bg-slate-950/80 p-3.5 font-mono text-xs leading-5 text-slate-200 outline-none placeholder:font-sans placeholder:text-slate-600 focus:border-emerald-300/50 focus:ring-2 focus:ring-emerald-300/10"
        />
        {parsedPreview && (
          <p className="flex items-center gap-1.5 text-xs text-slate-400" aria-live="polite">
            <Sparkles size={13} className="text-emerald-300" /> Valid plan preview: {parsedPreview.subject}, {parsedPreview.categories.length} {parsedPreview.categories.length === 1 ? 'category' : 'categories'}.
          </p>
        )}
        <button
          type="button"
          onClick={addSubject}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-emerald-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-100"
        >
          <Check size={17} /> Done — validate and add subject
        </button>
      </section>

      {subjects.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-bold text-white">Your subjects</h2>
            <p className="mt-1 text-xs text-slate-500">Adding a subject with the same name updates its categories and keeps completion history.</p>
          </div>
          <div className="space-y-2">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-slate-900/65 px-3.5 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">{subject.name}</p>
                    <p className="text-xs text-slate-500">{subject.categories.length} {subject.categories.length === 1 ? 'category' : 'categories'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeSubject(subject)}
                  onBlur={() => { if (removingSubject === subject.id) setRemovingSubject(null); }}
                  className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 ${removingSubject === subject.id ? 'bg-rose-400/15 text-rose-200' : 'text-slate-500 hover:bg-rose-400/10 hover:text-rose-200'}`}
                >
                  <Trash2 size={14} /> {removingSubject === subject.id ? 'Confirm remove' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
