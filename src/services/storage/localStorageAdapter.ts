import { demoDictionaries } from '../../data/demoDictionaries';
import { readJson, writeJson } from '../../storage/localStorageClient';
import type { ChangeLogRecord, CurrentPlan, Dictionaries, PlanInput, SavePlanResult } from '../../types/domain';
import { formatDateTime } from '../../utils/date';
import { createId } from '../../utils/ids';
import type { StorageAdapter } from './storageAdapter';
import { storageKeys } from './storageKeys';

function getPlanKey(plan: Pick<PlanInput, 'channelCode' | 'employeeId' | 'monthCode'>) {
  return `${plan.channelCode}::${plan.employeeId}::${plan.monthCode}`;
}

function getCurrentPlans() {
  return readJson<CurrentPlan[]>(storageKeys.currentPlans, []);
}

function getChangeLog() {
  return readJson<ChangeLogRecord[]>(storageKeys.changeLog, []);
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
  const normalizedLog = getChangeLog().map((record) => (
    getPlanKey(record) === planKey ? { ...record, isCurrent: 'Ні' as const } : record
  ));

  writeJson(storageKeys.changeLog, [createChangeLogRecord(plan, actionType), ...normalizedLog]);
}

export const localStorageAdapter: StorageAdapter = {
  mode: 'localStorage',
  async getDictionaries() {
    return readJson<Dictionaries>(storageKeys.dictionaries, demoDictionaries);
  },
  async replaceDictionaries(dictionaries) {
    writeJson(storageKeys.dictionaries, dictionaries);
  },
  async getCurrentPlans() {
    return getCurrentPlans();
  },
  async getChangeLog() {
    return getChangeLog();
  },
  async getCurrentPlansByEmployee(channelCode, employeeId) {
    return getCurrentPlans().filter((plan) => plan.channelCode === channelCode && plan.employeeId === employeeId);
  },
  async savePlan(input, confirmUpdate): Promise<SavePlanResult> {
    const plans = getCurrentPlans();
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

      writeJson(storageKeys.currentPlans, [plan, ...plans]);
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

    writeJson(storageKeys.currentPlans, nextPlans);
    saveChangeLog(updatedPlan, 'Оновлено');
    return { status: 'updated', plan: updatedPlan };
  },
  async getAdminCurrentPlansByMonth(monthCode) {
    return getCurrentPlans().filter((plan) => plan.monthCode === monthCode);
  },
  async getAdminChangeLogByMonth(monthCode) {
    return getChangeLog().filter((record) => record.monthCode === monthCode);
  },
};
