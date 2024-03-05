import axios from 'axios';
import { isMainnet } from 'config';
import { Route } from 'config/types';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { setRedeemTx, setDeliveryStatus } from 'store/redeem';
import { sleep } from 'utils';
import { isEvmChain } from 'utils/sdk';
import { getEmitterAndSequence } from 'utils/vaa';

const BASE_URL = `https://api.${
  isMainnet ? '' : 'testnet.'
}wormholescan.io/api/v1/relays`;

const RETRY_DELAY = 15_000;

// Polls for standard relayer delivery status
const useDeliveryStatus = (): void => {
  const dispatch = useDispatch();
  const route = useSelector((state: RootState) => state.redeem.route);
  const signedMessage = useSelector(
    (state: RootState) => state.redeem.signedMessage,
  );
  useEffect(() => {
    if (
      !signedMessage ||
      route !== Route.NttRelay ||
      !isEvmChain(signedMessage.toChain) // Currently, only EVM chains support standard relayer
    )
      return;
    const { emitterChain, emitterAddress, sequence } =
      getEmitterAndSequence(signedMessage);
    let active = true;
    const fetchData = async () => {
      while (active) {
        try {
          // TODO: the response data should be typed
          const response = await axios.get(
            `${BASE_URL}/${emitterChain}/${emitterAddress}/${sequence}`,
          );
          if (active) {
            const { delivery, toTxHash } = response.data?.data || {};
            if (delivery?.execution) {
              dispatch(setDeliveryStatus(delivery.execution.status));
            }
            if (toTxHash) {
              dispatch(setRedeemTx(toTxHash));
            }
            break;
          }
        } catch (e) {
          if (axios.isAxiosError(e)) {
            if (e.status !== 404) console.error(e);
          } else {
            console.error(e);
          }
        }
        if (active) {
          await sleep(RETRY_DELAY);
        }
      }
    };
    fetchData();
    return () => {
      active = false;
    };
  }, [signedMessage, route]);
};

export default useDeliveryStatus;
