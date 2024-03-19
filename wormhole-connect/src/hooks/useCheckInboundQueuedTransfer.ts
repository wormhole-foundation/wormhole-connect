import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from 'store';
import { sleep } from 'utils';
import {
  resetInboundQueuedTransfer,
  setInboundQueuedTransfer,
} from 'store/ntt';
import { isSignedNttMessage } from 'routes/types';
import { isNttRoute } from 'routes';
import RouteOperator from 'routes/operator';
import { NttBase } from 'routes/ntt/nttBase';

const RETRY_DELAY = 15_000;

const useCheckInboundQueuedTransfer = (): void => {
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
      !isNttRoute(route) ||
      !signedMessage ||
      !isSignedNttMessage(signedMessage) ||
      transferComplete
    ) {
      return;
    }
    const { toChain, recipientNttManager, messageDigest } = signedMessage;
    const nttRoute = RouteOperator.getRoute(route) as NttBase;
    let active = true;
    const fetchData = async () => {
      // We continue polling for the inbound queued transfer even after fetching the data once,
      // because the transfer could be released by anyone.
      while (active) {
        try {
          const queuedTransfer = await nttRoute.getInboundQueuedTransfer(
            toChain,
            recipientNttManager,
            messageDigest,
          );
          if (active) {
            dispatch(setInboundQueuedTransfer(queuedTransfer));
          }
        } catch (e) {
          console.error(e);
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
  }, [route, transferComplete, signedMessage]);
};

export default useCheckInboundQueuedTransfer;
