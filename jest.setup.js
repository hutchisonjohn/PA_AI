// Jest setup file
import '@testing-library/jest-native/extend-expect';

// Suppress console warnings in tests (optional)
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock React Native modules
jest.mock('@react-native-firebase/app', () => ({
  apps: [],
  utils: () => ({
    FilePath: {
      MAIN_BUNDLE: 'main_bundle',
      CACHES_DIRECTORY: 'caches_directory',
      DOCUMENT_DIRECTORY: 'document_directory',
    },
  }),
}));

jest.mock('@react-native-firebase/auth', () => ({
  __esModule: true,
  default: () => ({
    currentUser: null,
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
  }),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  __esModule: true,
  default: () => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
        update: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(),
      })),
    })),
  }),
}));

jest.mock('@react-native-voice/voice', () => ({
  __esModule: true,
  default: {
    start: jest.fn(),
    stop: jest.fn(),
    isAvailable: jest.fn(() => Promise.resolve(true)),
    removeAllListeners: jest.fn(),
  },
}));

