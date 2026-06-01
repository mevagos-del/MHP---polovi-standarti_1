import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { appConfig } from '../../app/config';
import { importDictionariesFromExcel } from '../dictionaries/importDictionaries';
import { exportChangeLogCsv, exportCurrentPlansCsv } from '../../services/export/csvExport';
import { activeStorageAdapter, storageMode } from '../../services/storage/storageAdapter';
import type { CurrentPlan, Dictionaries, RecordFilters } from '../../types/domain';

type Props = {
  dictionaries: Dictionaries;
  onDictionariesUpdated: (dictionaries: Dictionaries) => Promise<void>;
  refreshToken: number;
};

function AdminPanel({ dictionaries, onDictionariesUpdated, refreshToken }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [importMessage, setImportMessage] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [exportMonthCode, setExportMonthCode] = useState('');
  const [filters, setFilters] = useState<RecordFilters>({ monthCode: '', channelCode: '', employeeId: '' });
  const [currentPlans, setCurrentPlans] = useState<CurrentPlan[]>([]);
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    if (!isUnlocked) {
      return;
    }

    activeStorageAdapter
      .getCurrentPlans()
      .then((plans) => {
        setCurrentPlans(plans);
        setAdminError('');
      })
      .catch(() => setAdminError('Не вдалося завантажити адмінські записи.'));
  }, [refreshToken, isUnlocked]);

  const employeesForFilter = dictionaries.employees.filter((employee) => (
    !filters.channelCode || employee.channelCode === filters.channelCode
  ));

  const filteredPlans = currentPlans.filter((plan) => (
    (!filters.monthCode || plan.monthCode === filters.monthCode)
    && (!filters.channelCode || plan.channelCode === filters.channelCode)
    && (!filters.employeeId || plan.employeeId === filters.employeeId)
  ));

  const channelName = (code: string) => dictionaries.channels.find((channel) => channel.code === code)?.name ?? code;
  const employeeName = (id: string) => dictionaries.employees.find((employee) => employee.id === id)?.fullName ?? id;
  const monthName = (code: string) => dictionaries.months.find((month) => month.monthCode === code)?.monthName ?? code;

  const handleUnlock = (event: FormEvent) => {
    event.preventDefault();

    if (pin === appConfig.demoAdminPin) {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('Невірний PIN-код');
    }
  };

  const handleImport = async (file: File | undefined) => {
    setImportMessage('');
    setImportErrors([]);

    if (!file) {
      return;
    }

    const result = await importDictionariesFromExcel(file);

    if (result.ok) {
      try {
        await onDictionariesUpdated(result.dictionaries);
        setImportMessage('Довідники успішно оновлено.');
      } catch {
        setImportErrors(['Не вдалося оновити довідники у сховищі даних.']);
      }
    } else {
      setImportErrors(result.errors);
    }
  };

  const requireExportMonth = () => {
    if (!exportMonthCode) {
      window.alert('Оберіть місяць планування для експорту.');
      return false;
    }

    return true;
  };

  const handleExportCurrentPlans = async () => {
    if (!requireExportMonth()) {
      return;
    }

    const plans = await activeStorageAdapter.getAdminCurrentPlansByMonth(exportMonthCode);
    exportCurrentPlansCsv(plans, dictionaries, exportMonthCode);
  };

  const handleExportChangeLog = async () => {
    if (!requireExportMonth()) {
      return;
    }

    const records = await activeStorageAdapter.getAdminChangeLogByMonth(exportMonthCode);
    exportChangeLogCsv(records, dictionaries, exportMonthCode);
  };

  return (
    <section className="admin-shell" aria-labelledby="admin-title">
      <div className="admin-shell__header">
        <div>
          <p className="section-kicker">Адміністрування</p>
          <h2 id="admin-title">Адмін-панель</h2>
        </div>
        <button className="button-secondary" type="button" onClick={() => setIsOpen((value) => !value)}>
          {isOpen ? 'Закрити' : 'Адмін-панель'}
        </button>
      </div>

      {isOpen && !isUnlocked && (
        <form className="pin-card" onSubmit={handleUnlock}>
          <label className="field">
            <span>Admin PIN</span>
            <input
              inputMode="numeric"
              onChange={(event) => setPin(event.target.value)}
              placeholder="Введіть PIN"
              type="password"
              value={pin}
            />
          </label>
          {pinError && <div className="message message--error">{pinError}</div>}
          <button type="submit">Відкрити адмін-панель</button>
          <p className="helper-text">
            Demo PIN для MVP: 2468. Це не production security.
          </p>
        </form>
      )}

      {isOpen && isUnlocked && (
        <div className="admin-grid">
          {storageMode === 'localStorage' && (
            <div className="mode-note admin-card--wide">Демо-режим: дані зберігаються локально в браузері.</div>
          )}
          {adminError && <div className="message message--error admin-card--wide">{adminError}</div>}

          <article className="panel admin-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Excel</p>
                <h3>Імпорт довідників</h3>
              </div>
            </div>
            <p className="helper-text">
              Завантажте файл “Field Standards - Dictionaries.xlsx” з аркушами Channels, Users, Months.
              Обов'язкові колонки: Channels(channelCode, channelName, isActive),
              Users(fullName, channelCode, isActive), Months(monthName, monthCode, isActive).
            </p>
            <input
              accept=".xlsx,.xls"
              onChange={(event) => handleImport(event.target.files?.[0])}
              type="file"
            />
            {importMessage && <div className="message message--success">{importMessage}</div>}
            {importErrors.length > 0 && (
              <div className="message message--error">
                {importErrors.map((error) => <p key={error}>{error}</p>)}
              </div>
            )}
          </article>

          <article className="panel admin-card">
            <div className="section-heading">
              <div>
                <p className="section-kicker">CSV</p>
                <h3>Адмінський експорт</h3>
              </div>
            </div>
            <label className="field">
              <span>Місяць планування</span>
              <select value={exportMonthCode} onChange={(event) => setExportMonthCode(event.target.value)}>
                <option value="">Оберіть місяць</option>
                {dictionaries.months.map((month) => (
                  <option key={month.id} value={month.monthCode}>{month.monthName}</option>
                ))}
              </select>
            </label>
            <div className="admin-actions">
              <button
                type="button"
                onClick={handleExportCurrentPlans}
              >
                Експорт актуальних планів
              </button>
              <button
                className="button-secondary"
                type="button"
                onClick={handleExportChangeLog}
              >
                Експорт журналу змін
              </button>
            </div>
            <p className="helper-text">
              Експорт включає лише дані з localStorage поточного браузера та пристрою.
            </p>
          </article>

          <article className="panel admin-card admin-card--wide">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Контроль</p>
                <h3>Перегляд / фільтрація записів</h3>
              </div>
            </div>
            <div className="filters-grid">
              <label className="field">
                <span>Місяць</span>
                <select value={filters.monthCode} onChange={(event) => setFilters({ ...filters, monthCode: event.target.value })}>
                  <option value="">Усі місяці</option>
                  {dictionaries.months.map((month) => (
                    <option key={month.id} value={month.monthCode}>{month.monthName}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Канал збуту</span>
                <select
                  value={filters.channelCode}
                  onChange={(event) => setFilters({ ...filters, channelCode: event.target.value, employeeId: '' })}
                >
                  <option value="">Усі канали</option>
                  {dictionaries.channels.map((channel) => (
                    <option key={channel.id} value={channel.code}>{channel.name}</option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Співробітник</span>
                <select value={filters.employeeId} onChange={(event) => setFilters({ ...filters, employeeId: event.target.value })}>
                  <option value="">Усі співробітники</option>
                  {employeesForFilter.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="desktop-table">
              <table>
                <thead>
                  <tr>
                    <th>Канал</th>
                    <th>ПІБ</th>
                    <th>Місяць</th>
                    <th>Аудити</th>
                    <th>Адмін. дні</th>
                    <th>Перемовини</th>
                    <th>Версія</th>
                    <th>Оновлено</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlans.map((plan) => (
                    <tr key={plan.id}>
                      <td>{channelName(plan.channelCode)}</td>
                      <td>{employeeName(plan.employeeId)}</td>
                      <td>{monthName(plan.monthCode)}</td>
                      <td>{plan.auditsCount}</td>
                      <td>{plan.adminDaysCount}</td>
                      <td>{plan.negotiationsCount}</td>
                      <td>{plan.version}</td>
                      <td>{plan.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

export default AdminPanel;
