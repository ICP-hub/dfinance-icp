export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.mjs'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',  
  },
  moduleNameMapper: {
    '\\.css$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.mjs',
    '\\.mp3$': '<rootDir>/__mocks__/fileMock.mjs',
  },
  maxWorkers: 2,
  transformIgnorePatterns: [
    "/node_modules/(?!some-esm-package|other-esm-package)"  
  ],
};
