import { useEffect, useState } from 'react';
import { isCompleted, routes } from '@wormhole-foundation/sdk';

import config, { getWormholeContextV2 } from 'config';
import { sleep } from 'utils';

import type { AttestationReceipt } from '@wormhole-foundation/sdk';

const TRACK_INTERVAL = 5000;
const TRACK_INTERVAL_FAST = 1000;
const TRACK_TIMEOUT = 120 * 1000;

type Props = {
  route: string;
  receipt: routes.Receipt<AttestationReceipt>;
  eta?: number;
};

type ReturnProps = {
  isCompleted: boolean;
};

const useTrackTransferV2 = (props: Props): ReturnProps => {
  const [completed, setCompleted] = useState(false);
  const [receipt, setReceipt] = useState<routes.Receipt<AttestationReceipt>>();

  const { eta, route: routeName } = props;

  // Set initial receipt from the caller
  useEffect(() => {
    if (props.receipt) {
      setReceipt(props.receipt);
    }
  }, [props.receipt]);

  useEffect(() => {
    let isActive = true;

    let sleepTime = TRACK_INTERVAL;

    if (eta && eta < 30_000) {
      // Poll aggressively for very fast transfers
      sleepTime = TRACK_INTERVAL_FAST;
    }

    const track = async () => {
      if (!routeName || !receipt) {
        return;
      }

      const route = config.routes.get(routeName);

      if (!route) {
        return;
      }

      const wh = await getWormholeContextV2();
      const sdkRoute = new route.rc(wh);

      let stateChanged = false;

      while (isActive && !isCompleted(receipt) && !stateChanged) {
        try {
          // We need to consume all of the values the track generator yields in case any of them
          // update the receipt state.
          for await (const currentReceipt of sdkRoute.track(
            receipt,
            TRACK_TIMEOUT,
          )) {
            if (!isActive) {
              break;
            }

            // When the receipt state is updated, we set the new receipt in the local state
            // and break out of the loop.
            // The hook will then be re-run and the new receipt will be used to continue tracking
            // until the transfer is completed.
            if (currentReceipt.state !== receipt.state) {
              setReceipt(currentReceipt);

              if (isCompleted(currentReceipt)) {
                setCompleted(true);
                stateChanged = true;
                break;
              }
            }
          }
        } catch (e) {
          console.error('Error tracking transfer:', e);
          sleepTime = TRACK_INTERVAL; // Back off if we were polling aggressively
        }

        // Retry
        // TODO: exponential backoff depending on the current state?
        await sleep(sleepTime);
      }
    };

    track();

    return () => {
      isActive = false;
    };
  }, [eta, receipt, routeName]);

  return {
    isCompleted: completed,
  };
};

export default useTrackTransferV2;
