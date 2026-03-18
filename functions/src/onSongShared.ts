import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const onSongShared = functions.firestore
  .document('songs/{songId}')
  .onCreate(async (snapshot, context) => {
    const song = snapshot.data();
    
    if (!song) {
      console.log('Invalid song data');
      return;
    }
    
    // Get all participants except the sender
    const participants: string[] = song.participants || [];
    const sharedBy = song.sharedBy;
    
    for (const participantId of participants) {
      if (participantId === sharedBy) continue;
      
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(participantId)
        .get();
      
      const userData = userDoc.data();
      const pushToken = userData?.pushToken;
      
      if (!pushToken) {
        console.log(`No push token for user ${participantId}`);
        continue;
      }
      
      // Send notification to each participant
      const payload: admin.messaging.MessagingPayload = {
        notification: {
          title: '🎵 Nueva canción compartida',
          body: `${song.title} - ${song.artist}`,
        },
        data: {
          type: 'song',
          songId: context.params.songId,
          platform: song.platform || '',
        },
      };
      
      try {
        await admin.messaging().sendToDevice(pushToken, payload);
        console.log(`Song notification sent to ${participantId}`);
      } catch (error) {
        console.error(`Error sending notification to ${participantId}:`, error);
      }
    }
    
    // Also send an "I need you" alert if the song was shared with that intent
    if (song.sendAlert === true && song.partnerId) {
      const alertPayload: admin.messaging.MessagingPayload = {
        notification: {
          title: '💕 Te necesitan',
          body: 'Tu pareja te extraño y te compartió una canción',
        },
        data: {
          type: 'alert',
          songId: context.params.songId,
        },
      };
      
      const partnerDoc = await admin.firestore()
        .collection('users')
        .doc(song.partnerId)
        .get();
      
      const partnerData = partnerDoc.data();
      
      if (partnerData?.pushToken) {
        try {
          await admin.messaging().sendToDevice(partnerData.pushToken, alertPayload);
        } catch (error) {
          console.error('Error sending alert notification:', error);
        }
      }
    }
  });
