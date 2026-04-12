import Dexie, { type EntityTable } from 'dexie';
import { EstimationCase, ComponentData } from '../data/types';

const db = new Dexie('field-estimation') as Dexie & {
  cases: EntityTable<EstimationCase, 'id'>;
  components: EntityTable<ComponentData, 'id'>;
};

db.version(1).stores({
  cases: '++id, name, createdAt',
  components: '++id, caseId, type, createdAt',
});

async function deleteCase(caseId: number) {
  await db.transaction('rw', db.cases, db.components, async () => {
    await db.components.where('caseId').equals(caseId).delete();
    await db.cases.delete(caseId);
  });
}

export { db, deleteCase };
