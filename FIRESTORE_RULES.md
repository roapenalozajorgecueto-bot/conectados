# Reglas de Firestore (para que deje de salir `permission-denied`)

Si ves errores como:

`FirebaseError: [code=permission-denied]: Missing or insufficient permissions.`

significa que **las reglas de Firestore estÃ¡n bloqueando** lecturas/escrituras desde la app.

## Opción A (rápida para desarrollo)

En Firebase Console â†’ Firestore Database â†’ Rules:

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Esto permite leer/escribir todo a usuarios autenticados. **No es recomendable para producciÃ³n**.

## Opción B (más segura, pero puede requerir cambios de modelo)

Tu app actualmente:
- Lee `users/{uid}` del usuario actual.
- Lee `users/{partnerId}` para ver a la pareja.
- Consulta por `pairingCode` para vincular (esto requiere `list` sobre `users`).
- Lee/escribe `songs` y `alerts`.

Para un modelo mÃ¡s seguro, normalmente se evita hacer *queries* sobre `users` y se usa una colecciÃ³n extra (ej. `pairingCodes/{CODE}`) o Cloud Functions.

Si por ahora quieres mantener la bÃºsqueda por `pairingCode`, la forma mÃ¡s simple es permitir lectura/listado de `users` a usuarios autenticados.

## Reglas recomendadas (compatibles con la app actual)

Si vas a usar **botón de eliminar** en canciones y llamados, necesitas permitir `delete`.

Además, para que la lista de canciones funcione con tu modelo (emisor/receptor), es recomendable permitir lectura si:
- `senderId == uid` o `receiverId == uid` (nuevo), o
- `sharedBy == uid` o `participants` contiene `uid` (compatibilidad con documentos viejos).

Pega algo así en Firebase Console (ajusta si lo necesitas):

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    match /songs/{songId} {
      allow read: if request.auth != null && (
        resource.data.senderId == request.auth.uid ||
        resource.data.receiverId == request.auth.uid ||
        resource.data.sharedBy == request.auth.uid ||
        (resource.data.participants is list && resource.data.participants.hasAny([request.auth.uid]))
      );

      allow create: if request.auth != null
        && request.resource.data.senderId == request.auth.uid
        && request.resource.data.sharedBy == request.auth.uid;

      // Permite eliminar solo si soy emisor o receptor
      allow delete: if request.auth != null && (
        resource.data.senderId == request.auth.uid ||
        resource.data.receiverId == request.auth.uid
      );

      allow update: if false;
    }

    match /alerts/{alertId} {
      allow read: if request.auth != null
        && resource.data.receiverId == request.auth.uid;

      allow create: if request.auth != null
        && request.resource.data.senderId == request.auth.uid;

      // Marcar como leída
      allow update: if request.auth != null
        && resource.data.receiverId == request.auth.uid
        && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['read']);

      // Permite eliminar si soy receptor
      allow delete: if request.auth != null
        && resource.data.receiverId == request.auth.uid;
    }
  }
}
```
