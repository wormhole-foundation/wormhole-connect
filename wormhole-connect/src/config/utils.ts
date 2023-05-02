import { CHAINS, TOKENS } from '.';
import { BridgeDefaults } from './types';

const error = (msg: string) => {
  console.error(`Wormhole Connect:\n${msg}`);
};

export const validateDefaults = (defaults: BridgeDefaults | undefined) => {
  if (!defaults) return;
  const { fromNetwork, toNetwork, token, requiredNetwork } = defaults;
  let validDefaults = defaults;
  if (fromNetwork) {
    const network = CHAINS[fromNetwork];
    if (!network) {
      error(
        `Invalid chain name "${fromNetwork}" specified for bridgeDefaults.fromNetwork`,
      );
      validDefaults.fromNetwork = undefined;
    }
  }
  if (toNetwork) {
    const network = CHAINS[toNetwork];
    if (!network) {
      error(
        `Invalid chain name "${toNetwork}" specified for bridgeDefaults.toNetwork`,
      );
      validDefaults.toNetwork = undefined;
    }
  }
  if (toNetwork && fromNetwork) {
    if (toNetwork === fromNetwork) {
      error(
        `Source and destination chain cannot be the same, check the bridgeDefaults configuration`,
      );
      validDefaults.toNetwork = undefined;
    }
  }
  if (toNetwork && fromNetwork && requiredNetwork) {
    const requiredConfig = CHAINS[requiredNetwork];
    if (!requiredConfig) {
      error(
        `Invalid network value "${requiredNetwork}" specified for bridgeDefaults.requiredNetwork`,
      );
      validDefaults.requiredNetwork = undefined;
    }
    if (toNetwork !== requiredNetwork && fromNetwork !== requiredNetwork) {
      error(
        `Source chain or destination chain must equal the required network`,
      );
      validDefaults.requiredNetwork = undefined;
    }
  }
  if (token) {
    const tokenConfig = TOKENS[token];
    if (!tokenConfig) {
      error(`Invalid token "${token}" specified for bridgeDefaults.token`);
      validDefaults.token = undefined;
    }
  }
  if (validDefaults.fromNetwork && validDefaults.token) {
    const network = CHAINS[validDefaults.fromNetwork]!;
    const { tokenId, nativeNetwork } = TOKENS[validDefaults.token]!;
    if (!tokenId && nativeNetwork !== network.key) {
      error(
        `Invalid token "${validDefaults.token}" specified for bridgeDefaults.token. It does not exist on "${validDefaults.fromNetwork}"`,
      );
      validDefaults.token = undefined;
    }
  }
  return validDefaults;
};
