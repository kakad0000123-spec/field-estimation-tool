import { useState } from 'react';
import SystemMenu, { ToolId } from './pages/SystemMenu';
import CaseList from './pages/CaseList';
import CaseDetail from './pages/CaseDetail';

type Page =
  | { name: 'menu' }
  | { name: 'caseList'; tool: ToolId }
  | { name: 'caseDetail'; tool: ToolId; caseId: number };

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'menu' });

  switch (page.name) {
    case 'menu':
      return <SystemMenu onNavigate={(tool) => setPage({ name: 'caseList', tool })} />;
    case 'caseList':
      return (
        <CaseList
          onBack={() => setPage({ name: 'menu' })}
          onSelectCase={(id) => setPage({ name: 'caseDetail', tool: page.tool, caseId: id })}
        />
      );
    case 'caseDetail':
      return (
        <CaseDetail
          caseId={page.caseId}
          onBack={() => setPage({ name: 'caseList', tool: page.tool })}
        />
      );
  }
}
