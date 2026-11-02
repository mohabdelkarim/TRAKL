// Jest setup file for React Native testing
jest.mock('expo-notifications', () => ({
  getLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  removeNotificationSubscription: jest.fn(),
}));

jest.mock('expo-updates', () => ({
  reloadAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

const mockFsStore = new Map();
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file:///mock-docs/',
  EncodingType: { UTF8: 'utf8', Base64: 'base64' },
  writeAsStringAsync: jest.fn(async (uri, contents) => {
    mockFsStore.set(uri, contents);
  }),
  readAsStringAsync: jest.fn(async (uri) => {
    if (!mockFsStore.has(uri)) throw new Error('file not found');
    return mockFsStore.get(uri);
  }),
  getInfoAsync: jest.fn(async (uri) => ({ exists: mockFsStore.has(uri), isDirectory: false })),
  deleteAsync: jest.fn(async (uri) => {
    mockFsStore.delete(uri);
  }),
  copyAsync: jest.fn(async () => undefined),
}));

jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock-docs/',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));
