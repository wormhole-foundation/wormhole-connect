import axios from 'axios';
import { isMainnet } from 'config';
import { Route } from 'config/types';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { setRedeemTx, setDeliveryStatus } from 'store/redeem';
import { sleep } from 'utils';
import { getEmitterAndSequence } from 'utils/vaa';

const BASE_URL = `https://api.${
  isMainnet ? '' : 'testnet.'
}wormholescan.io/api/v1/relays`;

const RETRY_DELAY = 15_000;

// Polls for the delivery status of a standard relay
const useDeliveryStatus = () => {
  const dispatch = useDispatch();
  const route = useSelector((state: RootState) => state.redeem.route);
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );
  const signedMessage = useSelector(
    (state: RootState) => state.redeem.signedMessage,
  );

  useEffect(() => {
    if (!signedMessage || route !== Route.NTTRelay || transferComplete) return;
    const { emitterChain, emitterAddress, sequence } =
      getEmitterAndSequence(signedMessage);
    let active = true;
    const fetchData = async () => {
      while (active) {
        try {
          const response = await axios.get(
            `${BASE_URL}/${emitterChain}/${emitterAddress}/${sequence}`,
          );
          if (active) {
            const { delivery, toTxHash } = response.data?.data || {};
            if (delivery?.execution) {
              dispatch(setDeliveryStatus(delivery.status));
            }
            if (toTxHash) {
              dispatch(setRedeemTx(toTxHash));
            }
            break;
          }
        } catch (e: any) {
          if (e.response?.status !== 404) {
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
