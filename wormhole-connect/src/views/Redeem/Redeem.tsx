import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import { Route } from 'config/types';
import { RootState } from 'store';
import {
  setIsVaaEnqueued,
  setSignedMessage,
  setTransferComplete,
} from 'store/redeem';
import {
  sleep,
  fetchIsVAAEnqueued,
  ParsedMessage,
  ParsedRelayerMessage,
} from 'utils';
import { SignedMessage } from 'routes';
import RouteOperator from 'routes/operator';

import PageHeader from 'components/PageHeader';
import Spacer from 'components/Spacer';
import ChainsTag from './Tag';
import Stepper from './Stepper';
import GovernorEnqueuedWarning from './GovernorEnqueuedWarning';

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
  // check if VAA is enqueued
  useEffect(() => {
    if (
      !txData?.sendTx ||
      !txData.emitterAddress // no VAA exists, e.g. CCTP route
    ) {
      return;
    }
    (async () => {
      let isVaaEnqueued = false;
      try {
        isVaaEnqueued = await fetchIsVAAEnqueued(txData);
      } catch (e) {
        // log error and continue
        console.error(e);
      } finally {
        setIsVaaEnqueued(isVaaEnqueued);
      }
    })();
  }, [txData, setIsVaaEnqueued]);

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
        } catch {}
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
        } catch {}
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
      <PageHeader title="Bridge" back />

      <ChainsTag />
      <Spacer />
      <GovernorEnqueuedWarning
        show={!txData && isVaaEnqueued}
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
