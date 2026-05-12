import SimpleBeamForm from '../components/forms/SimpleBeamForm';

interface Props {
  onBack: () => void;
}

export default function SimpleBeamPage({ onBack }: Props) {
  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-12" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center sticky top-0 z-20">
        <button onClick={onBack} className="mr-3 text-lg text-gray-500 hover:text-gray-800 transition-colors">&larr;</button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight text-[#1a1a2e]">鋼構簡支梁</h1>
          <p className="text-xs text-[#9ca3af]">結構設計檢核（彎矩・剪力・撓度）</p>
        </div>
      </header>

      <div className="px-4 py-4 max-w-2xl mx-auto">
        <SimpleBeamForm />
      </div>
    </div>
  );
}
