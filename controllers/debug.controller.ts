import { loggerService } from '@/services/debug/logger.service';

let installed = false;

export function installDebugging() {
  if (installed) return;
  installed = true;
  loggerService.install();
  loggerService.info('Debugging installed', undefined, 'debug.controller');
}

export async function getDebugLogs() {
  return loggerService.getLogs();
}

export async function clearDebugLogs() {
  return loggerService.clear();
}

