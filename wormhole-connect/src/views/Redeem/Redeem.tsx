import React from 'react';
import { connect } from 'react-redux';
import { fetchIsVAAEnqueued } from '../../utils/vaa';
import {
  setIsVaaEnqueued,
  setTransferComplete,
  setMessageInfo,
} from '../../store/redeem';
import { RootState } from '../../store';
import { ParsedMessage, ParsedRelayerMessage } from '../../utils/sdk';
import PageHeader from '../../components/PageHeader';
import Spacer from '../../components/Spacer';
import NetworksTag from './Tag';
import Stepper from './Stepper';
import GovernorEnqueuedWarning from './GovernorEnqueuedWarning';
import Operator, { MessageInfo } from '../../utils/routes';
import { Route } from '../../store/transferInput';

class Redeem extends React.Component<
  {
    setMessageInfo: any;
    setIsVaaEnqueued: (isVaaEnqueued: boolean) => any;
    setTransferComplete: any;
    txData: ParsedMessage | ParsedRelayerMessage;
    transferComplete: boolean;
    isVaaEnqueued: boolean;
    route: Route;
  },
  {
    messageInfo: MessageInfo | undefined;
  }
> {
  constructor(props) {
    super(props);
    this.state = {
      messageInfo: undefined,
    };
  }

  async update() {
    if (!this.props.transferComplete) {
      if (!this.state.messageInfo) {
        await this.getMessageInfo();
      }
      await this.getTransferComplete();
    }
  }

  async getMessageInfo() {
    if (!this.props.txData.sendTx || !!this.state.messageInfo) return;
    const messageInfo = await new Operator().getMessageInfo(
      this.props.route,
      this.props.txData.sendTx,
      this.props.txData.fromChain,
    );
    if (messageInfo) {
      this.props.setMessageInfo(messageInfo);
      this.setState((prevState) => ({ ...prevState, messageInfo }));
    }
  }

  async getIsVaaEnqueued() {
    if (
      !this.props.txData.sendTx ||
      !!this.state.messageInfo ||
      !this.props.txData.emitterAddress // no VAA exists, e.g. CCTP route
    )
      return;
    let isVaaEnqueued = false;
    try {
      isVaaEnqueued = await fetchIsVAAEnqueued(this.props.txData);
    } catch (e) {
      // log error and continue
      console.error(e);
    } finally {
      this.props.setIsVaaEnqueued(isVaaEnqueued);
    }
  }

  async getTransferComplete() {
    if (!this.state.messageInfo || !this.props.txData) return;
    const isComplete = await new Operator().isTransferCompleted(
      this.props.route,
      this.props.txData.toChain,
      this.state.messageInfo,
    );
    if (isComplete) this.props.setTransferComplete();
  }

  componentDidMount() {
    this.getIsVaaEnqueued();
    this.update();

    // poll more frequently for the first 10 seconds
    let i = 0;
    const initializePoll = setInterval(async () => {
      if (!this.props.transferComplete && i < 10) {
        this.update();
        i++;
      } else {
        clearInterval(initializePoll);
      }
    }, 1000);

    const poll = setInterval(async () => {
      if (!this.props.transferComplete) {
        this.update();
      } else {
        clearInterval(poll);
      }
    }, 30000);
  }

  render() {
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
          show={!this.state.messageInfo && this.props.isVaaEnqueued}
          chain={this.props.txData.fromChain}
        />
        <Stepper />
      </div>
    );
  }
}

function mapStateToProps(state: RootState) {
  const { txData, transferComplete, isVaaEnqueued, route } = state.redeem;

  return { txData, transferComplete, isVaaEnqueued, route };
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
