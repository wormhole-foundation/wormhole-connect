import React, { useEffect } from 'react';
import { connect } from 'react-redux';

import { fetchIsVAAEnqueued } from '../../utils/vaa';
import {
  setIsVaaEnqueued,
  setTransferComplete,
  setMessageInfo,
} from '../../store/redeem';
import { RootState } from '../../store';
import { Route } from '../../store/transferInput';
import { ParsedMessage, ParsedRelayerMessage } from '../../utils/sdk';
import Operator, { MessageInfo } from '../../utils/routes';

import PageHeader from '../../components/PageHeader';
import Spacer from '../../components/Spacer';
import NetworksTag from './Tag';
import Stepper from './Stepper';
import GovernorEnqueuedWarning from './GovernorEnqueuedWarning';
import { sleep } from '../../utils';

function Redeem({
  messageInfo,
  setMessageInfo,
  setIsVaaEnqueued,
  setTransferComplete,
  txData,
  transferComplete,
  isVaaEnqueued,
  route,
}: {
  messageInfo: MessageInfo | undefined;
  setMessageInfo: any;
  setIsVaaEnqueued: (isVaaEnqueued: boolean) => any;
  setTransferComplete: any;
  txData: ParsedMessage | ParsedRelayerMessage;
  transferComplete: boolean;
  isVaaEnqueued: boolean;
  route: Route;
}) {
  // check if VAA is enqueued
  useEffect(() => {
    if (
      !txData.sendTx ||
      !!messageInfo ||
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
  }, [txData, messageInfo, setIsVaaEnqueued]);

  // fetch the VAA
  useEffect(() => {
    if (!txData.sendTx || !!messageInfo || transferComplete) {
      return;
    }
    let cancelled = false;
    (async () => {
      let i = 0;
      let msgInfo: MessageInfo | undefined;
      while (msgInfo === undefined && !cancelled) {
        try {
          msgInfo = await new Operator().getMessageInfo(
            route,
            txData.sendTx,
            txData.fromChain,
          );
        } catch {}
        if (cancelled) {
          return;
        }
        if (msgInfo !== undefined) {
          setMessageInfo(msgInfo);
        } else {
          await sleep(i < 10 ? 3000 : 30000);
        }
        i++;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    txData.sendTx,
    txData.fromChain,
    messageInfo,
    setMessageInfo,
    route,
    transferComplete,
  ]);

  // check if VAA has been redeemed
  useEffect(() => {
    if (!messageInfo || !txData.toChain || transferComplete) {
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
            messageInfo,
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
  }, [
    txData.toChain,
    messageInfo,
    setMessageInfo,
    transferComplete,
    route,
    setTransferComplete,
  ]);

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
        show={!messageInfo && isVaaEnqueued}
        chain={txData.fromChain}
      />
      <Stepper />
    </div>
  );
}

function mapStateToProps(state: RootState) {
  const { txData, transferComplete, isVaaEnqueued, route, messageInfo } =
    state.redeem;

  return { txData, transferComplete, isVaaEnqueued, route, messageInfo };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setMessageInfo: (messageInfo: MessageInfo) =>
      dispatch(setMessageInfo(messageInfo)),
    setIsVaaEnqueued: (isVaaEnqueued: boolean) =>
      dispatch(setIsVaaEnqueued(isVaaEnqueued)),
    setTransferComplete: () => dispatch(setTransferComplete(true)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Redeem);
