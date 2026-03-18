// services/firebase/messaging.service.ts
import type { Notification } from 'expo-notifications';
import Constants from 'expo-constants';
import { updateFcmToken } from './firestore.service';

// Configurar cómo se muestran las notificaciones cuando la app está abierta
let handlerInstalled = false;
async function ensureNotificationHandlerInstalled(Notifications: typeof import('expo-notifications')) {
  if (handlerInstalled) return;
  handlerInstalled = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Registrar el dispositivo y obtener el token push
export async function registerForPushNotifications(uid: string) {
  // Desde SDK 53, Expo Go ya NO soporta notificaciones remotas con expo-notifications.
  // Para push remoto necesitas un Development Build (Dev Client) o app publicada.
  // Doc: https://docs.expo.dev/develop/development-builds/introduction/
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appOwnership = (Constants as any)?.appOwnership;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const executionEnvironment = (Constants as any)?.executionEnvironment;
  const isExpoGo = appOwnership === 'expo' || executionEnvironment === 'storeClient';
  if (isExpoGo) {
    return null;
  }

  const Notifications = await import('expo-notifications');
  const Device = await import('expo-device');
  await ensureNotificationHandlerInstalled(Notifications);

  // Solo funciona en dispositivos físicos, no en simuladores
  if (!Device.isDevice) {
    console.warn('Las notificaciones push solo funcionan en dispositivos físicos');
    return null;
  }

  // Android: configurar canal para notificaciones de alta prioridad
  if (Device.osName === 'Android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF2D55',
    });
  }

  // Pedir permiso al usuario
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('El usuario rechazó los permisos de notificaciones');
    return null;
  }

  // Obtener el token Expo Push Token
  const projectId =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Constants as any)?.easConfig?.projectId ??
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (Constants.expoConfig as any)?.extra?.eas?.projectId;

  const token = (
    await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    )
  ).data;

  // Guardar el token en Firestore para que la Cloud Function lo use
  await updateFcmToken(uid, token);

  return token;
}

// Escuchar notificaciones cuando la app está en primer plano
export function setupForegroundListener(
  onReceive: (notification: Notification) => void
) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Notifications = require('expo-notifications') as typeof import('expo-notifications');
  const sub = Notifications.addNotificationReceivedListener(onReceive);
  return () => sub.remove(); // retorna función de limpieza
}
