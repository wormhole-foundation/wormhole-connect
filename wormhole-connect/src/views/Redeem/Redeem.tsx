import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import { Route } from 'config/types';
import { RootState } from 'store';
import {
  setIsVaaEnqueued,
  setSignedMessage,
  setTransferComplete,
} from 'store/redeem';
import { sleep } from 'utils';
import { fetchIsVAAEnqueued } from 'utils/vaa';
import { SignedMessage } from 'routes';
import RouteOperator from 'routes/operator';
import { ParsedMessage, ParsedRelayerMessage } from 'utils/sdk';

import PageHeader from 'components/PageHeader';
import Spacer from 'components/Spacer';
import ChainsTag from './Tag';
import Stepper from './Stepper';
import GovernorEnqueuedWarning from './GovernorEnqueuedWarning';
import { showHamburgerMenu } from 'config';

import useConfirmBeforeLeaving from 'utils/confirmBeforeLeaving';

function Redeem({
  setSignedMessage,
  setIsVaaEnqueued,
  setTransferComplete,
  txData,
  transferComplete,
  isVaaEnqueued,
  route,
  signedMessage,
}: {
  setSignedMessage: (signed: SignedMessage) => any;
  setIsVaaEnqueued: (isVaaEnqueued: boolean) => any;
  setTransferComplete: any;
  txData: ParsedMessage | ParsedRelayerMessage | undefined;
  transferComplete: boolean;
  isVaaEnqueued: boolean;
  route: Route | undefined;
  signedMessage: SignedMessage | undefined;
}) {
  // Warn user before closing tab if transaction is unredeemed
  useConfirmBeforeLeaving(!transferComplete);

  // check if VAA is enqueued
  useEffect(() => {
    if (
      !txData?.sendTx ||
      !txData.emitterAddress || // no VAA exists, e.g. CCTP route
      !!signedMessage // if we have the VAA, then it's not enqueued
    ) {
      return;
    }
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        let isVaaEnqueued = false;
        try {
          isVaaEnqueued = await fetchIsVAAEnqueued(txData);
        } catch (e) {
          console.error(e);
        }
        if (!cancelled) {
          setIsVaaEnqueued(isVaaEnqueued);
          await sleep(30000);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [txData, signedMessage, setIsVaaEnqueued]);

  // fetch the VAA
  useEffect(() => {
    if (!route || !txData?.sendTx || transferComplete) {
      return;
    }
    let cancelled = false;
    (async () => {
      let i = 0;
      let signed: SignedMessage | undefined;
      while (signed === undefined && !cancelled) {
        try {
          signed = await RouteOperator.getSignedMessage(route, txData);
        } catch {
          signed = undefined;
        }
        if (cancelled) {
          return;
        }
        if (signed !== undefined) {
          setSignedMessage(signed);
        } else {
          await sleep(i < 10 ? 3000 : 30000);
        }
        i++;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [txData, route, setSignedMessage, transferComplete]);

  // check if VAA has been redeemed
  useEffect(() => {
    if (!route || !txData?.toChain || !signedMessage || transferComplete) {
      return;
    }
    let cancelled = false;
    (async () => {
      let i = 0;
      let isComplete = false;
      while (!isComplete && !cancelled) {
        try {
          isComplete = await RouteOperator.isTransferCompleted(
            route,
            txData.toChain,
            signedMessage,
          );
        } catch (e) {
          console.error(e);
        }
        if (cancelled) {
          return;
        }
        if (isComplete) {
          setTransferComplete();
        } else {
          await sleep(i < 10 ? 3000 : 30000);
        }
        i++;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [route, txData, transferComplete, setTransferComplete, signedMessage]);

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
      <PageHeader title="Bridge" back showHamburgerMenu={showHamburgerMenu} />

      <ChainsTag />
      <Spacer />
      <GovernorEnqueuedWarning
        show={!signedMessage && isVaaEnqueued}
        chain={txData.fromChain}
      />
      <Stepper />
    </div>
  ) : (
    <></>
  );
}

function mapStateToProps(state: RootState) {
  const { txData, transferComplete, isVaaEnqueued, route, signedMessage } =
    state.redeem;

  return { txData, transferComplete, isVaaEnqueued, route, signedMessage };
}

const mapDispatchToProps = (dispatch: any) => {
  return {
    setSignedMessage: (signed: SignedMessage) =>
      dispatch(setSignedMessage(signed)),
    setIsVaaEnqueued: (isVaaEnqueued: boolean) =>
      dispatch(setIsVaaEnqueued(isVaaEnqueued)),
    setTransferComplete: () => dispatch(setTransferComplete(true)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Redeem);
