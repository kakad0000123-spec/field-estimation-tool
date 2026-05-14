import { useState } from 'react';
import SystemMenu, { ToolId } from './pages/SystemMenu';
import CaseList from './pages/CaseList';
import CaseDetail from './pages/CaseDetail';
import AllowableBeam from './pages/AllowableBeam';
import AllowableColumn from './pages/AllowableColumn';
import AllowableGrating from './pages/AllowableGrating';
import AllowableDeck from './pages/AllowableDeck';
import AllowableSummary from './pages/AllowableSummary';

type Page =
  | { name: 'menu' }
  | { name: 'caseList'; tool: ToolId }
  | { name: 'caseDetail'; tool: ToolId; caseId: number }
  | { name: 'allowableBeam' }
  | { name: 'allowableColumn' }
  | { name: 'allowableGrating' }
  | { name: 'allowableDeck' }
  | { name: 'allowableSummary' };

const ALLOWABLE_TOOL_PAGES: Partial<Record<ToolId, Page['name']>> = {
  'allowable-beam': 'allowableBeam',
  'allowable-column': 'allowableColumn',
  'allowable-grating': 'allowableGrating',
  'allowable-deck': 'allowableDeck',
  'allowable-summary': 'allowableSummary',
};

export default function App() {
  const [page, setPage] = useState<Page>({ name: 'menu' });
  const goMenu = () => setPage({ name: 'menu' });
  const goAllowable = (target: 'beam' | 'column' | 'grating' | 'deck') => {
    const map = {
      beam: 'allowableBeam', column: 'allowableColumn',
      grating: 'allowableGrating', deck: 'allowableDeck',
    } as const;
    setPage({ name: map[target] } as Page);
  };

  switch (page.name) {
    case 'menu':
      return (
        <SystemMenu
          onNavigate={(tool) => {
            const standalone = ALLOWABLE_TOOL_PAGES[tool];
            if (standalone) {
              setPage({ name: standalone } as Page);
            } else {
              setPage({ name: 'caseList', tool });
            }
          }}
        />
      );
    case 'caseList':
      return (
        <CaseList
          onBack={goMenu}
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
    case 'allowableBeam':    return <AllowableBeam onBack={goMenu} />;
    case 'allowableColumn':  return <AllowableColumn onBack={goMenu} />;
    case 'allowableGrating': return <AllowableGrating onBack={goMenu} />;
    case 'allowableDeck':    return <AllowableDeck onBack={goMenu} />;
    case 'allowableSummary': return <AllowableSummary onBack={goMenu} onNavigate={goAllowable} />;
  }
}
