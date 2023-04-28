import { CHAINS, TOKENS } from '.';
import { BridgeDefaults } from './types';

const error = (msg: string) => {
  console.error(`Wormhole Connect:\n${msg}`);
};

export const validateDefaults = (defaults: BridgeDefaults | undefined) => {
  if (!defaults) return;
  let validDefaults = defaults;
  if (defaults.fromNetwork) {
    const network = CHAINS[defaults.fromNetwork];
    if (!network) {
      error(
        `Invalid chain name "${defaults.fromNetwork}" specified for bridgeDefaults.fromNetwork`,
      );
      validDefaults.fromNetwork = undefined;
    }
  }
  if (defaults.toNetwork) {
    const network = CHAINS[defaults.toNetwork];
    if (!network) {
      error(
        `Invalid chain name "${defaults.toNetwork}" specified for bridgeDefaults.toNetwork`,
      );
      validDefaults.toNetwork = undefined;
    }
  }
  if (defaults.toNetwork && defaults.fromNetwork) {
    if (defaults.toNetwork === defaults.fromNetwork) {
      error(
        `Source and destination chain cannot be the same, check the bridgeDefaults configuration`,
      );
      validDefaults.toNetwork = undefined;
    }
  }
  if (defaults.token) {
    const token = TOKENS[defaults.token];
    if (!token) {
      error(
        `Invalid token "${defaults.token}" specified for bridgeDefaults.token`,
      );
      validDefaults.token = undefined;
    }
  }
  if (validDefaults.fromNetwork && validDefaults.token) {
    const network = CHAINS[validDefaults.fromNetwork]!;
    const token = TOKENS[validDefaults.token];
    if (!token.tokenId && token.nativeNetwork !== network.key) {
      error(
        `Invalid token "${validDefaults.token}" specified for bridgeDefaults.token. It does not exist on "${validDefaults.fromNetwork}"`,
      );
      validDefaults.token = undefined;
    }
  }
  return validDefaults;
};
