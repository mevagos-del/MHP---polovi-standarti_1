import type { ChangeLogRecord, CurrentPlan, Dictionaries } from '../../types/domain';

function escapeCsvValue(value: unknown) {
  const text = String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv(fileName: string, headers: string[], rows: Record<string, unknown>[]) {
  const csv = [
    headers.map(escapeCsvValue).join(';'),
    ...rows.map((row) => headers.map((header) => escapeCsvValue(row[header])).join(';')),
  ].join('\r\n');

  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createLookups(dictionaries: Dictionaries) {
  return {
    channels: new Map(dictionaries.channels.map((channel) => [channel.code, channel.name])),
    employees: new Map(dictionaries.employees.map((employee) => [employee.id, employee.fullName])),
    months: new Map(dictionaries.months.map((month) => [month.monthCode, month.monthName])),
  };
}

export function exportCurrentPlansCsv(plans: CurrentPlan[], dictionaries: Dictionaries, monthCode: string) {
  const lookups = createLookups(dictionaries);
  const monthName = lookups.months.get(monthCode) ?? monthCode;
  const headers = [
    'Канал збуту',
    'ПІБ',
    'Місяць планування',
    'Аудити / Сторчеки',
    'Адміністративні дні',
    'Перемовини',
    'Коментар',
    'Версія',
    'Останнє оновлення',
  ];
  const rows = plans
    .filter((plan) => plan.monthCode === monthCode)
    .map((plan) => ({
      'Канал збуту': lookups.channels.get(plan.channelCode) ?? plan.channelCode,
      'ПІБ': lookups.employees.get(plan.employeeId) ?? plan.employeeId,
      'Місяць планування': monthName,
      'Аудити / Сторчеки': plan.auditsCount,
      'Адміністративні дні': plan.adminDaysCount,
      'Перемовини': plan.negotiationsCount,
      'Коментар': plan.comment,
      'Версія': plan.version,
      'Останнє оновлення': plan.updatedAt,
    }));

  downloadCsv(`Field Standards - Current Plans - ${monthName}.csv`, headers, rows);
}

export function exportChangeLogCsv(records: ChangeLogRecord[], dictionaries: Dictionaries, monthCode: string) {
  const lookups = createLookups(dictionaries);
  const monthName = lookups.months.get(monthCode) ?? monthCode;
  const headers = [
    'Канал збуту',
    'ПІБ',
    'Місяць планування',
    'Аудити / Сторчеки',
    'Адміністративні дні',
    'Перемовини',
    'Коментар',
    'Версія',
    'Тип дії',
    'Актуальний запис',
    'Дата зміни',
  ];
  const rows = records
    .filter((record) => record.monthCode === monthCode)
    .map((record) => ({
      'Канал збуту': lookups.channels.get(record.channelCode) ?? record.channelCode,
      'ПІБ': lookups.employees.get(record.employeeId) ?? record.employeeId,
      'Місяць планування': monthName,
      'Аудити / Сторчеки': record.auditsCount,
      'Адміністративні дні': record.adminDaysCount,
      'Перемовини': record.negotiationsCount,
      'Коментар': record.comment,
      'Версія': record.version,
      'Тип дії': record.actionType,
      'Актуальний запис': record.isCurrent,
      'Дата зміни': record.changedAt,
    }));

  downloadCsv(`Field Standards - Change Log - ${monthName}.csv`, headers, rows);
}
