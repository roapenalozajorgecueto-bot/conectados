export const strings = {
  // App
  appName: 'Conectados',
  appTagline: 'Comparte música con quien más quieres',
  
  // Auth
  login: 'Iniciar Sesión',
  register: 'Registrarse',
  logout: 'Cerrar Sesión',
  email: 'Correo electrónico',
  password: 'Contraseña',
  confirmPassword: 'Confirmar contraseña',
  name: 'Nombre completo',
  forgotPassword: '¿Olvidaste tu contraseña?',
  noAccount: '¿No tienes cuenta?',
  haveAccount: '¿Ya tienes cuenta?',
  signUp: 'Regístrate',
  signIn: 'Inicia Sesión',
  
  // Tabs
  home: 'Inicio',
  songs: 'Canciones',
  profile: 'Perfil',
  
  // Home
  welcome: 'Bienvenido',
  noPartner: 'Vincula a tu pareja para comenzar',
  partnerConnected: 'Conectado con',
  
  // Need Button
  needYou: 'Te Necesito',
  sendingAlert: 'Enviando...',
  alertSent: '¡Enviado!',
  alertError: 'Error al enviar',
  confirmAlert: '¿Enviar notificación a tu pareja?',
  
  // Songs
  sharedSongs: 'Canciones compartidas',
  noSongs: 'Sin canciones compartidas',
  noSongsMessage: 'Las canciones que compartas aparecerán aquí',
  shareSong: 'Compartir canción',
  songUrl: 'URL de Spotify o YouTube',
  sharing: 'Compartiendo...',
  shareSuccess: '¡Canción compartida!',
  shareError: 'Error al compartir',
  
  // Profile
  editProfile: 'Editar perfil',
  linkPartner: 'Vincular Pareja',
  partnerCode: 'Código de tu pareja',
  generateCode: 'Generar nuevo código',
  yourCode: 'Tu código',
  unlinkPartner: 'Desvincular',
  confirmUnlink: '¿Estás seguro de desvincular a tu pareja?',
  
  // Common
  loading: 'Cargando...',
  error: 'Error',
  retry: 'Reintentar',
  cancel: 'Cancelar',
  confirm: 'Confirmar',
  save: 'Guardar',
  delete: 'Eliminar',
  edit: 'Editar',
  done: 'Listo',
  ok: 'OK',
  
  // Errors
  errorGeneric: 'Algo salió mal',
  errorNetwork: 'Sin conexión a internet',
  errorAuth: 'Error de autenticación',
  errorNotFound: 'No encontrado',
  
  // Notifications
  newSongNotification: 'Nueva canción compartida',
  alertNotification: 'Te necesitan',
};

export type StringKey = keyof typeof strings;
