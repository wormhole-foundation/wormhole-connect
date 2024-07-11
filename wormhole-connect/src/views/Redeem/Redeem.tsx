import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import { Route } from 'config/types';
import { RootState } from 'store';
import {
  setInvalidVaa,
  setIsVaaEnqueued,
  setTransferComplete,
} from 'store/redeem';
import { sleep } from 'utils';
import { isNttRoute } from 'routes';
import { ParsedMessage } from 'utils/sdk';

import PageHeader from 'components/PageHeader';
import Spacer from 'components/Spacer';
import ChainsTag from './Tag';
import Stepper from './Stepper';
import GovernorEnqueuedWarning from './GovernorEnqueuedWarning';
import config from 'config';
// import useDeliveryStatus from 'hooks/useDeliveryStatus';

import useConfirmBeforeLeaving from 'utils/confirmBeforeLeaving';

import useTrackTransfer from 'hooks/useTrackTransfer';

function Redeem({
  setIsVaaEnqueued,
  txData,
  transferComplete,
  isVaaEnqueued,
  route,
}: {
  setIsVaaEnqueued: (isVaaEnqueued: boolean) => any;
  setInvalidVaa: (invalidVaa: boolean) => void;
  setTransferComplete: any;
  txData: ParsedMessage | undefined;
  transferComplete: boolean;
  isVaaEnqueued: boolean;
  isResumeTx: boolean;
  route: Route | undefined;
}) {
  // Warn user before closing tab if transaction is unredeemed
  useConfirmBeforeLeaving(!transferComplete);

  // check if VAA is enqueued
  useEffect(() => {
    if (
      !txData?.sendTx ||
      !txData.emitterAddress || // no VAA exists, e.g. CCTP route
      isNttRoute(route) // NTT route doesn't use token bridge / governor
    ) {
      return;
    }
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        if (!cancelled) {
          // TODO SDKV2 proper NTT queue handling
          setIsVaaEnqueued(false);
          await sleep(30000);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [txData, route, setIsVaaEnqueued]);

  //// fetch the VAA
  //useEffect(() => {
  //  if (!route || !txData?.sendTx || transferComplete) {
  //    return;
  //  }
  //  let cancelled = false;
  //  (async () => {
  //    let i = 0;
  //    let signed: SignedMessage | undefined;
  //    while (signed === undefined && !cancelled) {
  //      try {
  //        signed = await RouteOperator.getSignedMessage(route, txData);
  //      } catch (e: any) {
  //        if (e?.message === INVALID_VAA_MESSAGE) {
  //          console.error(e);
  //          setInvalidVaa(true);
  //          cancelled = true;
  //        }
  //        signed = undefined;
  //      }
  //      if (cancelled) {
  //        return;
  //      }
  //      if (signed !== undefined) {
  //        setSignedMessage(signed);
  //      } else {
  //        await sleep(i < 10 ? 3000 : 30000);
  //      }
  //      i++;
  //    }
  //  })();
  //  return () => {
  //    cancelled = true;
  //  };
  //}, [txData, route, setSignedMessage, transferComplete]);

  //// check if VAA has been redeemed
  //useEffect(() => {
  //  if (!route || !txData?.toChain || !signedMessage || transferComplete) {
  //    return;
  //  }
  //  let cancelled = false;
  //  (async () => {
  //    let i = 0;
  //    let isComplete = false;
  //    while (!isComplete && !cancelled) {
  //      try {
  //        isComplete = await RouteOperator.isTransferCompleted(
  //          route,
  //          txData.toChain,
  //          signedMessage,
  //        );
  //      } catch (e) {
  //        console.error(e);
  //      }
  //      if (cancelled) {
  //        return;
  //      }
  //      if (isComplete) {
  //        setTransferComplete();
  //        if (!isResumeTx) {
  //          config.triggerEvent({
  //            type: 'transfer.success',
  //            details: {
  //              route,
  //              fromToken: getTokenDetails(txData.tokenKey),
  //              toToken: getTokenDetails(txData.receivedTokenKey),
  //              fromChain: txData.fromChain,
  //              toChain: txData.toChain,
  //            },
  //          });
  //        }
  //      } else {
  //        await sleep(i < 10 ? 3000 : 30000);
  //      }
  //      i++;
  //    }
  //  })();
  //  return () => {
  //    cancelled = true;
  //  };
  //}, [route, txData, transferComplete, setTransferComplete, signedMessage]);

  // useDeliveryStatus();
  useTrackTransfer();

  return txData?.fromChain ? (
    <div
      style={{
        width: '100%',
        maxWidth: '700px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <PageHeader
        title="Bridge"
        back
        showHamburgerMenu={config.showHamburgerMenu}
        testId="redeem-screen-header"
      />

      <ChainsTag />
      <Spacer />
      <GovernorEnqueuedWarning show={isVaaEnqueued} chain={txData.fromChain} />
      <Stepper />
    </div>
  ) : (
    <></>
  );
}

function mapStateToProps(state: RootState) {
  const {
    txData,
    transferComplete,
    isVaaEnqueued,
    isResumeTx,
    isInvalidVaa,
    route,
  } = state.redeem;

  return {
    txData,
    transferComplete,
    isVaaEnqueued,
    isResumeTx,
    isInvalidVaa,
    route,
  };
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    setIsVaaEnqueued: (isVaaEnqueued: boolean) =>
      dispatch(setIsVaaEnqueued(isVaaEnqueued)),
    setInvalidVaa: (isInvalidVaa: boolean) =>
      dispatch(setInvalidVaa(isInvalidVaa)),
    setTransferComplete: () => dispatch(setTransferComplete(true)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Redeem);
