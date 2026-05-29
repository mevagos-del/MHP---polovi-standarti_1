import { demoDictionaries } from '../../data/demoDictionaries';
import { readJson, writeJson } from '../../storage/localStorageClient';
import type { ChangeLogRecord, CurrentPlan, Dictionaries } from '../../types/domain';
import { storageKeys } from './storageKeys';

export const dictionaryRepository = {
  get(): Dictionaries {
    return readJson<Dictionaries>(storageKeys.dictionaries, demoDictionaries);
  },
  replace(dictionaries: Dictionaries) {
    writeJson(storageKeys.dictionaries, dictionaries);
  },
};

export const plansRepository = {
  getCurrentPlans(): CurrentPlan[] {
    return readJson<CurrentPlan[]>(storageKeys.currentPlans, []);
  },
  saveCurrentPlans(plans: CurrentPlan[]) {
    writeJson(storageKeys.currentPlans, plans);
  },
  getChangeLog(): ChangeLogRecord[] {
    return readJson<ChangeLogRecord[]>(storageKeys.changeLog, []);
  },
  saveChangeLog(records: ChangeLogRecord[]) {
    writeJson(storageKeys.changeLog, records);
  },
};
