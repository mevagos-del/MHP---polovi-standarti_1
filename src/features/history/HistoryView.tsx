import { useMemo } from 'react';
import { getPlansForEmployee } from '../../services/plans/planService';
import type { Dictionaries } from '../../types/domain';

type Props = {
  channelCode: string;
  dictionaries: Dictionaries;
  employeeId: string;
  refreshToken: number;
};

function HistoryView({ channelCode, dictionaries, employeeId, refreshToken }: Props) {
  const plans = useMemo(() => {
    if (!channelCode || !employeeId) {
      return [];
    }

    return getPlansForEmployee(channelCode, employeeId).sort((a, b) => a.monthCode.localeCompare(b.monthCode));
  }, [channelCode, employeeId, refreshToken]);

  const monthNameByCode = new Map(dictionaries.months.map((month) => [month.monthCode, month.monthName]));

  return (
    <section className="panel" aria-labelledby="history-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Історія користувача</p>
          <h2 id="history-title">Внесені плани</h2>
        </div>
      </div>

      {!channelCode || !employeeId ? (
        <div className="empty-state">Оберіть канал збуту та ПІБ для перегляду історії.</div>
      ) : plans.length === 0 ? (
        <div className="empty-state">Для обраного користувача ще немає збережених планів.</div>
      ) : (
        <>
          <div className="desktop-table">
            <table>
              <thead>
                <tr>
                  <th>Місяць планування</th>
                  <th>Аудити / Сторчеки</th>
                  <th>Адміністративні дні</th>
                  <th>Перемовини</th>
                  <th>Коментар</th>
                  <th>Версія</th>
                  <th>Останнє оновлення</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td>{monthNameByCode.get(plan.monthCode) ?? plan.monthCode}</td>
                    <td>{plan.auditsCount}</td>
                    <td>{plan.adminDaysCount}</td>
                    <td>{plan.negotiationsCount}</td>
                    <td>{plan.comment || '-'}</td>
                    <td>{plan.version}</td>
                    <td>{plan.updatedAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-history">
            {plans.map((plan) => (
              <article className="history-card" key={plan.id}>
                <div>
                  <strong>{monthNameByCode.get(plan.monthCode) ?? plan.monthCode}</strong>
                  <span>Версія {plan.version}</span>
                </div>
                <dl>
                  <dt>Аудити / Сторчеки</dt>
                  <dd>{plan.auditsCount}</dd>
                  <dt>Адміністративні дні</dt>
                  <dd>{plan.adminDaysCount}</dd>
                  <dt>Перемовини</dt>
                  <dd>{plan.negotiationsCount}</dd>
                  <dt>Коментар</dt>
                  <dd>{plan.comment || '-'}</dd>
                  <dt>Останнє оновлення</dt>
                  <dd>{plan.updatedAt}</dd>
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export default HistoryView;
