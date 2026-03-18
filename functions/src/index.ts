import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

type PushData = Record<string, string>;

function isExpoPushToken(token: string) {
  return token.startsWith('ExponentPushToken') || token.startsWith('ExpoPushToken');
}

async function sendPush(
  token: string,
  message: { title: string; body: string; data?: PushData }
) {
  if (!token) return;

  // Expo Go / Expo managed: Expo Push Token (no sirve con FCM directo)
  if (isExpoPushToken(token)) {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        sound: 'default',
        title: message.title,
        body: message.body,
        data: message.data ?? {},
      }),
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      console.error('Expo push error:', res.status, json);
    } else {
      console.log('Expo push ok:', json);
    }
    return;
  }

  // Dev build / bare: FCM token
  await admin.messaging().sendToDevice(token, {
    notification: { title: message.title, body: message.body },
    data: message.data ?? {},
  });
}

export const onAlert = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snapshot, context) => {
    const alert = snapshot.data();
    
    // Get partner's push token
    const partnerDoc = await admin.firestore()
      .collection('users')
      .doc(alert.to)
      .get();
    
    const partnerData = partnerDoc.data();
    const pushToken = partnerData?.pushToken;
    
    if (!pushToken) {
      console.log('No push token found for partner');
      return;
    }
    
    try {
      await sendPush(pushToken, {
        title: '💖 Te necesitan',
        body: alert.message || 'Tu pareja te extrañó',
        data: {
          type: 'alert',
          alertId: String(context.params.alertId),
          from: String(alert.from ?? ''),
        },
      });
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  });

export const onSongShared = functions.firestore
  .document('songs/{songId}')
  .onCreate(async (snapshot, context) => {
    const song = snapshot.data();
    
    // Get all participants except the sender
    const participants = song.participants || [];
    
    for (const participantId of participants) {
      if (participantId === song.sharedBy) continue;
      
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(participantId)
        .get();
      
      const userData = userDoc.data();
      const pushToken = userData?.pushToken;
      
      if (!pushToken) continue;
      
      try {
        await sendPush(pushToken, {
          title: '🎵 Nueva canción compartida',
          body: `${song.title} - ${song.artist}`,
          data: {
            type: 'song',
            songId: String(context.params.songId),
          },
        });
      } catch (error) {
        console.error('Error sending notification:', error);
      }
    }
  });

export const onUserOffline = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    // Check for users who haven't been active in 5 minutes
    // and update their status
    const fiveMinutesAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 5 * 60 * 1000)
    );
    
    const inactiveUsers = await admin.firestore()
      .collection('users')
      .where('lastActive', '<', fiveMinutesAgo)
      .get();
    
    const batch = admin.firestore().batch();
    
    inactiveUsers.docs.forEach(doc => {
      batch.update(doc.ref, { isOnline: false });
    });
    
    await batch.commit();
  });
