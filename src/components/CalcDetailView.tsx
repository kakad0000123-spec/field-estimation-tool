import { ComponentData, EstimationCase } from '../data/types';
import { generateComponentDetail } from '../export/calcDetailSheet';

interface Props {
  comp: ComponentData;
  caseData: EstimationCase;
}

export default function CalcDetailView({ comp, caseData }: Props) {
  const rows = generateComponentDetail(comp, caseData);

  return (
    <div className="mt-3 p-3 bg-gray-50 rounded-lg overflow-x-auto">
      {rows.map((row, i) => {
        const text = String(row[0] ?? '');

        // Separator line
        if (text.startsWith('═') || text.startsWith('─')) {
          return (
            <div key={i} className="border-t border-gray-300 my-2" />
          );
        }

        // Empty row
        if (text === '') {
          return <div key={i} className="h-1" />;
        }

        // Header line (e.g. [混凝土 fc'=280])
        if (text.startsWith('[')) {
          return (
            <div key={i} className="font-bold text-xs text-gray-800 mt-2">
              {text}
            </div>
          );
        }

        // Normal formula/text line
        return (
          <div key={i} className="font-mono text-xs text-gray-700 leading-5 whitespace-pre-wrap">
            {text}
          </div>
        );
      })}
    </div>
  );
}
