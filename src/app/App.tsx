import { useCallback, useMemo, useState } from 'react';
import Header from '../components/Header';
import AdminPanel from '../features/admin/AdminPanel';
import HistoryView from '../features/history/HistoryView';
import PlanningForm from '../features/planning/PlanningForm';
import { dictionaryRepository } from '../services/storage/localRepositories';
import type { Dictionaries } from '../types/domain';

function App() {
  const [dictionaries, setDictionaries] = useState<Dictionaries>(() => dictionaryRepository.get());
  const [selectedChannelCode, setSelectedChannelCode] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  const activeDictionaries = useMemo(() => ({
    channels: dictionaries.channels.filter((channel) => channel.isActive),
    employees: dictionaries.employees.filter((employee) => employee.isActive),
    months: dictionaries.months.filter((month) => month.isActive),
  }), [dictionaries]);

  const handleSelectionChange = useCallback((channelCode: string, employeeId: string) => {
    setSelectedChannelCode(channelCode);
    setSelectedEmployeeId(employeeId);
  }, []);

  const handleDictionariesUpdated = (nextDictionaries: Dictionaries) => {
    dictionaryRepository.replace(nextDictionaries);
    setDictionaries(nextDictionaries);
    setSelectedChannelCode('');
    setSelectedEmployeeId('');
    setRefreshToken((value) => value + 1);
  };

  return (
    <div className="app">
      <Header />

      <main className="page-shell">
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
