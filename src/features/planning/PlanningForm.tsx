import { useEffect, useState, type FormEvent } from 'react';
import type { Dictionaries, Employee, PlanInput } from '../../types/domain';
import { activeStorageAdapter } from '../../services/storage/storageAdapter';
import ActivityCard from './ActivityCard';
import EmployeeAutocomplete from './EmployeeAutocomplete';

type Props = {
  dictionaries: Dictionaries;
  onPlanSaved: () => void;
  onSelectionChange: (channelCode: string, employeeId: string) => void;
};

type FormState = {
  channelCode: string;
  employeeId: string;
  monthCode: string;
  auditsCount: string;
  adminDaysCount: string;
  negotiationsCount: string;
  comment: string;
};

const initialForm: FormState = {
  channelCode: '',
  employeeId: '',
  monthCode: '',
  auditsCount: '',
  adminDaysCount: '',
  negotiationsCount: '',
  comment: '',
};

function PlanningForm({ dictionaries, onPlanSaved, onSelectionChange }: Props) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    onSelectionChange(form.channelCode, form.employeeId);
  }, [form.channelCode, form.employeeId, onSelectionChange]);

  const setField = (name: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const handleChannelChange = (channelCode: string) => {
    setForm((current) => ({ ...current, channelCode, employeeId: '' }));
    setMessage(null);
  };

  const handleEmployeeSelect = (employee: Employee | null) => {
    setField('employeeId', employee?.id ?? '');
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!form.channelCode) nextErrors.channelCode = 'Оберіть канал збуту.';
    if (!form.employeeId) nextErrors.employeeId = 'Оберіть ПІБ зі списку співробітників.';
    if (!form.monthCode) nextErrors.monthCode = 'Оберіть місяць планування.';

    (['auditsCount', 'adminDaysCount', 'negotiationsCount'] as const).forEach((field) => {
      if (!form[field]) {
        nextErrors[field] = 'Заповніть це поле.';
      } else if (!/^\d+$/.test(form[field])) {
        nextErrors[field] = 'Вкажіть ціле число 0 або більше.';
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!validate()) {
      setMessage({ type: 'error', text: 'Перевірте поля форми та спробуйте ще раз.' });
      return;
    }

    const input: PlanInput = {
      channelCode: form.channelCode,
      employeeId: form.employeeId,
      monthCode: form.monthCode,
      auditsCount: Number(form.auditsCount),
      adminDaysCount: Number(form.adminDaysCount),
      negotiationsCount: Number(form.negotiationsCount),
      comment: form.comment.trim(),
    };

    try {
      const result = await activeStorageAdapter.savePlan(input, () => window.confirm(
        'План для цього користувача, каналу та місяця вже існує. Бажаєте оновити актуальний план?',
      ));

      if (result.status === 'cancelled') {
        return;
      }

      setForm((current) => ({
        ...current,
        monthCode: '',
        auditsCount: '',
        adminDaysCount: '',
        negotiationsCount: '',
        comment: '',
      }));
      setMessage({
        type: 'success',
        text: result.status === 'created' ? 'План успішно збережено.' : 'План успішно оновлено.',
      });
      onPlanSaved();
    } catch {
      setMessage({ type: 'error', text: 'Не вдалося зберегти план. Перевірте підключення до сховища даних.' });
    }
  };

  return (
    <section className="panel" aria-labelledby="planning-title">
      <div className="section-heading">
        <div>
          <p className="section-kicker">Робоча форма</p>
          <h2 id="planning-title">План активностей</h2>
        </div>
      </div>

      {message && <div className={`message message--${message.type}`}>{message.text}</div>}

      <form className="planning-form" onSubmit={handleSubmit} noValidate>
        <label className="field">
          <span>Канал збуту</span>
          <select value={form.channelCode} onChange={(event) => handleChannelChange(event.target.value)}>
            <option value="">Оберіть канал збуту</option>
            {dictionaries.channels.map((channel) => (
              <option key={channel.id} value={channel.code}>{channel.name}</option>
            ))}
          </select>
          {errors.channelCode && <span className="field-error">{errors.channelCode}</span>}
        </label>

        <EmployeeAutocomplete
          channelCode={form.channelCode}
          employees={dictionaries.employees}
          selectedEmployeeId={form.employeeId}
          onSelect={handleEmployeeSelect}
        />
        {errors.employeeId && <span className="field-error field-error--inline">{errors.employeeId}</span>}

        <label className="field">
          <span>Місяць планування</span>
          <select value={form.monthCode} onChange={(event) => setField('monthCode', event.target.value)}>
            <option value="">Оберіть місяць</option>
            {dictionaries.months.map((month) => (
              <option key={month.id} value={month.monthCode}>{month.monthName}</option>
            ))}
          </select>
          {errors.monthCode && <span className="field-error">{errors.monthCode}</span>}
        </label>

        <div className="activity-grid">
          <ActivityCard
            error={errors.auditsCount}
            helperText="Значення вноситься у кількості візитів."
            label="Аудити / Сторчеки"
            name="auditsCount"
            onChange={(value) => setField('auditsCount', value)}
            placeholder="Введіть кількість візитів"
            value={form.auditsCount}
          />
          <ActivityCard
            error={errors.adminDaysCount}
            helperText="Значення вноситься у кількості днів."
            label="Адміністративні дні"
            name="adminDaysCount"
            onChange={(value) => setField('adminDaysCount', value)}
            placeholder="Введіть кількість днів"
            value={form.adminDaysCount}
          />
          <ActivityCard
            error={errors.negotiationsCount}
            helperText="Значення вноситься у кількості перемовин."
            label="Перемовини"
            name="negotiationsCount"
            onChange={(value) => setField('negotiationsCount', value)}
            placeholder="Введіть кількість перемовин"
            value={form.negotiationsCount}
          />
        </div>

        <label className="field">
          <span>Коментар</span>
          <textarea
            onChange={(event) => setField('comment', event.target.value)}
            placeholder="Необов'язково"
            rows={4}
            value={form.comment}
          />
        </label>

        <div className="form-actions">
          <button type="submit">Зберегти план</button>
        </div>
      </form>
    </section>
  );
}

export default PlanningForm;
