import { randomUUID } from 'node:crypto';
import type { AlertItem, AlertSeverity } from '../types/domain';

export function createAlert(title: string, description: string, severity: AlertSeverity): AlertItem {
  return {
    id: randomUUID(),
    title,
    description,
    severity,
    createdAt: new Date().toISOString(),
  };
}
