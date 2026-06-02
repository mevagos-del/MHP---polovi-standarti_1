import { useEffect, useMemo, useState } from 'react';
import { activeStorageAdapter } from '../../services/storage/storageAdapter';
import type { Dictionaries, PlanFactRecord } from '../../types/domain';
import { buildActivityMetrics, getRecommendation } from '../../utils/planFactAnalytics';

type Props = {
  channelCode: string;
  dictionaries: Dictionaries;
  employeeId: string;
  monthCode: string;
  refreshToken: number;
};

function PlanningRecommendations({ channelCode, dictionaries, employeeId, monthCode, refreshToken }: Props) {
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
        setRecords(items);
        setError('');
      })
      .catch(() => {
        setRecords([]);
        setError('Не вдалося завантажити рекомендації.');
      });
  }, [channelCode, employeeId, refreshToken]);

  const previousRecord = useMemo(() => {
    if (!monthCode) {
      return null;
    }

    return [...records]
      .filter((record) => record.plan && record.actual && record.monthCode < monthCode)
      .sort((a, b) => b.monthCode.localeCompare(a.monthCode))[0] ?? null;
  }, [monthCode, records]);

  const monthName = previousRecord
    ? dictionaries.months.find((month) => month.monthCode === previousRecord.monthCode)?.monthName ?? previousRecord.monthCode
    : '';

  return (
    <section className="panel recommendation-panel" aria-labelledby="recommendations-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Підказки</p>
          <h2 id="recommendations-title">Рекомендації для планування</h2>
        </div>
      </div>

      {!channelCode || !employeeId || !monthCode ? (
        <div className="empty-state">Оберіть канал збуту, ПІБ та місяць планування для перегляду рекомендацій.</div>
      ) : error ? (
        <div className="message message--error">{error}</div>
      ) : !previousRecord ? (
        <div className="empty-state">
          Факт за попередні періоди ще не завантажено. Заповніть план на основі управлінського рішення.
        </div>
      ) : (
        <div className="recommendation-list">
          <p className="helper-text">Останній попередній період з планом і фактом: {monthName}.</p>
          {buildActivityMetrics(previousRecord).map((metric) => (
            <article className="recommendation-card" key={metric.key}>
              <div className="recommendation-card__top">
                <strong>{metric.label}</strong>
                <span className={`status-badge status-badge--${metric.status.replaceAll(' ', '-').toLowerCase()}`}>
                  {metric.completion === undefined ? '—' : `${metric.completion}%`}
                </span>
              </div>
              <dl>
                <dt>Попередній план</dt>
                <dd>{metric.plan}</dd>
                <dt>Попередній факт</dt>
                <dd>{metric.actual ?? '—'}</dd>
                <dt>Виконання</dt>
                <dd>{metric.completion === undefined ? '—' : `${metric.completion}%`}</dd>
              </dl>
              <p>{getRecommendation(metric.completion)}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default PlanningRecommendations;
