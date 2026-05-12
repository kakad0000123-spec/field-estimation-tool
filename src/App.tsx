import { useState } from 'react';
import SystemMenu from './pages/SystemMenu';
import CaseList from './pages/CaseList';
import CaseDetail from './pages/CaseDetail';
import SimpleBeamPage from './pages/SimpleBeamPage';

type Page =
  | { name: 'menu' }
  | { name: 'caseList' }
  | { name: 'caseDetail'; caseId: number }
  | { name: 'simpleBeam' };

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'menu' });

  switch (page.name) {
    case 'menu':
      return (
        <SystemMenu
          onNavigateEstimation={() => setPage({ name: 'caseList' })}
          onNavigateSteelBeam={() => setPage({ name: 'simpleBeam' })}
        />
      );
    case 'caseList':
      return (
        <CaseList
          onBack={() => setPage({ name: 'menu' })}
          onSelectCase={(id) => setPage({ name: 'caseDetail', caseId: id })}
        />
      );
    case 'caseDetail':
      return (
        <CaseDetail
          caseId={page.caseId}
          onBack={() => setPage({ name: 'caseList' })}
        />
      );
    case 'simpleBeam':
      return <SimpleBeamPage onBack={() => setPage({ name: 'menu' })} />;
  }
}
