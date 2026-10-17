import { useCallback, useMemo } from 'react';
import { DEFAULT_EXAM, SETTINGS_KEYS } from '../../db/trackerService';
import { useSettings } from '../../hooks/useTracker';
import type { ExamCategory, ExamSubject } from '../../types';
import type { ParsedExamSubject } from './examModel';
import { categoryToExamCategory, createId, normalizeExamSettings, SUBJECT_COLORS } from './examModel';

export function useExamTracker() {
  const { settings: rawSettings, setSettings, reset, loaded } = useSettings(
    SETTINGS_KEYS.exam,
    DEFAULT_EXAM,
  );
  const settings = useMemo(() => normalizeExamSettings(rawSettings), [rawSettings]);

  const addSubject = useCallback((input: ParsedExamSubject): 'added' | 'updated' => {
    const existing = settings.subjects.find(
      (subject) => subject.name.toLocaleLowerCase() === input.subject.toLocaleLowerCase(),
    );
    const result: 'added' | 'updated' = existing ? 'updated' : 'added';

    setSettings((previous) => {
      const safePrevious = normalizeExamSettings(previous);
      const index = safePrevious.subjects.findIndex(
        (subject) => subject.name.toLocaleLowerCase() === input.subject.toLocaleLowerCase(),
      );
      if (index < 0) {
        const subject: ExamSubject = {
          id: createId(),
          name: input.subject,
          color: SUBJECT_COLORS[safePrevious.subjects.length % SUBJECT_COLORS.length],
          categories: input.categories.map(categoryToExamCategory),
        };
        return { ...safePrevious, subjects: [...safePrevious.subjects, subject] };
      }

      const current = safePrevious.subjects[index];
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
      const nextSubjects = [...safePrevious.subjects];
      nextSubjects[index] = { ...current, categories };
      return { ...safePrevious, subjects: nextSubjects };
    });

    return result;
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
    addSubject,
    setCategoryCompleted,
    removeSubject,
    updateApiKey,
    resetAll: reset,
  };
}
