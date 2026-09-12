import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../../src/app/App.tsx';

describe('application shell', () => {
  it('renders the home page with the three entry paths and no sign-in', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Explore how your body communicates',
    );
    expect(screen.getByRole('link', { name: 'Start with an experience' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Find a signal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore the body' })).toBeInTheDocument();
    expect(screen.queryByText(/sign in|log in|create account/i)).not.toBeInTheDocument();
  });

  it('offers a skip link and a primary navigation landmark', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument();
  });

  it('marks a non-production build as an unreviewed draft preview', () => {
    render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent(/Draft preview/);
  });
});
