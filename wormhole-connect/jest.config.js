module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '^@certusone/wormhole-sdk/lib/esm': '@certusone/wormhole-sdk/lib/cjs',
  },
};
