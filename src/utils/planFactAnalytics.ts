import type { PlanFactRecord } from '../types/domain';

export type ActivityKey = 'audits' | 'adminDays' | 'negotiations';

export type ActivityMetric = {
  key: ActivityKey;
  label: string;
  unit: string;
  plan: number;
  actual?: number;
  completion?: number;
  status: 'Немає факту' | 'Потребує уваги' | 'В процесі' | 'Виконано' | 'Перевиконано';
  hint: string;
};

export const activityMeta = {
  audits: {
    label: 'Аудити / Сторчеки',
    unit: 'візитів',
  },
  adminDays: {
    label: 'Адміністративні дні',
    unit: 'днів',
  },
  negotiations: {
    label: 'Перемовини',
    unit: 'перемовин',
  },
} satisfies Record<ActivityKey, { label: string; unit: string }>;

export function calculateCompletion(plan: number, actual?: number) {
  if (actual === undefined || plan === 0) {
    return undefined;
  }

  return Math.round((actual / plan) * 100);
}

export function getStatus(completion?: number, hasActual = completion !== undefined) {
  if (!hasActual) return 'Немає факту';
  if (completion === undefined) return 'Виконано';
  if (completion < 80) return 'Потребує уваги';
  if (completion < 100) return 'В процесі';
  if (completion === 100) return 'Виконано';
  return 'Перевиконано';
}

export function getActivityHint(plan: number, actual: number | undefined, unit: string) {
  if (actual === undefined) {
    return 'Факт ще не завантажено. Після імпорту даних тут зʼявиться виконання.';
  }

  const delta = plan - actual;

  if (delta > 0) {
    return `До виконання плану залишилось ${delta} ${unit}.`;
  }

  if (delta === 0) {
    return 'План виконано.';
  }

  return `План перевиконано на ${Math.abs(delta)}.`;
}

export function getRecommendation(completion?: number) {
  if (completion === undefined) {
    return 'Факт за попередні періоди ще не завантажено. Заповніть план на основі управлінського рішення.';
  }

  if (completion < 80) {
    return 'Виконання нижче плану. Рекомендуємо не підвищувати план без додаткового обґрунтування.';
  }

  if (completion < 100) {
    return 'План майже виконано. Можна залишити план на поточному рівні або помірно збільшити.';
  }

  if (completion === 100) {
    return 'План виконано. Можна залишити план на тому ж рівні або збільшити в межах 5–10%.';
  }

  return 'План перевиконано. Можна розглянути збільшення плану на наступний період.';
}

export function buildActivityMetrics(record: PlanFactRecord): ActivityMetric[] {
  if (!record.plan) {
    return [];
  }

  const values = {
    audits: {
      plan: record.plan.auditsCount,
      actual: record.actual?.actualAuditsCount,
    },
    adminDays: {
      plan: record.plan.adminDaysCount,
      actual: record.actual?.actualAdminDaysCount,
    },
    negotiations: {
      plan: record.plan.negotiationsCount,
      actual: record.actual?.actualNegotiationsCount,
    },
  } satisfies Record<ActivityKey, { plan: number; actual?: number }>;

  return (Object.keys(values) as ActivityKey[]).map((key) => {
    const completion = calculateCompletion(values[key].plan, values[key].actual);

    return {
      key,
      label: activityMeta[key].label,
      unit: activityMeta[key].unit,
      plan: values[key].plan,
      actual: values[key].actual,
      completion,
      status: getStatus(completion, values[key].actual !== undefined),
      hint: getActivityHint(values[key].plan, values[key].actual, activityMeta[key].unit),
    };
  });
}

export function getOverallCompletion(metrics: ActivityMetric[]) {
  const available = metrics
    .map((metric) => metric.completion)
    .filter((completion): completion is number => completion !== undefined);

  if (available.length === 0) {
    return undefined;
  }

  return Math.round(available.reduce((sum, value) => sum + value, 0) / available.length);
}
