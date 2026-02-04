import { Link, NavLink } from 'react-router-dom';
import { FaChartLine } from 'react-icons/fa6';
import styles from './PublicHeader.module.css';

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

export function PublicHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <span className={styles.brandIcon}>
            <FaChartLine />
          </span>
          <span>PredAgro</span>
        </Link>

        <nav className={styles.nav}>
          <NavLink to="/" className={linkClassName} end>
            Plataforma
          </NavLink>
          <NavLink to="/entrar" className={linkClassName}>
            Entrar
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
