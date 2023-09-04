import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import { fetchIsVAAEnqueued } from '../../utils/vaa';
import {
  setIsVaaEnqueued,
  setSignedMessage,
  setTransferComplete,
} from '../../store/redeem';
import { RootState } from '../../store';
import { Route } from '../../store/transferInput';
import { ParsedMessage, ParsedRelayerMessage } from '../../utils/sdk';
import Operator, { SignedMessage } from '../../utils/routes';

import PageHeader from '../../components/PageHeader';
import Spacer from '../../components/Spacer';
import NetworksTag from './Tag';
import Stepper from './Stepper';
import GovernorEnqueuedWarning from './GovernorEnqueuedWarning';
import { sleep } from '../../utils';

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
  txData: ParsedMessage | ParsedRelayerMessage;
  transferComplete: boolean;
  isVaaEnqueued: boolean;
  route: Route;
  signedMessage: SignedMessage;
}) {
  // check if VAA is enqueued
  useEffect(() => {
    if (
      !txData.sendTx ||
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
    if (!txData.sendTx || transferComplete) {
      return;
    }
    let cancelled = false;
    (async () => {
      let i = 0;
      let signed: SignedMessage | undefined;
      while (signed === undefined && !cancelled) {
        try {
          signed = await new Operator().getSignedMessage(route, txData);
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
    if (!txData.toChain || !signedMessage || transferComplete) {
      return;
    }
    let cancelled = false;
    (async () => {
      let i = 0;
      let isComplete = false;
      while (!isComplete && !cancelled) {
        try {
          isComplete = await new Operator().isTransferCompleted(
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
  }, [txData, transferComplete, route, setTransferComplete, signedMessage]);

  return (
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

      <NetworksTag />
      <Spacer />
      <GovernorEnqueuedWarning
        show={!txData && isVaaEnqueued}
        chain={txData.fromChain}
      />
      <Stepper />
    </div>
  );
}

function mapStateToProps(state: RootState) {
  const { txData, transferComplete, isVaaEnqueued, route, signedMessage } =
    state.redeem;

  return { txData, transferComplete, isVaaEnqueued, route, signedMessage };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setSignedMessage: (signed: SignedMessage) =>
      dispatch(setSignedMessage(signed)),
    setIsVaaEnqueued: (isVaaEnqueued: boolean) =>
      dispatch(setIsVaaEnqueued(isVaaEnqueued)),
    setTransferComplete: () => dispatch(setTransferComplete(true)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Redeem);
