/**
 * Basic App Component Test
 * More tests should be added as features are implemented
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock navigation
jest.mock('@react-navigation/native', () => {
  const actualNav = jest.requireActual('@react-navigation/native');
  return {
    ...actualNav,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
    }),
    NavigationContainer: ({ children }) => children,
  };
});

// Mock Firebase
jest.mock('../config/firebase', () => ({
  auth: null,
  firestore: null,
  storage: null,
  analytics: null,
  messaging: null,
}));

describe('App Component', () => {
  it('renders without crashing', () => {
    const { getByTestId } = render(<App />);
    // Add more assertions as needed
    expect(getByTestId).toBeDefined();
  });
});

