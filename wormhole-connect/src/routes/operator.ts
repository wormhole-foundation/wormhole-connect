import { TokenId } from 'sdklegacy';
import { TransferInfo } from 'utils/sdkv2';

import config from 'config';
import { TokenConfig, Route } from 'config/types';
import {
  TransferDisplayData,
  TransferInfoBaseParams,
  TransferDestInfo,
} from './types';
import { TokenPrices } from 'store/tokenPrices';

import {
  Chain,
  Network,
  routes,
  TransactionId,
} from '@wormhole-foundation/sdk';

import { getRoute } from './mappings';
import SDKv2Route from './sdkv2';
import { RelayerFee } from 'store/relay';

export interface TxInfo {
  route: Route;
  receipt: routes.Receipt;
}

export class Operator {
  getRoute(route: Route): SDKv2Route {
    return getRoute(route);
  }

  async resumeFromTx(tx: TransactionId): Promise<TxInfo | null> {
    // This function identifies which route a transaction corresponds using brute force.
    // It tries to call resume() on every manual route until one of them succeeds.
    //
    // This was just the simpler approach. In the future we can possibly optimize this by
    // trying some tricks to identify which route the transaction is for, but this would
    // come at the cost of added code, complexity, and potential bugs.
    //
    // That trade-off might not be worth it though

    return new Promise((resolve, reject) => {
      // This promise runs resumeIfManual on each route in parallel and resolves as soon
      // as it finds a receipt from any of the available routes. This is different from just using
      // Promise.race, because we only want to resolve under specific conditions.
      //
      // The assumption is that at most one route will produce a receipt.
      const totalAttemptsToMake = config.routes.length;
      let failedAttempts = 0;

      for (const route of config.routes) {
        const r = this.getRoute(route as Route);

        r.resumeIfManual(tx)
          .then((receipt) => {
            if (receipt !== null) {
              resolve({ route: route as Route, receipt });
            } else {
              failedAttempts += 1;
            }
          })
          .catch((e) => {
            failedAttempts += 1;
            // Possible reasons for error here:
            //
            // - Given transaction does not correspond to this route.
            //   We expect this case to happen because it's how we narrow down
            //   which route this transaction corresponds to. It's not a problem.
            //
            // - Otherwise, perhaps this is corresponding route but some other error
            //   happened when fetching the metadata required to construct a receipt.
            //
            // We handle both of these the same way for now - by continuing.
            //
            // If we add logic to identify the route in a different way in the future,
            // we can possibly handle these two error cases differently.
            //
            // If we reach the end of the for-loop without a successful result from resume()
            // then we tell the user that the transaction can't be resumed.
          })
          .finally(() => {
            // If we failed to get a receipt from all routes, resolve to null
            if (failedAttempts === totalAttemptsToMake) {
              resolve(null);
            }
          });
      }
    });
  }

  async isRouteSupported(
    route: Route,
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: Chain,
    destChain: Chain,
  ): Promise<boolean> {
    try {
      if (!config.routes.includes(route)) {
        return false;
      }

      const r = this.getRoute(route);
      return await r.isRouteSupported(
        sourceToken,
        destToken,
        amount,
        sourceChain,
        destChain,
      );
    } catch (e) {
      // TODO is this the right place to try/catch these?
      // or deeper inside SDKv2Route?
      return false;
    }
  }
  async isRouteAvailable(
    route: Route,
    sourceToken: string,
    destToken: string,
    amount: string,
    sourceChain: Chain,
    destChain: Chain,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<boolean> {
    if (!config.routes.includes(route)) {
      return false;
    }

    const r = this.getRoute(route);
    return await r.isRouteAvailable(
      sourceToken,
      destToken,
      amount,
      sourceChain,
      destChain,
      options,
    );
  }

  allSupportedChains(): Chain[] {
    const supported = new Set<Chain>();
    for (const key in config.chains) {
      const chain = key as Chain;
      for (const route of config.routes) {
        if (!supported.has(chain)) {
          const isSupported = this.isSupportedChain(route as Route, chain);
          if (isSupported) {
            supported.add(chain);
          }
        }
      }
    }
    return Array.from(supported);
  }

  async allSupportedSourceTokens(
    destToken: TokenConfig | undefined,
    sourceChain?: Chain,
    destChain?: Chain,
  ): Promise<TokenConfig[]> {
    const supported: { [key: string]: TokenConfig } = {};
    for (const route of config.routes) {
      const r = this.getRoute(route as Route);

      try {
        const sourceTokens = await r.supportedSourceTokens(
          config.tokensArr,
          destToken,
          sourceChain,
          destChain,
        );

        for (const token of sourceTokens) {
          supported[token.key] = token;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return Object.values(supported);
  }

  async allSupportedDestTokens(
    sourceToken: TokenConfig | undefined,
    sourceChain?: Chain,
    destChain?: Chain,
  ): Promise<TokenConfig[]> {
    const supported: { [key: string]: TokenConfig } = {};
    for (const route of config.routes) {
      const r = this.getRoute(route as Route);

      try {
        const destTokens = await r.supportedDestTokens(
          config.tokensArr,
          sourceToken,
          sourceChain,
          destChain,
        );

        for (const token of destTokens) {
          supported[token.key] = token;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return Object.values(supported);
  }

  isSupportedChain(route: Route, chain: Chain): boolean {
    const r = this.getRoute(route);
    return r.isSupportedChain(chain);
  }

  async computeReceiveAmount(
    route: Route,
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: Chain,
    recipientChain: Chain,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<number> {
    const r = this.getRoute(route);
    return await r.computeReceiveAmount(
      sendAmount,
      token,
      destToken,
      sendingChain,
      recipientChain,
      options,
    );
  }

  async computeReceiveAmountWithFees(
    route: Route,
    sendAmount: number,
    token: string,
    destToken: string,
    sendingChain: Chain | undefined,
    recipientChain: Chain | undefined,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<number> {
    const r = this.getRoute(route);
    return await r.computeReceiveAmountWithFees(
      sendAmount,
      token,
      destToken,
      sendingChain,
      recipientChain,
      options,
    );
  }

  async validate(
    route: Route,
    token: TokenId | 'native',
    amount: string,
    sendingChain: Chain,
    senderAddress: string,
    recipientChain: Chain,
    recipientAddress: string,
    options: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<boolean> {
    const r = this.getRoute(route);
    return await r.validate(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      options,
    );
  }

  async send(
    route: Route,
    token: TokenConfig,
    amount: string,
    sendingChain: Chain,
    senderAddress: string,
    recipientChain: Chain,
    recipientAddress: string,
    destToken: string,
    options?: routes.AutomaticTokenBridgeRoute.Options,
  ): Promise<[routes.Route<Network>, routes.Receipt]> {
    const r = this.getRoute(route);
    return await r.send(
      token,
      amount,
      sendingChain,
      senderAddress,
      recipientChain,
      recipientAddress,
      destToken,
      options,
    );
  }

  async getPreview(
    route: Route,
    token: TokenConfig,
    destToken: TokenConfig,
    amount: number,
    sendingChain: Chain,
    recipientChain: Chain,
    sendingGasEst: string,
    claimingGasEst: string,
    receiveAmount: string,
    tokenPrices: TokenPrices,
    relayerFee?: RelayerFee,
    receiveNativeAmt?: number,
  ): Promise<TransferDisplayData> {
    const r = this.getRoute(route);
    return await r.getPreview(
      token,
      destToken,
      amount,
      sendingChain,
      recipientChain,
      sendingGasEst,
      claimingGasEst,
      receiveAmount,
      tokenPrices,
      relayerFee,
      receiveNativeAmt,
    );
  }

  async getForeignAsset(
    route: Route,
    tokenId: TokenId,
    chain: Chain,
    destToken?: TokenConfig,
  ): Promise<string | null> {
    const r = this.getRoute(route);
    return r.getForeignAsset(tokenId, chain, destToken);
  }

  getTransferSourceInfo<T extends TransferInfoBaseParams>(
    route: Route,
    params: T,
  ): Promise<TransferDisplayData> {
    const r = this.getRoute(route);
    return r.getTransferSourceInfo(params);
  }

  getTransferDestInfo<T extends TransferInfoBaseParams>(
    route: Route,
    params: T,
  ): Promise<TransferDestInfo> {
    const r = this.getRoute(route);
    return r.getTransferDestInfo(params);
  }

  tryFetchRedeemTx(
    route: Route,
    txData: TransferInfo,
  ): Promise<string | undefined> {
    const r = this.getRoute(route);
    return r.tryFetchRedeemTx(txData);
  }
}

const RouteOperator = new Operator();
export default RouteOperator;
