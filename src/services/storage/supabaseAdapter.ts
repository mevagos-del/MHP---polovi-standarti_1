import type {
  ActualPerformance,
  ChangeLogRecord,
  CurrentPlan,
  Dictionaries,
  PlanFactRecord,
  PlanInput,
  SavePlanResult,
} from '../../types/domain';
import { formatDateTime } from '../../utils/date';
import type { StorageAdapter } from './storageAdapter';
import { supabase } from '../supabase/client';

type ChannelRow = {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
};

type EmployeeRow = {
  id: string;
  full_name: string;
  channel_id: string;
  is_active: boolean;
  channels?: { code: string } | null;
};

type MonthRow = {
  id: string;
  month_name: string;
  month_code: string;
  is_active: boolean;
};

type PlanRow = {
  id: string;
  period: string;
  channel_id: string;
  employee_id: string;
  audits_count: number;
  admin_days_count: number;
  negotiations_count: number;
  comment: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  channels?: { code: string } | null;
};

type ChangeLogRow = PlanRow & {
  action_type: 'Створено' | 'Оновлено';
  is_current: boolean;
  changed_at: string;
};

type ActualPerformanceRow = {
  id: string;
  period: string;
  channel_id: string;
  employee_id: string;
  actual_audits_count: number;
  actual_admin_days_count: number;
  actual_negotiations_count: number;
  comment: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  channels?: { code: string } | null;
};

function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase is not configured.');
  }

  return supabase;
}

function formatStoredDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : formatDateTime(date);
}

function toCurrentPlan(row: PlanRow, channelCode?: string): CurrentPlan {
  return {
    id: row.id,
    channelCode: channelCode ?? row.channels?.code ?? row.channel_id,
    employeeId: row.employee_id,
    monthCode: row.period,
    auditsCount: row.audits_count,
    adminDaysCount: row.admin_days_count,
    negotiationsCount: row.negotiations_count,
    comment: row.comment ?? '',
    version: row.version,
    createdAt: formatStoredDate(row.created_at),
    updatedAt: formatStoredDate(row.updated_at),
  };
}

function toChangeLogRecord(row: ChangeLogRow, channelCode?: string): ChangeLogRecord {
  return {
    id: row.id,
    channelCode: channelCode ?? row.channels?.code ?? row.channel_id,
    employeeId: row.employee_id,
    monthCode: row.period,
    auditsCount: row.audits_count,
    adminDaysCount: row.admin_days_count,
    negotiationsCount: row.negotiations_count,
    comment: row.comment ?? '',
    version: row.version,
    actionType: row.action_type,
    isCurrent: row.is_current ? 'Так' : 'Ні',
    changedAt: formatStoredDate(row.changed_at),
  };
}

function toActualPerformance(row: ActualPerformanceRow, channelCode?: string): ActualPerformance {
  return {
    id: row.id,
    channelCode: channelCode ?? row.channels?.code ?? row.channel_id,
    employeeId: row.employee_id,
    monthCode: row.period,
    actualAuditsCount: row.actual_audits_count,
    actualAdminDaysCount: row.actual_admin_days_count,
    actualNegotiationsCount: row.actual_negotiations_count,
    comment: row.comment ?? '',
    source: row.source ?? 'Excel',
    createdAt: formatStoredDate(row.created_at),
    updatedAt: formatStoredDate(row.updated_at),
  };
}

async function getChannelIdByCode(channelCode: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('channels')
    .select('id')
    .eq('code', channelCode)
    .eq('is_active', true)
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

async function getChannelCodeById(channelId: string) {
  const client = requireSupabase();
  const { data, error } = await client
    .from('channels')
    .select('code')
    .eq('id', channelId)
    .single();

  if (error) {
    throw error;
  }

  return data.code as string;
}

type QueryResult = PromiseLike<{ data: unknown; error: unknown }>;

async function fetchPlanRows(query: QueryResult) {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as PlanRow[];
}

async function fetchChangeLogRows(query: QueryResult) {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as ChangeLogRow[];
}

async function fetchActualRows(query: QueryResult) {
  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as ActualPerformanceRow[];
}

async function getCurrentPlans() {
  const client = requireSupabase();
  const rows = await fetchPlanRows(
    client
      .from('current_plans')
      .select('*, channels(code)')
      .order('updated_at', { ascending: false }),
  );

  return rows.map((row) => toCurrentPlan(row));
}

async function getChangeLog() {
  const client = requireSupabase();
  const rows = await fetchChangeLogRows(
    client
      .from('change_log')
      .select('*, channels(code)')
      .order('changed_at', { ascending: false }),
  );

  return rows.map((row) => toChangeLogRecord(row));
}

async function getActualPerformanceByMonth(monthCode: string) {
  const client = requireSupabase();
  const rows = await fetchActualRows(
    client
      .from('actual_performance')
      .select('*, channels(code)')
      .eq('period', monthCode)
      .order('updated_at', { ascending: false }),
  );

  return rows.map((row) => toActualPerformance(row));
}

async function getCurrentPlansByEmployee(channelCode: string, employeeId: string) {
  const client = requireSupabase();
  const channelId = await getChannelIdByCode(channelCode);
  const rows = await fetchPlanRows(
    client
      .from('current_plans')
      .select('*')
      .eq('channel_id', channelId)
      .eq('employee_id', employeeId)
      .order('period'),
  );

  return rows.map((row) => toCurrentPlan(row, channelCode));
}

async function getActualPerformanceByEmployee(channelCode: string, employeeId: string) {
  const client = requireSupabase();
  const channelId = await getChannelIdByCode(channelCode);
  const rows = await fetchActualRows(
    client
      .from('actual_performance')
      .select('*')
      .eq('channel_id', channelId)
      .eq('employee_id', employeeId)
      .order('period'),
  );

  return rows.map((row) => toActualPerformance(row, channelCode));
}

function joinPlanFact(plans: CurrentPlan[], actuals: ActualPerformance[], includeActualsWithoutPlan = false): PlanFactRecord[] {
  const getKey = (record: { channelCode: string; employeeId: string; monthCode: string }) => `${record.channelCode}::${record.employeeId}::${record.monthCode}`;
  const actualByKey = new Map(actuals.map((actual) => [getKey(actual), actual]));
  const records: PlanFactRecord[] = plans.map((plan) => ({
    plan,
    actual: actualByKey.get(getKey(plan)) ?? null,
    channelCode: plan.channelCode,
    employeeId: plan.employeeId,
    monthCode: plan.monthCode,
  }));

  if (includeActualsWithoutPlan) {
    const planKeys = new Set(plans.map((plan) => getKey(plan)));
    actuals.forEach((actual) => {
      if (!planKeys.has(getKey(actual))) {
        records.push({
          plan: null,
          actual,
          channelCode: actual.channelCode,
          employeeId: actual.employeeId,
          monthCode: actual.monthCode,
        });
      }
    });
  }

  return records;
}

async function insertChangeLog(plan: CurrentPlan, channelId: string, actionType: ChangeLogRecord['actionType']) {
  const client = requireSupabase();

  await client
    .from('change_log')
    .update({ is_current: false })
    .eq('period', plan.monthCode)
    .eq('channel_id', channelId)
    .eq('employee_id', plan.employeeId);

  const { error } = await client.from('change_log').insert({
    period: plan.monthCode,
    channel_id: channelId,
    employee_id: plan.employeeId,
    audits_count: plan.auditsCount,
    admin_days_count: plan.adminDaysCount,
    negotiations_count: plan.negotiationsCount,
    comment: plan.comment,
    version: plan.version,
    action_type: actionType,
    is_current: true,
  });

  if (error) {
    throw error;
  }
}

export const supabaseAdapter: StorageAdapter = {
  mode: 'supabase',
  async getDictionaries() {
    const client = requireSupabase();
    const [channelsResult, employeesResult, monthsResult] = await Promise.all([
      client.from('channels').select('*').eq('is_active', true).order('code'),
      client.from('employees').select('*, channels(code)').eq('is_active', true).order('full_name'),
      client.from('planning_months').select('*').eq('is_active', true).order('month_code'),
    ]);

    if (channelsResult.error) throw channelsResult.error;
    if (employeesResult.error) throw employeesResult.error;
    if (monthsResult.error) throw monthsResult.error;

    return {
      channels: ((channelsResult.data ?? []) as ChannelRow[]).map((channel) => ({
        id: channel.id,
        code: channel.code,
        name: channel.name,
        isActive: channel.is_active,
      })),
      employees: ((employeesResult.data ?? []) as EmployeeRow[]).map((employee) => ({
        id: employee.id,
        fullName: employee.full_name,
        channelCode: employee.channels?.code ?? employee.channel_id,
        isActive: employee.is_active,
      })),
      months: ((monthsResult.data ?? []) as MonthRow[]).map((month) => ({
        id: month.id,
        monthName: month.month_name,
        monthCode: month.month_code,
        isActive: month.is_active,
      })),
    };
  },
  async replaceDictionaries(dictionaries) {
    const client = requireSupabase();

    const { error: deactivateChannelsError } = await client.from('channels').update({ is_active: false }).not('id', 'is', null);
    if (deactivateChannelsError) throw deactivateChannelsError;

    const { error: upsertChannelsError } = await client.from('channels').upsert(
      dictionaries.channels.map((channel) => ({
        code: channel.code,
        name: channel.name,
        is_active: channel.isActive,
      })),
      { onConflict: 'code' },
    );
    if (upsertChannelsError) throw upsertChannelsError;

    const { data: channelRows, error: channelRowsError } = await client.from('channels').select('id, code');
    if (channelRowsError) throw channelRowsError;

    const channelIdByCode = new Map((channelRows ?? []).map((channel) => [channel.code as string, channel.id as string]));

    const { error: deactivateEmployeesError } = await client.from('employees').update({ is_active: false }).not('id', 'is', null);
    if (deactivateEmployeesError) throw deactivateEmployeesError;

    const employeeRows = dictionaries.employees.map((employee) => ({
      full_name: employee.fullName,
      channel_id: channelIdByCode.get(employee.channelCode),
      is_active: employee.isActive,
    })).filter((employee) => employee.channel_id);

    if (employeeRows.length > 0) {
      const { error: upsertEmployeesError } = await client
        .from('employees')
        .upsert(employeeRows, { onConflict: 'full_name,channel_id' });
      if (upsertEmployeesError) throw upsertEmployeesError;
    }

    const { error: deactivateMonthsError } = await client.from('planning_months').update({ is_active: false }).not('id', 'is', null);
    if (deactivateMonthsError) throw deactivateMonthsError;

    const { error: upsertMonthsError } = await client.from('planning_months').upsert(
      dictionaries.months.map((month) => ({
        month_name: month.monthName,
        month_code: month.monthCode,
        is_active: month.isActive,
      })),
      { onConflict: 'month_code' },
    );
    if (upsertMonthsError) throw upsertMonthsError;
  },
  async getCurrentPlans() {
    return getCurrentPlans();
  },
  async getChangeLog() {
    return getChangeLog();
  },
  async getCurrentPlansByEmployee(channelCode, employeeId) {
    return getCurrentPlansByEmployee(channelCode, employeeId);
  },
  async savePlan(input, confirmUpdate): Promise<SavePlanResult> {
    const client = requireSupabase();
    const channelId = await getChannelIdByCode(input.channelCode);
    const { data: existingRows, error: existingError } = await client
      .from('current_plans')
      .select('*')
      .eq('period', input.monthCode)
      .eq('channel_id', channelId)
      .eq('employee_id', input.employeeId)
      .limit(1);

    if (existingError) throw existingError;

    const existingPlan = existingRows?.[0] as PlanRow | undefined;

    if (!existingPlan) {
      const { data, error } = await client
        .from('current_plans')
        .insert({
          period: input.monthCode,
          channel_id: channelId,
          employee_id: input.employeeId,
          audits_count: input.auditsCount,
          admin_days_count: input.adminDaysCount,
          negotiations_count: input.negotiationsCount,
          comment: input.comment,
          version: 1,
        })
        .select('*')
        .single();

      if (error) throw error;

      const plan = toCurrentPlan(data as PlanRow, input.channelCode);
      await insertChangeLog(plan, channelId, 'Створено');
      return { status: 'created', plan };
    }

    if (!confirmUpdate()) {
      return { status: 'cancelled' };
    }

    const nextVersion = existingPlan.version + 1;
    const { data, error } = await client
      .from('current_plans')
      .update({
        audits_count: input.auditsCount,
        admin_days_count: input.adminDaysCount,
        negotiations_count: input.negotiationsCount,
        comment: input.comment,
        version: nextVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingPlan.id)
      .select('*')
      .single();

    if (error) throw error;

    const plan = toCurrentPlan(data as PlanRow, input.channelCode);
    await insertChangeLog(plan, channelId, 'Оновлено');
    return { status: 'updated', plan };
  },
  async getAdminCurrentPlansByMonth(monthCode) {
    const client = requireSupabase();
    const rows = await fetchPlanRows(
      client
        .from('current_plans')
        .select('*, channels(code)')
        .eq('period', monthCode)
        .order('updated_at', { ascending: false }),
    );

    return rows.map((row) => toCurrentPlan(row));
  },
  async getAdminChangeLogByMonth(monthCode) {
    const client = requireSupabase();
    const rows = await fetchChangeLogRows(
      client
        .from('change_log')
        .select('*, channels(code)')
        .eq('period', monthCode)
        .order('changed_at', { ascending: false }),
    );

    return rows.map((row) => toChangeLogRecord(row));
  },
  async getActualPerformanceByEmployee(channelCode, employeeId) {
    return getActualPerformanceByEmployee(channelCode, employeeId);
  },
  async getActualPerformanceByMonth(monthCode) {
    return getActualPerformanceByMonth(monthCode);
  },
  async importActualPerformance(rows) {
    const client = requireSupabase();
    const channelCodes = [...new Set(rows.map((row) => row.channelCode))];
    const { data: channelRows, error: channelError } = await client
      .from('channels')
      .select('id, code')
      .in('code', channelCodes);

    if (channelError) throw channelError;

    const channelIdByCode = new Map((channelRows ?? []).map((channel) => [channel.code as string, channel.id as string]));
    const payload = rows.map((row) => ({
      period: row.monthCode,
      channel_id: channelIdByCode.get(row.channelCode),
      employee_id: row.employeeId,
      actual_audits_count: row.actualAuditsCount,
      actual_admin_days_count: row.actualAdminDaysCount,
      actual_negotiations_count: row.actualNegotiationsCount,
      comment: row.comment,
      source: row.source,
      updated_at: new Date().toISOString(),
    })).filter((row) => row.channel_id);

    if (payload.length === 0) {
      return;
    }

    const { error } = await client
      .from('actual_performance')
      .upsert(payload, { onConflict: 'period,channel_id,employee_id' });

    if (error) throw error;
  },
  async getPlanFactByEmployee(channelCode, employeeId) {
    const [plans, actuals] = await Promise.all([
      getCurrentPlansByEmployee(channelCode, employeeId),
      getActualPerformanceByEmployee(channelCode, employeeId),
    ]);

    return joinPlanFact(plans, actuals).sort((a, b) => a.monthCode.localeCompare(b.monthCode));
  },
  async getPlanFactByMonth(monthCode) {
    const [plans, actuals] = await Promise.all([
      this.getAdminCurrentPlansByMonth(monthCode),
      getActualPerformanceByMonth(monthCode),
    ]);

    return joinPlanFact(plans, actuals, true).sort((a, b) => `${a.channelCode}${a.employeeId}`.localeCompare(`${b.channelCode}${b.employeeId}`));
  },
};
