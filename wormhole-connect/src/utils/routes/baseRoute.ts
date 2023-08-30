import { TokenConfig } from 'config/types';
import { getWrappedToken } from 'utils';
import RouteAbstract from './routeAbstract';

export abstract class BaseRoute extends RouteAbstract {
  async isSupportedSourceToken(
    token: TokenConfig | undefined,
    destToken: TokenConfig | undefined,
  ): Promise<boolean> {
    if (!token) return false;
    if (destToken) {
      const wrapped = getWrappedToken(token);
      return wrapped.key === destToken.key;
    }
    return true;
  }

  async isSupportedDestToken(
    token: TokenConfig | undefined,
    sourceToken: TokenConfig | undefined,
  ): Promise<boolean> {
    if (!token) return false;
    if (!token.tokenId) return false;
    if (sourceToken) {
      const wrapped = getWrappedToken(sourceToken);
      return wrapped.key === token.key;
    }
    return true;
  }

  async supportedSourceTokens(
    tokens: TokenConfig[],
    destToken?: TokenConfig,
  ): Promise<TokenConfig[]> {
    if (!destToken) return tokens;
    const shouldAdd = await Promise.allSettled(
      tokens.map((token) => this.isSupportedSourceToken(token, destToken)),
    );
    return tokens.filter((_token, i) => {
      const res = shouldAdd[i];
      return res.status === 'fulfilled' && res.value;
    });
  }

  async supportedDestTokens(
    tokens: TokenConfig[],
    sourceToken?: TokenConfig,
  ): Promise<TokenConfig[]> {
    if (!sourceToken) return tokens;
    const shouldAdd = await Promise.allSettled(
      tokens.map((token) => this.isSupportedDestToken(token, sourceToken)),
    );
    return tokens.filter((_token, i) => {
      const res = shouldAdd[i];
      return res.status === 'fulfilled' && res.value;
    });
  }
}
