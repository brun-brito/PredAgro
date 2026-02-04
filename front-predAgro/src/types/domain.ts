export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface RegisterPayload extends AuthCredentials {
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ClimateSnapshot {
  region: string;
  temperatureCelsius: number;
  rainMillimeters: number;
  humidity: number;
  windSpeedKmh: number;
  updatedAt: string;
}

export interface PredictionSummary {
  crop: string;
  expectedYieldBagsPerHectare: number;
  confidence: number;
  nextHarvestWindow: string;
}

export type AlertSeverity = 'low' | 'medium' | 'high';

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  createdAt: string;
}

export interface DashboardModules {
  charts: string;
  tables: string;
  reports: string;
}

export interface DashboardOverview {
  climate: ClimateSnapshot;
  prediction: PredictionSummary;
  alerts: AlertItem[];
  modules: DashboardModules;
}
