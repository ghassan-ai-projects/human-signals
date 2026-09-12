import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { HomePage } from '../features/home/HomePage.tsx';
import { AboutPage } from '../features/about/AboutPage.tsx';
import { RouteRecoveryPage } from './RouteRecoveryPage.tsx';

/**
 * Hash routing keeps every deep link working on a plain static host without server rewrites
 * (documents 05 and 13). Routes are added by their work package; unknown routes recover.
 */
export function App(): React.JSX.Element {
  return (
    <ErrorBoundary scope="shell" code="ENGINE_INVALID_STATE">
      <HashRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/index.html" element={<Navigate to="/" replace />} />
            <Route path="*" element={<RouteRecoveryPage />} />
          </Routes>
        </AppShell>
      </HashRouter>
    </ErrorBoundary>
  );
}
