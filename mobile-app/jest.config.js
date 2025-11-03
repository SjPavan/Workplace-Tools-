module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(?:react-native|@react-native|@expo|expo(nent)?|expo-.*|@supabase|@tanstack|zustand|@react-navigation)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  testPathIgnorePatterns: ['<rootDir>/e2e/']
};
