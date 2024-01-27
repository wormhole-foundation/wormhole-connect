import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { sleep } from 'utils';
import {
  resetInboundQueuedTransfer,
  setInboundQueuedTransfer,
} from 'store/ntt';
import { isSignedNTTMessage } from 'routes/types';
import { isNTTRoute } from 'routes';
import RouteOperator from 'routes/operator';
import { NTTBase } from 'routes/ntt/nttBase';

const RETRY_DELAY = 30 * 1000;

const useCheckInboundQueuedTransfer = () => {
  const dispatch = useDispatch();
  const route = useSelector((state: RootState) => state.redeem.route);
  const signedMessage = useSelector(
    (state: RootState) => state.redeem.signedMessage,
  );
  const transferComplete = useSelector(
    (state: RootState) => state.redeem.transferComplete,
  );

  useEffect(() => {
    dispatch(resetInboundQueuedTransfer());
    if (
      !route ||
      !isNTTRoute(route) ||
      !signedMessage ||
      !isSignedNTTMessage(signedMessage) ||
      transferComplete
    ) {
      return;
    }
    let active = true;
    (async () => {
      const { toChain, destManagerAddress, messageDigest } = signedMessage;
      const ntt = RouteOperator.getRoute(route) as NTTBase;
      while (active) {
        try {
          const queuedTransfer = await ntt.getInboundQueuedTransfer(
            toChain,
            destManagerAddress,
            messageDigest,
          );
          if (active) {
            dispatch(setInboundQueuedTransfer(queuedTransfer));
          }
          if (!queuedTransfer) {
            // If the transfer is not queued, we can stop checking
            break;
          }
        } catch (e) {
          console.error(e);
        }
        if (active) {
          await sleep(RETRY_DELAY);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [route, transferComplete, signedMessage]);
};

export default useCheckInboundQueuedTransfer;
