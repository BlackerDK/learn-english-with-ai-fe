export type TargetLang = 'en' | 'ja' | 'zh';

export const LANG_LABELS: Record<TargetLang, string> = {
  en: 'Tiếng Anh',
  ja: 'Tiếng Nhật',
  zh: 'Tiếng Trung',
};

export const LEVELS_BY_LANG: Record<TargetLang, string[]> = {
  en: ['Basic', 'Intermediate', 'Advanced', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'IELTS'],
  ja: ['N5', 'N4', 'N3', 'N2', 'N1'],
  zh: ['HSK1', 'HSK2', 'HSK3', 'HSK4', 'HSK5', 'HSK6', 'Basic', 'Intermediate', 'Advanced'],
};

export const DEFAULT_LEVEL_BY_LANG: Record<TargetLang, string> = {
  en: 'Intermediate',
  ja: 'N5',
  zh: 'HSK1',
};

const LEVEL_TAG_ALIASES: Record<string, string[]> = {
  Basic: ['A1', 'A2'],
  Intermediate: ['B1', 'B2', 'IELTS'],
  Advanced: ['C1', 'C2'],
};

export function getTargetLang(): TargetLang {
  const lang = localStorage.getItem('learn_target_lang') || 'en';
  if (lang === 'ja' || lang === 'zh') return lang;
  return 'en';
}

export function getStudyLevel(): string {
  const lang = getTargetLang();
  const stored = localStorage.getItem('learn_study_level');
  if (stored && LEVELS_BY_LANG[lang].includes(stored)) return stored;
  return DEFAULT_LEVEL_BY_LANG[lang];
}

export function setStudyLevel(level: string) {
  localStorage.setItem('learn_study_level', level);
}

export function getPathLabel(): string {
  return `${LANG_LABELS[getTargetLang()]} · ${getStudyLevel()}`;
}

export function vocabMatchesPath(tags: string, level: string = getStudyLevel()): boolean {
  const normalizedTags = tags
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  if (normalizedTags.length === 0) return true;

  const levelLower = level.toLowerCase();
  const aliases = (LEVEL_TAG_ALIASES[level] || []).map((a) => a.toLowerCase());
  const matchTags = [levelLower, ...aliases];

  return normalizedTags.some((tag) =>
    matchTags.some((match) => tag === match || tag.includes(match))
  );
}
