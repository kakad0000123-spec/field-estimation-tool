import { useState } from 'react';
import SystemMenu from './pages/SystemMenu';
import CaseList from './pages/CaseList';
import CaseDetail from './pages/CaseDetail';

type Page =
  | { name: 'menu' }
  | { name: 'caseList' }
  | { name: 'caseDetail'; caseId: number };

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'menu' });

  switch (page.name) {
    case 'menu':
      return <SystemMenu onNavigate={() => setPage({ name: 'caseList' })} />;
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
  }
}
