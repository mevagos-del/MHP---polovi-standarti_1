import * as XLSX from 'xlsx';
import type { ActualPerformanceInput, Dictionaries } from '../../types/domain';

type ImportResult =
  | { ok: true; rows: ActualPerformanceInput[] }
  | { ok: false; errors: string[] };

const requiredColumns = [
  'period',
  'channelCode',
  'fullName',
  'actualAuditsStoreChecks',
  'actualAdministrativeDays',
  'actualNegotiations',
  'comment',
];

function isIntegerValue(value: unknown) {
  return /^\d+$/.test(String(value).trim());
}

function toNumber(value: unknown) {
  return Number(String(value).trim());
}

export async function importActualPerformanceFromExcel(file: File, dictionaries: Dictionaries): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const errors: string[] = [];

  if (!workbook.SheetNames.includes('Actuals')) {
    return { ok: false, errors: ['Відсутній обовʼязковий аркуш Actuals.'] };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets.Actuals, { defval: '' });

  if (rows.length === 0) {
    return { ok: false, errors: ['Аркуш Actuals не містить даних.'] };
  }

  const rowColumns = new Set(Object.keys(rows[0]));
  requiredColumns.forEach((column) => {
    if (!rowColumns.has(column)) {
      errors.push(`В аркуші Actuals відсутня колонка ${column}.`);
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  const channelsByCode = new Map(dictionaries.channels.map((channel) => [channel.code, channel]));
  const employeesByChannelAndName = new Map(
    dictionaries.employees.map((employee) => [`${employee.channelCode}::${employee.fullName}`, employee]),
  );

  const importedRows: ActualPerformanceInput[] = [];

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const monthCode = String(row.period).trim();
    const channelCode = String(row.channelCode).trim();
    const fullName = String(row.fullName).trim();
    const employee = employeesByChannelAndName.get(`${channelCode}::${fullName}`);

    if (!monthCode) {
      errors.push(`Рядок ${rowNumber}: period є обовʼязковим.`);
    }

    if (!channelsByCode.has(channelCode)) {
      errors.push(`Рядок ${rowNumber}: канал ${channelCode} відсутній у довіднику Channels.`);
    }

    if (!employee) {
      errors.push(`Рядок ${rowNumber}: користувач ${fullName} не знайдений для каналу ${channelCode}.`);
    }

    [
      ['actualAuditsStoreChecks', row.actualAuditsStoreChecks],
      ['actualAdministrativeDays', row.actualAdministrativeDays],
      ['actualNegotiations', row.actualNegotiations],
    ].forEach(([column, value]) => {
      if (!isIntegerValue(value)) {
        errors.push(`Рядок ${rowNumber}: ${column} має бути цілим числом 0 або більше.`);
      }
    });

    if (employee && channelsByCode.has(channelCode) && errors.length === 0) {
      importedRows.push({
        channelCode,
        employeeId: employee.id,
        monthCode,
        actualAuditsCount: toNumber(row.actualAuditsStoreChecks),
        actualAdminDaysCount: toNumber(row.actualAdministrativeDays),
        actualNegotiationsCount: toNumber(row.actualNegotiations),
        comment: String(row.comment ?? '').trim(),
        source: file.name,
      });
    }
  });

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, rows: importedRows };
}
