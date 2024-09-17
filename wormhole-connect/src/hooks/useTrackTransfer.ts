import { isCompleted } from '@wormhole-foundation/sdk';
import { RouteContext } from 'contexts/RouteContext';
import { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setRedeemTx, setTransferComplete } from 'store/redeem';
import type { RootState } from 'store';
import { sleep } from 'utils';

const TRACK_TIMEOUT = 120 * 1000;

// TODO: document this hook, especially since it sets and depends on the receipt state
const useTrackTransfer = (): void => {
  const dispatch = useDispatch();

  const routeContext = useContext(RouteContext);

  const { txData, timestamp } = useSelector((state: RootState) => state.redeem);

  useEffect(() => {
    let isActive = true;

    let sleepTime = 5000;

    if (txData && txData.eta && txData.eta < 30_000) {
      // Poll aggressively for very fast transfers
      sleepTime = 1000;
    }

    const track = async () => {
      const { route, receipt } = routeContext;

      if (!route || !receipt) {
        return;
      }

      let stateChanged = false;

      while (isActive && !isCompleted(receipt) && !stateChanged) {
        try {
          // We need to consume all of the values the track generator yields in case any of them
          // update the receipt state.
          // When the receipt state is updated, we set the new receipt in the route context
          // and break out of the loop.
          // The hook will then be re-run and the new receipt will be used to continue tracking
          // unless the transfer is completed.
          for await (const currentReceipt of route.track(
            receipt,
            TRACK_TIMEOUT,
          )) {
            if (!isActive) {
              break;
            }

            if (currentReceipt.state !== receipt.state) {
              routeContext.setReceipt(currentReceipt);

              if (isCompleted(currentReceipt)) {
                dispatch(setTransferComplete(true));

                const lastTx = currentReceipt.destinationTxs?.slice(-1)[0];
                if (lastTx) {
                  dispatch(setRedeemTx(lastTx.txid));
                }
              }

              stateChanged = true;
              break;
            }
          }
        } catch (e) {
          console.error('Error tracking transfer:', e);
          sleepTime = 5000; // Back off if we were polling aggressively
        }

        // retry
        // TODO: exponential backoff depending on the current state?
        await sleep(sleepTime);
      }
    };

    track();

    return () => {
      isActive = false;
    };
  }, [routeContext, txData?.eta, timestamp]);
};

export default useTrackTransfer;
