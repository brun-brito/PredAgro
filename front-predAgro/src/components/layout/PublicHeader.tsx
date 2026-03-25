import { Link, NavLink } from 'react-router-dom';
import styles from './PublicHeader.module.css';

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

export function PublicHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/" className={styles.brand}>
          <img className={styles.brandIcon} src="/favicon.svg" alt="" aria-hidden="true" />
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
