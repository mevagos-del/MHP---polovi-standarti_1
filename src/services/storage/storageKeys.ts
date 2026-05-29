import { appConfig } from '../../app/config';

export const storageKeys = {
  dictionaries: `${appConfig.storageNamespace}:dictionaries`,
  currentPlans: `${appConfig.storageNamespace}:current-plans`,
  changeLog: `${appConfig.storageNamespace}:change-log`,
};
