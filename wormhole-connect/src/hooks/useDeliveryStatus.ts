import { DeliveryStatus } from '@certusone/wormhole-sdk/lib/esm/relayer';
import axios from 'axios';
import { Route } from 'config/types';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { setRedeemTx, setDeliveryStatus } from 'store/redeem';
import { sleep } from 'utils';
import { isEvmChain } from 'utils/sdk';
import { getEmitterAndSequence } from 'utils/vaa';
import config from 'config';

const RETRY_DELAY = 15_000;

interface RelayResponse {
  data?: {
    delivery?: {
      execution?: {
        status: DeliveryStatus;
      };
    };
    toTxHash?: string;
  };
}

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
      // Currently, only EVM chains support standard relayer
      !isEvmChain(signedMessage.toChain) ||
      !isEvmChain(signedMessage.fromChain)
    ) {
      return;
    }
    const { emitterChain, emitterAddress, sequence } =
      getEmitterAndSequence(signedMessage);
    const baseUrl = `https://api.${
      config.isMainnet ? '' : 'testnet.'
    }wormholescan.io/api/v1/relays`;
    let active = true;
    const fetchData = async () => {
      while (active) {
        try {
          const response = await axios.get<RelayResponse>(
            `${baseUrl}/${emitterChain}/${emitterAddress}/${sequence}`,
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
          if (!axios.isAxiosError(e) || e.status !== 404) {
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
