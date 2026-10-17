import { useCallback, useMemo } from 'react';
import { DEFAULT_EXAM, SETTINGS_KEYS } from '../../db/trackerService';
import { useSettings } from '../../hooks/useTracker';
import type { ExamCategory } from '../../types';
import type { ParsedExamSubject } from './examModel';
import { categoryToExamCategory, createId, normalizeExamSettings, SUBJECT_COLORS } from './examModel';

export function useExamTracker() {
  const { settings: rawSettings, setSettings, reset, loaded } = useSettings(
    SETTINGS_KEYS.exam,
    DEFAULT_EXAM,
  );
  const settings = useMemo(() => normalizeExamSettings(rawSettings), [rawSettings]);

  const addSubjects = useCallback((inputs: ParsedExamSubject[]): { added: number; updated: number } => {
    const existingNames = new Set(settings.subjects.map((subject) => subject.name.toLocaleLowerCase()));
    let added = 0;
    let updated = 0;
    for (const input of inputs) {
      const normalizedName = input.subject.toLocaleLowerCase();
      if (existingNames.has(normalizedName)) updated += 1;
      else {
        added += 1;
        existingNames.add(normalizedName);
      }
    }

    setSettings((previous) => {
      const safePrevious = normalizeExamSettings(previous);
      const nextSubjects = [...safePrevious.subjects];
      for (const input of inputs) {
        const index = nextSubjects.findIndex(
          (subject) => subject.name.toLocaleLowerCase() === input.subject.toLocaleLowerCase(),
        );
        if (index < 0) {
          if (nextSubjects.length >= 100) continue;
          nextSubjects.push({
            id: createId(),
            name: input.subject,
            color: SUBJECT_COLORS[nextSubjects.length % SUBJECT_COLORS.length],
            categories: input.categories.map(categoryToExamCategory),
          });
          continue;
        }

        const current = nextSubjects[index];
        const categories = input.categories.map((incoming) => {
          const prior = current.categories.find(
            (category) => category.name.toLocaleLowerCase() === incoming.name.toLocaleLowerCase(),
          );
          return prior
            ? {
              ...categoryToExamCategory(incoming),
              id: prior.id,
              completed: prior.completed,
              ...(prior.completedAt ? { completedAt: prior.completedAt } : {}),
            }
            : categoryToExamCategory(incoming);
        });
        nextSubjects[index] = { ...current, categories };
      }
      return { ...safePrevious, subjects: nextSubjects };
    });

    return { added, updated };
  }, [setSettings, settings.subjects]);

  const setCategoryCompleted = useCallback((subjectId: string, categoryId: string, completed: boolean) => {
    setSettings((previous) => {
      const safePrevious = normalizeExamSettings(previous);
      return {
        ...safePrevious,
        subjects: safePrevious.subjects.map((subject) => subject.id !== subjectId ? subject : {
          ...subject,
          categories: subject.categories.map((category): ExamCategory => category.id !== categoryId
            ? category
            : {
              ...category,
              completed,
              ...(completed ? { completedAt: Date.now() } : { completedAt: undefined }),
            }),
        }),
      };
    });
  }, [setSettings]);

  const removeSubject = useCallback((subjectId: string) => {
    setSettings((previous) => {
      const safePrevious = normalizeExamSettings(previous);
      return { ...safePrevious, subjects: safePrevious.subjects.filter((subject) => subject.id !== subjectId) };
    });
  }, [setSettings]);

  const updateApiKey = useCallback((geminiApiKey: string) => {
    setSettings((previous) => ({ ...normalizeExamSettings(previous), geminiApiKey }));
  }, [setSettings]);

  return {
    settings,
    loaded,
    addSubjects,
    setCategoryCompleted,
    removeSubject,
    updateApiKey,
    resetAll: reset,
  };
}
