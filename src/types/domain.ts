export type Channel = {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
};

export type Employee = {
  id: string;
  fullName: string;
  channelCode: string;
  isActive: boolean;
};

export type PlanningMonth = {
  id: string;
  monthName: string;
  monthCode: string;
  isActive: boolean;
};

export type Dictionaries = {
  channels: Channel[];
  employees: Employee[];
  months: PlanningMonth[];
};

export type PlanInput = {
  channelCode: string;
  employeeId: string;
  monthCode: string;
  auditsCount: number;
  adminDaysCount: number;
  negotiationsCount: number;
  comment: string;
};

export type CurrentPlan = PlanInput & {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type ChangeLogRecord = PlanInput & {
  id: string;
  version: number;
  actionType: 'Створено' | 'Оновлено';
  isCurrent: 'Так' | 'Ні';
  changedAt: string;
};

export type SavePlanResult = {
  status: 'created' | 'updated' | 'cancelled';
  plan?: CurrentPlan;
};

export type RecordFilters = {
  monthCode: string;
  channelCode: string;
  employeeId: string;
};
