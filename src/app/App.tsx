import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { ContentProvider } from './ContentProvider.tsx';
import { PreferencesProvider } from './PreferencesProvider.tsx';
import { RequireContent } from './RequireContent.tsx';
import { AnnouncerProvider } from '../components/Announcer.tsx';
import { HomePage } from '../features/home/HomePage.tsx';
import { AboutPage } from '../features/about/AboutPage.tsx';
import { ExplorePage } from '../features/explore/ExplorePage.tsx';
import { TimelinePage } from '../features/lesson/TimelinePage.tsx';
import { StatesPage } from '../features/states/StatesPage.tsx';
import { LearnPage } from '../features/learn/LearnPage.tsx';
import { RouteRecoveryPage } from './RouteRecoveryPage.tsx';

/**
 * Hash routing keeps every deep link working on a plain static host without server rewrites
 * (documents 05 and 13). Content loads once per session; a content failure keeps the shell,
 * navigation and About available.
 */
export function App(): React.JSX.Element {
  return (
    <ErrorBoundary scope="shell" code="ENGINE_INVALID_STATE">
      <PreferencesProvider>
        <AnnouncerProvider>
          <HashRouter>
            <ContentProvider>
              <AppShell>
                <ErrorBoundary scope="content" code="CONTENT_SCHEMA">
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route
                      path="/explore"
                      element={
                        <RequireContent>
                          <ExplorePage />
                        </RequireContent>
                      }
                    />
                    <Route
                      path="/states"
                      element={
                        <RequireContent>
                          <StatesPage />
                        </RequireContent>
                      }
                    />
                    <Route
                      path="/learn"
                      element={
                        <RequireContent>
                          <LearnPage />
                        </RequireContent>
                      }
                    />
                    <Route
                      path="/journey/:id"
                      element={
                        <RequireContent>
                          <TimelinePage kind="journey" />
                        </RequireContent>
                      }
                    />
                    <Route
                      path="/state/:id"
                      element={
                        <RequireContent>
                          <TimelinePage kind="state" />
                        </RequireContent>
                      }
                    />
                    <Route
                      path="/exercise/:id"
                      element={
                        <RequireContent>
                          <TimelinePage kind="exercise" />
                        </RequireContent>
                      }
                    />
                    <Route path="/index.html" element={<Navigate to="/" replace />} />
                    <Route path="*" element={<RouteRecoveryPage />} />
                  </Routes>
                </ErrorBoundary>
              </AppShell>
            </ContentProvider>
          </HashRouter>
        </AnnouncerProvider>
      </PreferencesProvider>
    </ErrorBoundary>
  );
}
