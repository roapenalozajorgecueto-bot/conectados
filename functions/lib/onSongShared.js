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
exports.onSongShared = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
exports.onSongShared = functions.firestore
    .document('songs/{songId}')
    .onCreate(async (snapshot, context) => {
    const song = snapshot.data();
    if (!song) {
        console.log('Invalid song data');
        return;
    }
    // Get all participants except the sender
    const participants = song.participants || [];
    const sharedBy = song.sharedBy;
    for (const participantId of participants) {
        if (participantId === sharedBy)
            continue;
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
        const payload = {
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
        }
        catch (error) {
            console.error(`Error sending notification to ${participantId}:`, error);
        }
    }
    // Also send an "I need you" alert if the song was shared with that intent
    if (song.sendAlert === true && song.partnerId) {
        const alertPayload = {
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
            }
            catch (error) {
                console.error('Error sending alert notification:', error);
            }
        }
    }
});
