import { describe, expect, it, beforeEach, jest } from '@jest/globals';

type UserDoc = {
  pairingCode?: string;
  partnerId?: string;
};

const mockUsers = new Map<string, UserDoc>();

const mockMakeDocSnap = (id: string, data: UserDoc | undefined) => ({
  id,
  exists: () => data !== undefined,
  data: () => data as any,
});

jest.mock('../services/firebase/config', () => ({
  db: { __mock: true },
}));

jest.mock('firebase/firestore', () => {
  const doc = (_db: any, coll: string, id: string) => ({ __type: 'doc', coll, id });
  const collection = (_db: any, coll: string) => ({ __type: 'collection', coll });
  const where = (field: string, op: string, value: any) => ({ __type: 'where', field, op, value });
  const limit = (n: number) => ({ __type: 'limit', n });
  const query = (collRef: any, ...clauses: any[]) => ({ __type: 'query', collRef, clauses });
  const serverTimestamp = () => ({ __type: 'serverTimestamp' });

  const getDoc = async (docRef: any) => {
    const data = mockUsers.get(docRef.id);
    return mockMakeDocSnap(docRef.id, data);
  };

  const getDocs = async (q: any) => {
    const clauses: any[] = Array.isArray(q?.clauses) ? q.clauses : [];
    const whereClause = clauses.find((c) => c?.__type === 'where');
    const limitClause = clauses.find((c) => c?.__type === 'limit');
    let results: Array<{ id: string; data: () => any }> = [];

    if (q?.collRef?.coll === 'users' && whereClause?.field === 'pairingCode') {
      for (const [id, data] of mockUsers.entries()) {
        if (String(data?.pairingCode ?? '') === String(whereClause.value)) {
          results.push({ id, data: () => data });
        }
      }
    }

    if (typeof limitClause?.n === 'number') results = results.slice(0, limitClause.n);
    return { empty: results.length === 0, docs: results };
  };

  const updateDoc = async (docRef: any, patch: any) => {
    const current = mockUsers.get(docRef.id) ?? {};
    mockUsers.set(docRef.id, { ...current, ...patch });
  };

  // stubs for unused imports in firestore.service.ts
  const setDoc = async () => {};
  const addDoc = async () => ({ id: 'mock' });
  const deleteDoc = async () => {};
  const orderBy = () => ({});
  const onSnapshot = () => () => {};

  return {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    addDoc,
    deleteDoc,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp,
    getDocs,
    limit,
  };
});

describe('Single Partner Constraint (4.4)', () => {
  beforeEach(() => {
    mockUsers.clear();
    mockUsers.set('A', { pairingCode: 'AAAAAA', partnerId: '' });
    mockUsers.set('B', { pairingCode: 'BBBBBB', partnerId: '' });
    mockUsers.set('C', { pairingCode: 'CCCCCC', partnerId: 'X' }); // already linked
  });

  it('prevents linking if I already have a partner', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { linkWithPartner } = require('../services/firebase/firestore.service');
    mockUsers.set('A', { pairingCode: 'AAAAAA', partnerId: 'B' });
    await expect(linkWithPartner('A', 'BBBBBB')).rejects.toThrow(/Ya est/);
  });

  it('prevents linking if the target user already has a partner', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { linkWithPartner } = require('../services/firebase/firestore.service');
    await expect(linkWithPartner('A', 'CCCCCC')).rejects.toThrow(/Este usuario ya/);
  });
});
