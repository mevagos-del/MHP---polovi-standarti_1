import { useEffect, useMemo, useState } from 'react';
import { activeStorageAdapter } from '../../services/storage/storageAdapter';
import type { Dictionaries, PlanFactRecord } from '../../types/domain';
import { buildActivityMetrics, getOverallCompletion, getStatus } from '../../utils/planFactAnalytics';
import CircularProgress from './CircularProgress';

type Props = {
  channelCode: string;
  dictionaries: Dictionaries;
  employeeId: string;
  refreshToken: number;
};

function AnalyticsView({ channelCode, dictionaries, employeeId, refreshToken }: Props) {
  const [records, setRecords] = useState<PlanFactRecord[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!channelCode || !employeeId) {
      setRecords([]);
      return;
    }

    activeStorageAdapter
      .getPlanFactByEmployee(channelCode, employeeId)
      .then((items) => {
        setRecords(items.filter((record) => record.plan).sort((a, b) => a.monthCode.localeCompare(b.monthCode)));
        setError('');
      })
      .catch(() => {
        setRecords([]);
        setError('Не вдалося завантажити динаміку виконання.');
      });
  }, [channelCode, employeeId, refreshToken]);

  const monthNameByCode = new Map(dictionaries.months.map((month) => [month.monthCode, month.monthName]));
  const latestRecord = records[records.length - 1] ?? null;
  const latestMetrics = latestRecord ? buildActivityMetrics(latestRecord) : [];
  const overallCompletion = getOverallCompletion(latestMetrics);
  const overallStatus = getStatus(overallCompletion);

  const selectedEmployee = useMemo(
    () => dictionaries.employees.find((employee) => employee.id === employeeId),
    [dictionaries.employees, employeeId],
  );

  return (
    <section className="analytics-view" aria-labelledby="analytics-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">План / факт</p>
          <h2 id="analytics-title">Динаміка виконання</h2>
        </div>
      </div>

      {!channelCode || !employeeId ? (
        <div className="empty-state">Оберіть канал збуту та ПІБ для перегляду динаміки виконання.</div>
      ) : error ? (
        <div className="message message--error">{error}</div>
      ) : records.length === 0 ? (
        <div className="empty-state">Для обраного користувача ще немає збережених планів.</div>
      ) : (
        <>
          <article className="analytics-card">
            <div className="analytics-card__header">
              <div>
                <p className="section-kicker">Актуальний зріз</p>
                <h3>{selectedEmployee?.fullName ?? 'Співробітник'}</h3>
                <span>{latestRecord ? monthNameByCode.get(latestRecord.monthCode) ?? latestRecord.monthCode : ''}</span>
              </div>
              <div className="overall-summary">
                <span>Загальне виконання</span>
                <div className="overall-score">
                  <strong>{overallCompletion === undefined ? '—' : `${overallCompletion}%`}</strong>
                  <span className="status-badge">{overallStatus}</span>
                </div>
              </div>
            </div>

            {!latestRecord?.actual && (
              <div className="message message--warning">Факт ще не завантажено</div>
            )}

            <div className="metric-card-grid">
              {latestMetrics.map((metric) => (
                <section className={`metric-card ${metric.key === 'audits' ? 'metric-card--primary' : ''}`} key={metric.key}>
                  <div className="metric-card__visual">
                    <CircularProgress label={metric.label} value={metric.completion} />
                  </div>
                  <div className="metric-card__heading">
                    <h4>{metric.label}</h4>
                    <span className="status-badge">{metric.status}</span>
                  </div>
                  <dl className="metric-card__values">
                    <dt>План</dt>
                    <dd>{metric.plan}</dd>
                    <dt>Факт</dt>
                    <dd>{metric.actual ?? 'Факт ще не завантажено'}</dd>
                    <dt>Виконання</dt>
                    <dd>{metric.completion === undefined ? '—' : `${metric.completion}%`}</dd>
                  </dl>
                  <p className="metric-card__hint">{metric.hint}</p>
                </section>
              ))}
            </div>
          </article>

          <section className="panel" aria-labelledby="monthly-dynamics-title">
            <div className="section-heading">
              <div>
                <p className="section-kicker">Історія</p>
                <h3 id="monthly-dynamics-title">Місячна динаміка</h3>
              </div>
            </div>
            <div className="dynamics-list">
              {records.map((record) => {
                const metrics = buildActivityMetrics(record);
                const completion = getOverallCompletion(metrics);

                return (
                  <article className="dynamics-row" key={`${record.channelCode}-${record.employeeId}-${record.monthCode}`}>
                    <div>
                      <strong>{monthNameByCode.get(record.monthCode) ?? record.monthCode}</strong>
                      <span className="status-badge">{getStatus(completion)}</span>
                    </div>
                    <dl>
                      <dt>План</dt>
                      <dd>{record.plan ? `${record.plan.auditsCount} / ${record.plan.adminDaysCount} / ${record.plan.negotiationsCount}` : 'Немає плану'}</dd>
                      <dt>Факт</dt>
                      <dd>{record.actual ? `${record.actual.actualAuditsCount} / ${record.actual.actualAdminDaysCount} / ${record.actual.actualNegotiationsCount}` : 'Факт ще не завантажено'}</dd>
                      <dt>Виконання</dt>
                      <dd>{completion === undefined ? '—' : `${completion}%`}</dd>
                    </dl>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

export default AnalyticsView;
