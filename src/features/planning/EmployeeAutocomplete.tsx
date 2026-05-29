import { useEffect, useMemo, useState } from 'react';
import type { Employee } from '../../types/domain';

type Props = {
  channelCode: string;
  employees: Employee[];
  selectedEmployeeId: string;
  onSelect: (employee: Employee | null) => void;
};

function EmployeeAutocomplete({ channelCode, employees, selectedEmployeeId, onSelect }: Props) {
  const selectedEmployee = employees.find((employee) => employee.id === selectedEmployeeId);
  const [query, setQuery] = useState(selectedEmployee?.fullName ?? '');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(selectedEmployee?.fullName ?? '');
  }, [selectedEmployee?.fullName]);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const channelEmployees = employees.filter((employee) => employee.channelCode === channelCode);

    if (!normalizedQuery) {
      return channelEmployees;
    }

    return channelEmployees.filter((employee) => employee.fullName.toLowerCase().includes(normalizedQuery));
  }, [channelCode, employees, query]);

  const isDisabled = !channelCode;

  return (
    <label className="field autocomplete-field">
      <span>ПІБ</span>
      <input
        autoComplete="off"
        disabled={isDisabled}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onChange={(event) => {
          setQuery(event.target.value);
          onSelect(null);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(Boolean(channelCode))}
        placeholder={isDisabled ? 'Спочатку оберіть канал збуту' : 'Почніть вводити ПІБ'}
        type="text"
        value={query}
      />
      <span className="helper-text">
        {isDisabled
          ? 'Спочатку оберіть канал збуту'
          : 'Оберіть співробітника зі списку, вільний ввід не зберігається.'}
      </span>

      {isOpen && channelCode && (
        <div className="autocomplete-list">
          {filteredEmployees.length === 0 ? (
            <div className="autocomplete-empty">Користувача не знайдено</div>
          ) : (
            filteredEmployees.map((employee) => (
              <button
                className="autocomplete-option"
                key={employee.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setQuery(employee.fullName);
                  onSelect(employee);
                  setIsOpen(false);
                }}
                type="button"
              >
                {employee.fullName}
              </button>
            ))
          )}
        </div>
      )}
    </label>
  );
}

export default EmployeeAutocomplete;
