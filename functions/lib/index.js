"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.onUserOffline = exports.onSongShared = exports.onAlert = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
function isExpoPushToken(token) {
    return token.startsWith('ExponentPushToken') || token.startsWith('ExpoPushToken');
}
async function sendPush(token, message) {
    if (!token)
        return;
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
        }
        else {
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
exports.onAlert = functions.firestore
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
    }
    catch (error) {
        console.error('Error sending notification:', error);
    }
});
exports.onSongShared = functions.firestore
    .document('songs/{songId}')
    .onCreate(async (snapshot, context) => {
    const song = snapshot.data();
    // Get all participants except the sender
    const participants = song.participants || [];
    for (const participantId of participants) {
        if (participantId === song.sharedBy)
            continue;
        const userDoc = await admin.firestore()
            .collection('users')
            .doc(participantId)
            .get();
        const userData = userDoc.data();
        const pushToken = userData?.pushToken;
        if (!pushToken)
            continue;
        try {
            await sendPush(pushToken, {
                title: '🎵 Nueva canción compartida',
                body: `${song.title} - ${song.artist}`,
                data: {
                    type: 'song',
                    songId: String(context.params.songId),
                },
            });
        }
        catch (error) {
            console.error('Error sending notification:', error);
        }
    }
});
exports.onUserOffline = functions.pubsub
    .schedule('every 5 minutes')
    .onRun(async (context) => {
    // Check for users who haven't been active in 5 minutes
    // and update their status
    const fiveMinutesAgo = admin.firestore.Timestamp.fromDate(new Date(Date.now() - 5 * 60 * 1000));
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
