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
      receipt.state < TransferState.Attested ||
      'originTxs' in receipt === false ||
      receipt.originTxs.length === 0
    ) {
      return;
    }

    let isActive = true;

    const fetchRedeemTx = async () => {
      const wormholeApi = config.wormholeApi.replace(/\/$/, '');
      const { txid } = receipt.originTxs[receipt.originTxs.length - 1];
      while (isActive) {
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
      }
    };

    fetchRedeemTx();

    return () => {
      isActive = false;
    };
  }, [receipt]);
};

export default useFetchRedeemTx;
