import { FaCloudRain, FaDroplet, FaTemperatureHalf, FaWind } from 'react-icons/fa6';
import type { ClimateSnapshot } from '../../types/domain';
import { formatDateTime, formatNumber } from '../../utils/formatters';
import styles from './ClimateOverview.module.css';

interface ClimateOverviewProps {
  climate: ClimateSnapshot;
  isLoading: boolean;
}

export function ClimateOverview({ climate, isLoading }: ClimateOverviewProps) {
  const metrics = [
    {
      label: 'Temperatura',
      value: `${formatNumber(climate.temperatureCelsius)} C`,
      icon: FaTemperatureHalf,
    },
    {
      label: 'Chuva acumulada',
      value: `${formatNumber(climate.rainMillimeters)} mm`,
      icon: FaCloudRain,
    },
    {
      label: 'Umidade',
      value: `${formatNumber(climate.humidity, 0)}%`,
      icon: FaDroplet,
    },
    {
      label: 'Vento',
      value: `${formatNumber(climate.windSpeedKmh)} km/h`,
      icon: FaWind,
    },
  ];

  return (
    <article className={styles.card}>
      <header>
        <h2>Visão climática</h2>
        <p>{climate.region}</p>
      </header>

      <div className={styles.metricGrid}>
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <div key={metric.label} className={styles.metricItem}>
              <span className={styles.metricIcon}>
                <Icon />
              </span>
              <div>
                <p>{metric.label}</p>
                <strong>{isLoading ? 'Carregando...' : metric.value}</strong>
              </div>
            </div>
          );
        })}
      </div>

      <footer>Última atualização: {formatDateTime(climate.updatedAt)}</footer>
    </article>
  );
}
