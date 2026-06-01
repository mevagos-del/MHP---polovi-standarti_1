import { useCallback, useEffect, useMemo, useState } from 'react';
import Header from '../components/Header';
import AdminPanel from '../features/admin/AdminPanel';
import HistoryView from '../features/history/HistoryView';
import PlanningForm from '../features/planning/PlanningForm';
import { demoDictionaries } from '../data/demoDictionaries';
import { activeStorageAdapter, storageMode } from '../services/storage/storageAdapter';
import type { Dictionaries } from '../types/domain';

function App() {
  const [dictionaries, setDictionaries] = useState<Dictionaries>(demoDictionaries);
  const [selectedChannelCode, setSelectedChannelCode] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    activeStorageAdapter
      .getDictionaries()
      .then(setDictionaries)
      .catch(() => setLoadError('Не вдалося завантажити довідники. Перевірте налаштування сховища даних.'));
  }, []);

  const activeDictionaries = useMemo(() => ({
    channels: dictionaries.channels.filter((channel) => channel.isActive),
    employees: dictionaries.employees.filter((employee) => employee.isActive),
    months: dictionaries.months.filter((month) => month.isActive),
  }), [dictionaries]);

  const handleSelectionChange = useCallback((channelCode: string, employeeId: string) => {
    setSelectedChannelCode(channelCode);
    setSelectedEmployeeId(employeeId);
  }, []);

  const handleDictionariesUpdated = async (nextDictionaries: Dictionaries) => {
    await activeStorageAdapter.replaceDictionaries(nextDictionaries);
    const savedDictionaries = await activeStorageAdapter.getDictionaries();
    setDictionaries(savedDictionaries);
    setSelectedChannelCode('');
    setSelectedEmployeeId('');
    setRefreshToken((value) => value + 1);
  };

  return (
    <div className="app">
      <Header />

      <main className="page-shell">
        {storageMode === 'localStorage' && (
          <div className="mode-note">Демо-режим: дані зберігаються локально в браузері.</div>
        )}
        {loadError && <div className="message message--error">{loadError}</div>}

        <section className="hero-card" aria-label="Огляд модуля">
          <div>
            <p className="section-kicker">Місячне планування</p>
            <h2>Плани польових активностей в одному робочому просторі</h2>
          </div>
          <p>
            Вносьте планові значення, переглядайте актуальні плани співробітника
            та експортуйте дані для подальшої роботи команди.
          </p>
        </section>

        <div className="content-grid">
          <PlanningForm
            dictionaries={activeDictionaries}
            onPlanSaved={() => setRefreshToken((value) => value + 1)}
            onSelectionChange={handleSelectionChange}
          />

          <HistoryView
            channelCode={selectedChannelCode}
            dictionaries={activeDictionaries}
            employeeId={selectedEmployeeId}
            refreshToken={refreshToken}
          />
        </div>

        <AdminPanel
          dictionaries={activeDictionaries}
          onDictionariesUpdated={handleDictionariesUpdated}
          refreshToken={refreshToken}
        />
      </main>
    </div>
  );
}

export default App;
