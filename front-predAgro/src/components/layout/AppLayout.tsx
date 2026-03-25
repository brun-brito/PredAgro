import { Outlet } from 'react-router-dom';
import { AppHeader } from './AppHeader';

export function AppLayout() {
  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  );
}
