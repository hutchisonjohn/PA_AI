/**
 * ErrorBoundary Test
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import ErrorBoundary from '../utils/ErrorBoundary';

// Component that throws an error
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return null;
};

describe('ErrorBoundary', () => {
  it('catches errors and displays fallback UI', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = jest.fn();

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();

    // Restore console.error
    console.error = originalError;
  });

  it('renders children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    // Should render without error UI
    expect(() => getByText('Something went wrong')).toThrow();
  });
});

