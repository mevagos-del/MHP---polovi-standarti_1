import type {
  ActualPerformance,
  ActualPerformanceInput,
  ChangeLogRecord,
  CurrentPlan,
  Dictionaries,
  PlanInput,
  PlanFactRecord,
  SavePlanResult,
} from '../../types/domain';
import { localStorageAdapter } from './localStorageAdapter';
import { supabaseAdapter } from './supabaseAdapter';
import { isSupabaseConfigured, storageMode } from '../supabase/client';

export type StorageMode = 'supabase' | 'localStorage';

export type StorageAdapter = {
  mode: StorageMode;
  getDictionaries(): Promise<Dictionaries>;
  replaceDictionaries(dictionaries: Dictionaries): Promise<void>;
  getCurrentPlans(): Promise<CurrentPlan[]>;
  getChangeLog(): Promise<ChangeLogRecord[]>;
  getCurrentPlansByEmployee(channelCode: string, employeeId: string): Promise<CurrentPlan[]>;
  savePlan(input: PlanInput, confirmUpdate: () => boolean): Promise<SavePlanResult>;
  getAdminCurrentPlansByMonth(monthCode: string): Promise<CurrentPlan[]>;
  getAdminChangeLogByMonth(monthCode: string): Promise<ChangeLogRecord[]>;
  getActualPerformanceByEmployee(channelCode: string, employeeId: string): Promise<ActualPerformance[]>;
  getActualPerformanceByMonth(monthCode: string): Promise<ActualPerformance[]>;
  importActualPerformance(rows: ActualPerformanceInput[]): Promise<void>;
  getPlanFactByEmployee(channelCode: string, employeeId: string): Promise<PlanFactRecord[]>;
  getPlanFactByMonth(monthCode: string): Promise<PlanFactRecord[]>;
};

export const activeStorageAdapter: StorageAdapter = isSupabaseConfigured
  ? supabaseAdapter
  : localStorageAdapter;

export { storageMode };
