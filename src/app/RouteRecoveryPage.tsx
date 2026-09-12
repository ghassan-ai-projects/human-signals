import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { recordDiagnostic } from '../platform/diagnostics.ts';

/**
 * Document 02: an unknown address shows a recovery page and never a similarly named
 * substitute. Nothing from the address is rendered back into the page.
 */
export function RouteRecoveryPage(): React.JSX.Element {
  const location = useLocation();

  useEffect(() => {
    recordDiagnostic('ROUTE_UNKNOWN', 'unknown');
  }, [location.pathname]);

  return (
    <main id="main" tabIndex={-1}>
      <h1>That address is not part of Human Signals</h1>
      <p>
        The link may be mistyped, or it may point at content that has been withdrawn. Human Signals
        never opens a similarly named lesson in its place.
      </p>
      <ul>
        <li>
          <Link to="/">Go to the home page</Link>
        </li>
        <li>
          <Link to="/about">Read about the project and its sources</Link>
        </li>
      </ul>
    </main>
  );
}
