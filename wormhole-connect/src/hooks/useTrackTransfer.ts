import { useEffect, useState } from 'react';
import { isCompleted, routes, TransferState } from '@wormhole-foundation/sdk';

import config, { getWormholeContextV2 } from 'config';
import { sleep } from 'utils';

import type { AttestationReceipt } from '@wormhole-foundation/sdk';

// We don't start trying to fetch transfer updates until 1 minute from ETA
const MINIMUM_ETA = 60 * 1000;

const TRACK_TIMEOUT = 120 * 1000;

type Props = {
  route: string | undefined;
  receipt: routes.Receipt<AttestationReceipt> | null;
  // Timestamp the transfer was estimated to be finished
  eta?: Date;
};

type ReturnProps = {
  isCompleted: boolean;
  isReadyToClaim: boolean;
  receipt: routes.Receipt<AttestationReceipt> | undefined;
};

const useTrackTransfer = (props: Props): ReturnProps => {
  const [completed, setCompleted] = useState(false);
  const [readyToClaim, setReadyToClaim] = useState(false);
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

    const track = async () => {
      if (!routeName || !receipt) {
        return;
      }

      const route = config.routes.get(routeName);

      if (!route) {
        return;
      }

      const millisUntilEta = (eta: Date) =>
        eta.valueOf() - new Date().valueOf();

      const wh = await getWormholeContextV2();
      const sdkRoute = new route.rc(wh);

      while (isActive && !isCompleted(receipt)) {
        if (eta !== undefined) {
          // If we have an ETA, and it's longer than 1 minute out, we wait until 1 minute is left
          // before trying to track the transfer's progress.
          const msRemaining = millisUntilEta(eta);

          if (msRemaining > MINIMUM_ETA) {
            await sleep(msRemaining - MINIMUM_ETA);
          }
        }

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
                break;
              }

              // Check whether this is a manual transaction ready to claim
              if (
                !route.AUTOMATIC_DEPOSIT &&
                currentReceipt.state >= TransferState.Attested
              ) {
                setReadyToClaim(true);
              }
            }
          }
        } catch (e) {
          console.error('Error tracking transfer:', e);
        }

        let sleepTime = 5_000;

        // For automatic routes which are estimated to be done soon, we re-attempt more frequently
        if (eta !== undefined && route.AUTOMATIC_DEPOSIT) {
          const msRemaining = millisUntilEta(eta);
          if (msRemaining < 10_000) {
            sleepTime = 1_000;
          }
        }

        // Retry
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
    isReadyToClaim: readyToClaim,
    receipt,
  };
};

export default useTrackTransfer;
