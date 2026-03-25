import { useEffect, useMemo, useRef, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa6';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import styles from './AppHeader.module.css';

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? `${styles.navLink} ${styles.active}` : styles.navLink;

function getUserInitials(name: string | undefined, email: string | undefined) {
  const base = name?.trim() || email?.trim() || 'U';
  const words = base.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export function AppHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const initials = useMemo(
    () => getUserInitials(user?.name, user?.email),
    [user?.email, user?.name]
  );

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  function handleSignOut() {
    signOut();
    setIsMenuOpen(false);
    navigate('/entrar', { replace: true });
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link to="/painel" className={styles.brand}>
          <img className={styles.brandIcon} src="/favicon.svg" alt="" aria-hidden="true" />
          <span>PredAgro</span>
        </Link>

        {isAuthenticated && user ? (
          <div className={styles.accountMenu} ref={menuRef}>
            <button
              type="button"
              className={styles.accountButton}
              onClick={() => setIsMenuOpen((current) => !current)}
              aria-haspopup="menu"
              aria-expanded={isMenuOpen}
            >
              <span className={styles.userAvatar}>{initials}</span>
              <span className={styles.userMeta}>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </span>
              <FaChevronDown className={isMenuOpen ? styles.menuChevronOpen : styles.menuChevron} />
            </button>

            {isMenuOpen && (
              <div className={styles.dropdown} role="menu">
                <Link to="/conta" className={styles.menuItem} role="menuitem">
                  Minha conta
                </Link>
                <button type="button" className={styles.menuItem} onClick={handleSignOut} role="menuitem">
                  Sair
                </button>
              </div>
            )}
          </div>
        ) : (
          <nav className={styles.nav}>
            <NavLink to="/" className={linkClassName} end>
              Plataforma
            </NavLink>
            <NavLink to="/entrar" className={linkClassName}>
              Entrar
            </NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}
