import type { ChangeLogRecord, CurrentPlan, PlanInput, SavePlanResult } from '../../types/domain';
import { formatDateTime } from '../../utils/date';
import { createId } from '../../utils/ids';
import { plansRepository } from '../storage/localRepositories';

function getPlanKey(plan: Pick<PlanInput, 'channelCode' | 'employeeId' | 'monthCode'>) {
  return `${plan.channelCode}::${plan.employeeId}::${plan.monthCode}`;
}

function createChangeLogRecord(plan: CurrentPlan, actionType: ChangeLogRecord['actionType']): ChangeLogRecord {
  return {
    id: createId('log'),
    channelCode: plan.channelCode,
    employeeId: plan.employeeId,
    monthCode: plan.monthCode,
    auditsCount: plan.auditsCount,
    adminDaysCount: plan.adminDaysCount,
    negotiationsCount: plan.negotiationsCount,
    comment: plan.comment,
    version: plan.version,
    actionType,
    isCurrent: 'Так',
    changedAt: plan.updatedAt,
  };
}

function saveChangeLog(plan: CurrentPlan, actionType: ChangeLogRecord['actionType']) {
  const planKey = getPlanKey(plan);
  const existingLog = plansRepository.getChangeLog();
  const normalizedLog = existingLog.map((record) => (
    getPlanKey(record) === planKey ? { ...record, isCurrent: 'Ні' as const } : record
  ));

  plansRepository.saveChangeLog([createChangeLogRecord(plan, actionType), ...normalizedLog]);
}

export function savePlan(input: PlanInput, confirmUpdate: () => boolean): SavePlanResult {
  const plans = plansRepository.getCurrentPlans();
  const existingIndex = plans.findIndex((plan) => getPlanKey(plan) === getPlanKey(input));
  const now = formatDateTime();

  if (existingIndex === -1) {
    const plan: CurrentPlan = {
      ...input,
      id: createId('plan'),
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    plansRepository.saveCurrentPlans([plan, ...plans]);
    saveChangeLog(plan, 'Створено');

    return { status: 'created', plan };
  }

  if (!confirmUpdate()) {
    return { status: 'cancelled' };
  }

  const existingPlan = plans[existingIndex];
  const updatedPlan: CurrentPlan = {
    ...existingPlan,
    ...input,
    version: existingPlan.version + 1,
    updatedAt: now,
  };
  const nextPlans = [...plans];
  nextPlans[existingIndex] = updatedPlan;

  plansRepository.saveCurrentPlans(nextPlans);
  saveChangeLog(updatedPlan, 'Оновлено');

  return { status: 'updated', plan: updatedPlan };
}

export function getPlansForEmployee(channelCode: string, employeeId: string) {
  return plansRepository
    .getCurrentPlans()
    .filter((plan) => plan.channelCode === channelCode && plan.employeeId === employeeId);
}
