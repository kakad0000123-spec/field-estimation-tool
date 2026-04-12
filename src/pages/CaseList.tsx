import { useState, useEffect, useCallback } from 'react';
import { db, deleteCase } from '../store/db';
import { EstimationCase } from '../data/types';
import { DEFAULT_PRICES, DEFAULT_WASTE_RATES, DEFAULT_CALC_SETTINGS } from '../data/defaults';

interface Props {
  onBack: () => void;
  onSelectCase: (id: number) => void;
}

export default function CaseList({ onBack, onSelectCase }: Props) {
  const [cases, setCases] = useState<EstimationCase[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newSupervisor, setNewSupervisor] = useState('');

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editSupervisor, setEditSupervisor] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmCase, setDeleteConfirmCase] = useState<EstimationCase | null>(null);

  const load = useCallback(async () => {
    const allCases = await db.cases.orderBy('createdAt').reverse().toArray();
    setCases(allCases);
    const allComps = await db.components.toArray();
    const map: Record<number, number> = {};
    for (const c of allComps) {
      map[c.caseId] = (map[c.caseId] || 0) + 1;
    }
    setCounts(map);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const now = new Date().toISOString();
    const id = await db.cases.add({
      name: newName.trim(),
      company: newCompany.trim(),
      supervisor: newSupervisor.trim(),
      date: new Date().toISOString().slice(0, 10),
      prices: { ...DEFAULT_PRICES },
      wasteRates: { ...DEFAULT_WASTE_RATES },
      calcSettings: { ...DEFAULT_CALC_SETTINGS },
      createdAt: now,
      updatedAt: now,
    });
    setShowForm(false);
    setNewName('');
    setNewCompany('');
    setNewSupervisor('');
    onSelectCase(id as number);
  };

  const handleStartEdit = (c: EstimationCase) => {
    setEditingId(c.id!);
    setEditName(c.name);
    setEditCompany(c.company);
    setEditSupervisor(c.supervisor);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await db.cases.update(editingId, {
      name: editName.trim(),
      company: editCompany.trim(),
      supervisor: editSupervisor.trim(),
      updatedAt: new Date().toISOString(),
    });
    setEditingId(null);
    await load();
  };

  const handleDelete = async (id: number) => {
    await deleteCase(id);
    setDeleteConfirmId(null);
    setDeleteConfirmCase(null);
    await load();
  };

  const handleRequestDelete = (c: EstimationCase) => {
    setDeleteConfirmId(c.id!);
    setDeleteConfirmCase(c);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center sticky top-0 z-10">
        <button onClick={onBack} className="mr-3 text-lg text-[#6b7280] hover:text-[#1a1a2e] transition-colors">&larr;</button>
        <h1 className="text-lg font-semibold tracking-tight text-[#1a1a2e] flex-1">現場估價</h1>
      </header>

      <div className="p-4 space-y-3">
        {cases.length === 0 && !showForm && (
          <div className="text-center text-[#9ca3af] py-16">
            <div className="text-4xl mb-3 opacity-30">+</div>
            <div className="text-sm">尚無估價案，點擊下方按鈕新增</div>
          </div>
        )}

        {cases.map((c) => (
          <div key={c.id}>
            {editingId === c.id ? (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
                <h3 className="font-semibold text-[#1a1a2e] text-sm tracking-tight">修改案件</h3>
                <input className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all" placeholder="工程名稱 *" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                <input className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all" placeholder="區域" value={editCompany} onChange={(e) => setEditCompany(e.target.value)} />
                <input className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all" placeholder="監工" value={editSupervisor} onChange={(e) => setEditSupervisor(e.target.value)} />
                <div className="flex gap-2">
                  <button onClick={handleSaveEdit} className="flex-1 h-11 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-200">儲存</button>
                  <button onClick={() => setEditingId(null)} className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-[#6b7280] rounded-xl font-semibold text-sm transition-all duration-200">取消</button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                <button
                  onClick={() => onSelectCase(c.id!)}
                  className="w-full text-left p-4 active:bg-gray-50 transition-colors"
                >
                  <div className="font-semibold text-[#1a1a2e] text-sm">{c.name}</div>
                  <div className="text-xs text-[#9ca3af] mt-1.5 flex justify-between items-center">
                    <span>{c.date}</span>
                    <span className="bg-gray-100 text-[#6b7280] px-2 py-0.5 rounded-full text-xs">{counts[c.id!] ?? 0} 個構件</span>
                  </div>
                  {c.company && <div className="text-xs text-[#9ca3af] mt-1">{c.company}</div>}
                </button>
                <div className="flex border-t border-gray-100">
                  <button
                    onClick={() => handleStartEdit(c)}
                    className="flex-1 py-2.5 text-sm font-medium text-[#2563eb] active:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="text-xs">&#9998;</span> 編輯
                  </button>
                  <div className="w-px bg-gray-100" />
                  <button
                    onClick={() => handleRequestDelete(c)}
                    className="flex-1 py-2.5 text-sm font-medium text-red-500 active:bg-red-50 transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="text-xs">&#128465;</span> 刪除
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {showForm && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
            <h3 className="font-semibold text-[#1a1a2e] text-sm tracking-tight">新增估價案</h3>
            <input className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all" placeholder="工程名稱 *" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
            <input className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all" placeholder="區域" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
            <input className="w-full h-10 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all" placeholder="監工" value={newSupervisor} onChange={(e) => setNewSupervisor(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={handleCreate} className="flex-1 h-11 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all duration-200">建立</button>
              <button onClick={() => setShowForm(false)} className="flex-1 h-11 bg-gray-100 hover:bg-gray-200 text-[#6b7280] rounded-xl font-semibold text-sm transition-all duration-200">取消</button>
            </div>
          </div>
        )}
      </div>

      {!showForm && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center">
          <button
            onClick={() => setShowForm(true)}
            className="h-12 px-8 bg-[#2563eb] hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 active:scale-95"
          >
            + 新增估價案
          </button>
        </div>
      )}

      {/* Delete confirmation overlay */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => { setDeleteConfirmId(null); setDeleteConfirmCase(null); }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl p-6 mx-6 max-w-sm w-full space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-lg font-semibold text-[#1a1a2e]">確認刪除</div>
            <div className="text-sm text-[#6b7280]">
              確定要刪除「{deleteConfirmCase?.name}」嗎？<br/>此操作將同時刪除所有構件資料，且無法復原。
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 h-12 bg-red-600 hover:bg-red-700 text-white text-base font-semibold rounded-xl transition-all duration-200"
              >
                確定刪除
              </button>
              <button
                onClick={() => { setDeleteConfirmId(null); setDeleteConfirmCase(null); }}
                className="flex-1 h-12 bg-gray-100 hover:bg-gray-200 text-[#6b7280] text-base font-semibold rounded-xl transition-all duration-200"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
