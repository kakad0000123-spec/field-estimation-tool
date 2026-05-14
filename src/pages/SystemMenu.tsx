import { useState } from 'react';

interface Props {
  onNavigate: (toolId: ToolId) => void;
}

export type ToolId =
  | 'rc-estimate'
  | 'steel-estimate'
  | 'allowable-beam'
  | 'allowable-column'
  | 'allowable-grating'
  | 'allowable-deck'
  | 'allowable-summary';

interface ToolDef {
  id: ToolId | string;
  label: string;
  description: string;
  available: boolean;
}

interface CategoryDef {
  title: string;
  hint: string;
  tools: ToolDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    title: '施工估算',
    hint: '快速估算用料、產出 Excel',
    tools: [
      { id: 'rc-estimate', label: 'RC 數量估算', description: '柱、梁、板、牆、基礎等 RC 構件用料估算', available: true },
      { id: 'steel-estimate', label: '鋼構重量計算', description: 'H 型鋼、角鋼、鋼板斷面、塗裝面積', available: true },
    ],
  },
  {
    title: '結構設計與檢核',
    hint: '依規範進行設計與檢核',
    tools: [
      { id: 'allowable-beam', label: '鋼梁 / 天車梁 容許荷重', description: 'ASD 法檢核彎曲、剪力、撓度', available: true },
      { id: 'allowable-column', label: '鋼柱 容許軸力', description: 'AISC 細長比 + 梁柱組合應力', available: true },
      { id: 'allowable-grating', label: '格柵 容許荷重', description: '均佈 + 集中荷重檢核', available: true },
      { id: 'allowable-deck', label: 'Deck 樓板 容許荷重', description: 'LRFD 法 / ACI 318', available: true },
      { id: 'allowable-summary', label: '構件綜合檢核總表', description: '一次看完已填寫構件 · 找最危險的', available: true },
      { id: 'rc-design', label: 'RC 梁柱檢核', description: '彎矩、剪力、軸力檢核', available: false },
    ],
  },
  {
    title: '載重計算',
    hint: '依台灣建築技術規則',
    tools: [
      { id: 'seismic', label: '耐震載重', description: '建築物耐震設計反應譜', available: false },
      { id: 'wind', label: '風力載重', description: '風壓 / 風力係數計算', available: false },
    ],
  },
  {
    title: '規範速查',
    hint: '常用表格與公式',
    tools: [
      { id: 'rebar-table', label: '鋼筋規格表', description: '直徑、單位重、搭接、彎鉤', available: false },
      { id: 'steel-section-table', label: '鋼材斷面表', description: 'CNS / SS400 / SN490 規格', available: false },
    ],
  },
];

export default function SystemMenu({ onNavigate }: Props) {
  const [toast, setToast] = useState<string | null>(null);

  const handleClick = (tool: ToolDef) => {
    if (tool.available) {
      onNavigate(tool.id as ToolId);
    } else {
      setToast(`「${tool.label}」開發中，敬請期待`);
      setTimeout(() => setToast(null), 1800);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-12" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header className="bg-white border-b border-gray-200 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2563eb]/10 rounded-xl flex items-center justify-center">
            <span className="text-xl">&#9634;</span>
          </div>
          <div className="flex-1">
            <h1 className="text-base font-bold text-[#1a1a2e] tracking-tight leading-tight">現地評估工具箱</h1>
            <p className="text-xs text-[#9ca3af] leading-tight">Field Estimation Toolbox</p>
          </div>
          <button
            onClick={() => window.open('https://docs.google.com/forms/d/1fQJroH7mztkhQbomjjZDNlbLTvPCOpOSINQmszOUwq8/viewform', '_blank')}
            className="px-3 py-1.5 text-xs font-medium text-[#6b7280] bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-lg border border-gray-200 transition-all duration-200"
          >
            意見回饋
          </button>
        </div>
      </header>

      <div className="px-4 pt-5 space-y-6 max-w-2xl mx-auto">
        {CATEGORIES.map((cat) => (
          <section key={cat.title}>
            <div className="flex items-baseline justify-between mb-2.5 px-1">
              <h2 className="text-sm font-bold text-[#1a1a2e] tracking-tight">{cat.title}</h2>
              <span className="text-xs text-[#9ca3af]">{cat.hint}</span>
            </div>
            <div className="space-y-2.5">
              {cat.tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleClick(tool)}
                  className={`w-full text-left bg-white rounded-xl border shadow-sm p-4 transition-all duration-200 active:scale-[0.99] flex items-center gap-3 ${
                    tool.available
                      ? 'border-gray-100 hover:border-[#2563eb]/30 hover:shadow-md'
                      : 'border-gray-100 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold tracking-tight ${tool.available ? 'text-[#1a1a2e]' : 'text-[#6b7280]'}`}>
                        {tool.label}
                      </span>
                      {!tool.available && (
                        <span className="text-[10px] font-medium text-[#9ca3af] bg-gray-100 px-1.5 py-0.5 rounded">
                          開發中
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#9ca3af] mt-0.5 truncate">{tool.description}</div>
                  </div>
                  <span className={`text-base ${tool.available ? 'text-[#2563eb]' : 'text-gray-300'}`}>&rsaquo;</span>
                </button>
              ))}
            </div>
          </section>
        ))}

        <p className="text-center text-xs text-[#9ca3af] pt-4">v1.0 beta</p>
      </div>

      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#1a1a2e] text-white text-sm px-4 py-2.5 rounded-xl shadow-lg z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
