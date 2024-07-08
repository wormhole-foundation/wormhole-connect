import { isCompleted } from '@wormhole-foundation/sdk';
import { RouteContext } from 'contexts/RouteContext';
import { useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setTransferComplete } from 'store/redeem';
import { sleep } from 'utils';

const TRACK_TIMEOUT = 120 * 1000;

// TODO: document this hook, especially since it sets and depends on the receipt state
const useTrackTransfer = (): void => {
  const dispatch = useDispatch();

  const routeContext = useContext(RouteContext);

  useEffect(() => {
    let isActive = true;

    const track = async () => {
      const { route, receipt } = routeContext;
      if (!route || !receipt) {
        return;
      }
      while (isActive && !isCompleted(receipt)) {
        try {
          // TODO: the timeout may be longer for chains with slower finality times
          // but we will retry so maybe it doesn't matter
          const result = await route.track(receipt, TRACK_TIMEOUT).next();
          if (result.done || !isActive) {
            break;
          }
          const currentReceipt = result.value;
          if (currentReceipt.state !== receipt.state) {
            routeContext.setReceipt(currentReceipt);
            if (isCompleted(currentReceipt)) {
              dispatch(setTransferComplete(true));
            }
            break;
          }
        } catch (e) {
          console.error('Error tracking transfer:', e);
        }
        // retry
        // TODO: exponential backoff depending on the current state?
        await sleep(5000);
      }
    };

    track();

    return () => {
      isActive = false;
    };
  }, [routeContext]);
};

export default useTrackTransfer;
