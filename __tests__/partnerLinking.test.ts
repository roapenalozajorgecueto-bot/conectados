import { describe, expect, it, beforeEach, jest } from '@jest/globals';

type UserDoc = {
  name?: string;
  email?: string;
  pairingCode?: string;
  partnerId?: string;
};

// In-memory Firestore mock store
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
    if (docRef?.coll !== 'users') throw new Error('mock only supports users');
    const data = mockUsers.get(docRef.id);
    return mockMakeDocSnap(docRef.id, data);
  };

  const updateDoc = async (docRef: any, patch: any) => {
    if (docRef?.coll !== 'users') throw new Error('mock only supports users');
    // Simulate security rules: cannot update partner doc in this test scenario
    if (docRef.id === 'B') {
      throw new Error('permission-denied');
    }
    const current = mockUsers.get(docRef.id) ?? {};
    mockUsers.set(docRef.id, { ...current, ...patch });
  };

  const getDocs = async (q: any) => {
    const clauses: any[] = Array.isArray(q?.clauses) ? q.clauses : [];
    const whereClause = clauses.find((c) => c?.__type === 'where');
    const limitClause = clauses.find((c) => c?.__type === 'limit');

    let results: Array<{ id: string; data: () => any }> = [];
    if (q?.collRef?.coll !== 'users') {
      results = [];
    } else if (whereClause?.field === 'pairingCode' && whereClause.op === '==') {
      for (const [id, data] of mockUsers.entries()) {
        if (String(data?.pairingCode ?? '') === String(whereClause.value)) {
          results.push({ id, data: () => data });
        }
      }
    } else if (whereClause?.field === 'partnerId' && whereClause.op === '==') {
      for (const [id, data] of mockUsers.entries()) {
        if (String(data?.partnerId ?? '') === String(whereClause.value)) {
          results.push({ id, data: () => data });
        }
      }
    }

    if (typeof limitClause?.n === 'number') {
      results = results.slice(0, limitClause.n);
    }

    return {
      empty: results.length === 0,
      docs: results,
    };
  };

  return {
    doc,
    collection,
    where,
    limit,
    query,
    serverTimestamp,
    getDoc,
    getDocs,
    updateDoc,
  };
});

describe('Bidirectional Partner Linking', () => {
  beforeEach(() => {
    mockUsers.clear();
    mockUsers.set('A', { pairingCode: 'AAAAAA', partnerId: '' });
    mockUsers.set('B', { pairingCode: 'BBBBBB', partnerId: '' });
  });

  it('links A -> B immediately and lets B auto-link back later', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { linkWithPartner, findIncomingPartnerId } = require('../services/firebase/firestore.service');

    // A enters B's code
    await expect(linkWithPartner('A', 'BBBBBB')).resolves.toBeTruthy();

    // Only A document is guaranteed to update (partner update may fail by rules)
    expect(mockUsers.get('A')?.partnerId).toBe('B');
    expect(mockUsers.get('B')?.partnerId).toBe('');

    // Later: B discovers incoming link (A.partnerId === B)
    await expect(findIncomingPartnerId('B')).resolves.toBe('A');
  });
});
