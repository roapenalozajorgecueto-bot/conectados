// functions/src/onAlert.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const sendNeedAlert = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snap) => {
    const { receiverId, senderId } = snap.data();

    const receiverDoc = await admin.firestore()
      .doc(`users/${receiverId}`).get();
    const { fcmToken, name } = receiverDoc.data()!;

    const senderDoc = await admin.firestore()
      .doc(`users/${senderId}`).get();
    const senderName = senderDoc.data()!.name;

    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: `💛 ${senderName} te necesita`,
        body: '¿Estás ahí?'
      },
      android: { priority: 'high' },
      apns: { headers: { 'apns-priority': '10' } }
    });
  });