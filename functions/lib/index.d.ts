import * as functions from 'firebase-functions';
export declare const onAlert: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const onSongShared: functions.CloudFunction<functions.firestore.QueryDocumentSnapshot>;
export declare const onUserOffline: functions.CloudFunction<unknown>;
