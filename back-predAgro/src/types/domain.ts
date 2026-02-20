export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgriculturalProfile {
  userId: string;
  farmName: string;
  city: string;
  state: string;
  cropTypes: string[];
  areaHectares: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClimateRecord {
  id: string;
  userId: string;
  region: string;
  temperatureCelsius: number;
  rainMillimeters: number;
  humidity: number;
  windSpeedKmh: number;
  collectedAt: string;
  createdAt: string;
}

export interface ClimateSnapshot {
  region: string;
  temperatureCelsius: number;
  rainMillimeters: number;
  humidity: number;
  windSpeedKmh: number;
  collectedAt: string;
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
  climate: {
    region: string;
    temperatureCelsius: number;
    rainMillimeters: number;
    humidity: number;
    windSpeedKmh: number;
    updatedAt: string;
  };
  prediction: PredictionSummary;
  alerts: AlertItem[];
  modules: DashboardModules;
}
