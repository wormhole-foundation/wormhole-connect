import { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setRedeemTx } from 'store/redeem';
import { RouteContext } from 'contexts/RouteContext';
import { sleep } from 'utils';
import {
  api,
  toChain,
  TransferState,
  UniversalAddress,
} from '@wormhole-foundation/sdk';
import config from 'config';

// TODO: this hook is a stop-gap until the SDK reliably
// sets the redeem tx hash on the receipt
const useFetchRedeemTx = (): void => {
  const dispatch = useDispatch();
  const { receipt } = useContext(RouteContext);

  useEffect(() => {
    if (
      !receipt ||
      receipt.state < TransferState.DestinationInitiated ||
      'originTxs' in receipt === false ||
      receipt.originTxs.length === 0
    ) {
      return;
    }

    let isActive = true;

    const fetchRedeemTx = async () => {
      // TODO: remove once this is published: https://github.com/wormhole-foundation/wormhole-sdk-ts/pull/661
      const wormholeApi = config.wormholeApi.replace(/\/$/, '');

      const { txid } = receipt.originTxs[receipt.originTxs.length - 1];
      let retry = 0;
      while (isActive && retry < 10) {
        try {
          const vaa = await api.getVaaByTxHash(wormholeApi, txid);
          if (vaa) {
            const status = await api.getTransactionStatus(wormholeApi, {
              chain: toChain(vaa.emitterChain),
              emitter: new UniversalAddress(vaa.emitterAddr),
              sequence: BigInt(vaa.sequence),
            });
            const redeemTx = status?.globalTx?.destinationTx?.txHash;
            if (redeemTx) {
              if (isActive) {
                dispatch(setRedeemTx(redeemTx));
              }
              break;
            }
          }
        } catch (e) {
          console.warn(e);
        }
        await sleep(10_000);
        retry++;
      }
    };

    fetchRedeemTx();

    return () => {
      isActive = false;
    };
  }, [receipt]);
};

export default useFetchRedeemTx;
