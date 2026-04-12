interface Props {
  onNavigate: () => void;
}

export default function SystemMenu({ onNavigate }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[#f8f9fa]" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="w-14 h-14 bg-[#2563eb]/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <span className="text-2xl">&#9634;</span>
        </div>
        <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1 tracking-tight">
          現地評估小工具
        </h1>
        <p className="text-[#9ca3af] mb-8 text-sm">Field Estimation Tool</p>

        <button
          onClick={onNavigate}
          className="w-full h-12 bg-[#2563eb] hover:bg-blue-700 active:bg-blue-800 text-white text-base font-semibold rounded-xl shadow-sm transition-all duration-200 active:scale-[0.98]"
        >
          現場估價
        </button>

        <button
          onClick={() => window.open('https://docs.google.com/forms/d/1fQJroH7mztkhQbomjjZDNlbLTvPCOpOSINQmszOUwq8/viewform', '_blank')}
          className="w-full h-11 mt-3 bg-white hover:bg-gray-50 active:bg-gray-100 text-[#6b7280] text-sm font-medium rounded-xl border border-gray-200 transition-all duration-200 active:scale-[0.98]"
        >
          意見回饋
        </button>
      </div>

      <p className="mt-6 text-xs text-[#9ca3af]">v1.0 beta</p>
    </div>
  );
}
