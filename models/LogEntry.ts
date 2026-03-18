export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogEntry = {
  id: string;
  timestamp: number;
  level: LogLevel;
  tag?: string;
  message: string;
  details?: string;
};

