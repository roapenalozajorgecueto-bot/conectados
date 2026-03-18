import { describe, expect, it, beforeEach, jest } from '@jest/globals';

type AddDocCall = {
  coll: string;
  data: any;
};

const mockAddDocCalls: AddDocCall[] = [];

jest.mock('../services/firebase/config', () => ({
  db: { __mock: true },
}));

jest.mock('firebase/firestore', () => {
  const collection = (_db: any, coll: string) => ({ __type: 'collection', coll });
  const serverTimestamp = () => ({ __type: 'serverTimestamp' });

  const addDoc = async (collRef: any, data: any) => {
    mockAddDocCalls.push({ coll: collRef?.coll, data });
    return { id: `song_${mockAddDocCalls.length}` };
  };

  // stubs for other imports used in services/firebase/firestore.service.ts
  const doc = () => ({});
  const getDoc = async () => ({ exists: () => false, data: () => null });
  const setDoc = async () => {};
  const updateDoc = async () => {};
  const deleteDoc = async () => {};
  const query = () => ({});
  const where = () => ({});
  const orderBy = () => ({});
  const onSnapshot = () => () => {};
  const getDocs = async () => ({ empty: true, docs: [] });
  const limit = () => ({});

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

describe('Integration: Share song flow (20.2)', () => {
  beforeEach(() => {
    mockAddDocCalls.length = 0;
  });

  it('writes a songs document with senderId/receiverId/participants', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sharesSong } = require('../services/firebase/firestore.service');

    const id = await sharesSong(
      {
        title: 'T',
        artist: 'A',
        thumbnail: 'https://img',
        url: 'https://youtu.be/dQw4w9WgXcQ',
        platform: 'youtube',
      },
      'uidA',
      ['uidA', 'uidB'],
      { partnerId: 'uidB' },
    );

    expect(id).toBe('song_1');
    expect(mockAddDocCalls).toHaveLength(1);
    expect(mockAddDocCalls[0].coll).toBe('songs');

    const payload = mockAddDocCalls[0].data;
    expect(payload.senderId).toBe('uidA');
    expect(payload.receiverId).toBe('uidB');
    expect(payload.sharedBy).toBe('uidA');
    expect(payload.participants).toEqual(['uidA', 'uidB']);
    expect(payload.sharedAt).toEqual({ __type: 'serverTimestamp' });
    expect(payload.title).toBe('T');
    expect(payload.platform).toBe('youtube');
  });

  it('derives receiverId from participants when partnerId is not provided', async () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sharesSong } = require('../services/firebase/firestore.service');

    await sharesSong(
      {
        title: 'T2',
        artist: 'A2',
        url: 'https://open.spotify.com/track/abc',
        platform: 'spotify',
      },
      'uidA',
      ['uidA', 'uidB'],
    );

    const payload = mockAddDocCalls[0].data;
    expect(payload.receiverId).toBe('uidB');
    expect(payload.senderId).toBe('uidA');
  });
});

