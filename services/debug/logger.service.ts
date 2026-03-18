import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LogEntry, LogLevel } from '@/models/LogEntry';

const STORAGE_KEY = 'debug.logs.v1';
const MAX_IN_MEMORY = 500;
const MAX_PERSISTED = 1000;

const isDev =
  // React Native / Expo
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  typeof (global as any)?.__DEV__ === 'boolean' ?
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).__DEV__ :
    // Fallback (web/node-like)
    (typeof process !== 'undefined' ? process.env?.NODE_ENV !== 'production' : true);

const SENSITIVE_KEYS = new Set([
  'password',
  'pass',
  'passwd',
  'secret',
  'token',
  'accessToken',
  'refreshToken',
  'idToken',
  'apiKey',
  'authorization',
  'auth',
  'partnerCode',
  'code',
]);

const redactInString = (input: string) => {
  let out = input;
  // Authorization / Bearer tokens
  out = out.replace(/(Authorization\s*:\s*)Bearer\s+[^\s]+/gi, '$1Bearer [REDACTED]');
  out = out.replace(/\bBearer\s+[A-Za-z0-9\-\._~\+\/]+=*\b/g, 'Bearer [REDACTED]');

  // Common key=value patterns
  out = out.replace(/(\bpassword\b\s*[:=]\s*)([^\s]+)/gi, '$1[REDACTED]');
  out = out.replace(/(\btoken\b\s*[:=]\s*)([^\s]+)/gi, '$1[REDACTED]');
  out = out.replace(/(\bapiKey\b\s*[:=]\s*)([^\s]+)/gi, '$1[REDACTED]');
  out = out.replace(/(\bsecret\b\s*[:=]\s*)([^\s]+)/gi, '$1[REDACTED]');

  // JSON-ish patterns: "password":"..."
  out = out.replace(/(\"password\"\s*:\s*\")([^\"]+)(\")/gi, '$1[REDACTED]$3');
  out = out.replace(/(\"token\"\s*:\s*\")([^\"]+)(\")/gi, '$1[REDACTED]$3');

  // App-specific phrases
  out = out.replace(/(Linking with code:\s*)(.+)$/i, '$1[REDACTED]');
  out = out.replace(/(Login:\s*)(.+)$/i, '$1[REDACTED]');
  out = out.replace(/(Register:\s*)(.+)$/i, '$1[REDACTED]');

  return out;
};

const redactUnknown = (value: unknown, depth = 0): unknown => {
  if (depth > 3) return value;
  if (typeof value === 'string') return redactInString(value);
  if (value instanceof Error) return value;
  if (Array.isArray(value)) return value.map((v) => redactUnknown(v, depth + 1));
  if (value && typeof value === 'object') {
    const asRecord = value as Record<string, unknown>;
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(asRecord)) {
      if (SENSITIVE_KEYS.has(k)) next[k] = '[REDACTED]';
      else next[k] = redactUnknown(v, depth + 1);
    }
    return next;
  }
  return value;
};

const redactArgs = (args: unknown[]) => args.map((a) => redactUnknown(a));

const safeStringify = (value: unknown) => {
  try {
    if (typeof value === 'string') return value;
    if (value instanceof Error) return value.stack || value.message;
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const formatArgs = (args: unknown[]) => args.map(safeStringify).join(' ');

const toDetails = (args: unknown[]) => {
  try {
    const nonString = args.filter((a) => typeof a !== 'string');
    if (nonString.length === 0) return undefined;
    return nonString.map(safeStringify).join('\n');
  } catch {
    return undefined;
  }
};

const now = () => Date.now();

const makeId = () => `${now()}-${Math.random().toString(16).slice(2)}`;

class LoggerService {
  private buffer: LogEntry[] = [];
  private flushing = false;
  private installed = false;

  install() {
    if (this.installed) return;
    this.installed = true;

    this.restore().catch(() => {});
    this.patchConsole();
    this.installGlobalErrorHandlers();
  }

  debug(message: string, details?: string, tag?: string) {
    this.add('debug', message, details, tag);
  }
  info(message: string, details?: string, tag?: string) {
    this.add('info', message, details, tag);
  }
  warn(message: string, details?: string, tag?: string) {
    this.add('warn', message, details, tag);
  }
  error(message: string, details?: string, tag?: string) {
    this.add('error', message, details, tag);
  }

  async getLogs() {
    return [...this.buffer].sort((a, b) => b.timestamp - a.timestamp);
  }

  async clear() {
    this.buffer = [];
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private add(level: LogLevel, message: string, details?: string, tag?: string) {
    const entry: LogEntry = {
      id: makeId(),
      timestamp: now(),
      level,
      tag,
      message,
      details,
    };

    this.buffer.unshift(entry);
    if (this.buffer.length > MAX_IN_MEMORY) this.buffer.length = MAX_IN_MEMORY;

    this.flushSoon();
  }

  private flushSoon() {
    if (this.flushing) return;
    this.flushing = true;
    setTimeout(() => {
      this.flush().finally(() => {
        this.flushing = false;
      });
    }, 50);
  }

  private async flush() {
    try {
      const persisted = await this.readPersisted();
      const next = [...this.buffer].slice(0, MAX_PERSISTED);
      // Keep the newest entries overall (buffer already has newest at start)
      const merged = [...next, ...persisted].slice(0, MAX_PERSISTED);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // ignore
    }
  }

  private async readPersisted(): Promise<LogEntry[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LogEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private async restore() {
    const persisted = await this.readPersisted();
    if (persisted.length === 0) return;
    // Merge persisted into current buffer (keeping newest)
    const merged = [...this.buffer, ...persisted].slice(0, MAX_IN_MEMORY);
    this.buffer = merged.sort((a, b) => b.timestamp - a.timestamp).slice(0, MAX_IN_MEMORY);
  }

  private patchConsole() {
    const original = {
      log: console.log,
      info: console.info,
      warn: console.warn,
      error: console.error,
    };

    console.log = (...args: unknown[]) => {
      const redactedArgs = redactArgs(args);
      this.info(formatArgs(redactedArgs), toDetails(redactedArgs), 'console.log');
      original.log(...args);
    };
    console.info = (...args: unknown[]) => {
      const redactedArgs = redactArgs(args);
      this.info(formatArgs(redactedArgs), toDetails(redactedArgs), 'console.info');
      original.info(...args);
    };
    console.warn = (...args: unknown[]) => {
      const redactedArgs = redactArgs(args);
      const maybeStack = isDev ? new Error().stack : undefined;
      const detailsParts = [toDetails(redactedArgs), maybeStack].filter(Boolean) as string[];
      this.warn(formatArgs(redactedArgs), detailsParts.length ? detailsParts.join('\n') : undefined, 'console.warn');
      original.warn(...args);
    };
    console.error = (...args: unknown[]) => {
      const redactedArgs = redactArgs(args);
      const maybeStack = isDev ? new Error().stack : undefined;
      const detailsParts = [toDetails(redactedArgs), maybeStack].filter(Boolean) as string[];
      this.error(formatArgs(redactedArgs), detailsParts.length ? detailsParts.join('\n') : undefined, 'console.error');
      original.error(...args);
    };
  }

  private installGlobalErrorHandlers() {
    // React Native global handler (fatal JS errors)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ErrorUtilsAny = (global as any)?.ErrorUtils as
      | { getGlobalHandler?: () => (err: unknown, isFatal?: boolean) => void; setGlobalHandler?: (fn: (err: unknown, isFatal?: boolean) => void) => void }
      | undefined;

    if (ErrorUtilsAny?.setGlobalHandler) {
      const previous = ErrorUtilsAny.getGlobalHandler?.();
      ErrorUtilsAny.setGlobalHandler((err, isFatal) => {
        const details =
          err instanceof Error ? err.stack || err.message : safeStringify(err);
        this.error(
          isFatal ? 'Fatal JS error' : 'Unhandled JS error',
          details,
          'ErrorUtils',
        );
        previous?.(err, isFatal);
      });
    }

    // Unhandled promise rejections (where supported)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processAny = (global as any)?.process;
    try {
      processAny?.on?.('unhandledRejection', (reason: unknown) => {
        const details =
          reason instanceof Error ? reason.stack || reason.message : safeStringify(reason);
        this.error('Unhandled promise rejection', details, 'process');
      });
    } catch {
      // ignore
    }

    // Web (Expo Router static render / browser)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const windowAny = (global as any)?.window;
    try {
      windowAny?.addEventListener?.('error', (event: unknown) => {
        this.error('Window error event', safeStringify(event), 'window');
      });
      windowAny?.addEventListener?.('unhandledrejection', (event: unknown) => {
        this.error('Window unhandledrejection', safeStringify(event), 'window');
      });
    } catch {
      // ignore
    }
  }
}

export const loggerService = new LoggerService();
