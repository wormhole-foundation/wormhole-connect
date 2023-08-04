import React from 'react';
import { connect } from 'react-redux';
import { fetchIsVAAEnqueued } from '../../utils/vaa';
import {
  setIsVaaEnqueued,
  setTransferComplete,
  setReadyForRedeem,
} from '../../store/redeem';
import { RootState } from '../../store';
import { ParsedMessage, ParsedRelayerMessage } from '../../utils/sdk';
import PageHeader from '../../components/PageHeader';
import Spacer from '../../components/Spacer';
import NetworksTag from './Tag';
import Stepper from './Stepper';
import GovernorEnqueuedWarning from './GovernorEnqueuedWarning';
import Operator from '../../utils/routes';

class Redeem extends React.Component<
  {
    setReadyForRedeem: (readyForRedeem: boolean) => void;
    setIsVaaEnqueued: (isVaaEnqueued: boolean) => any;
    setTransferComplete: any;
    txData: ParsedMessage | ParsedRelayerMessage;
    transferComplete: boolean;
    isVaaEnqueued: boolean;
  },
  {
    readyForRedeem: boolean;
  }
> {
  constructor(props) {
    super(props);
    this.state = {
      readyForRedeem: false,
    };
  }

  async update() {
    if (!this.props.transferComplete) {
      if (!this.state.readyForRedeem) {
        await this.checkReadyForRedeem();
      }
      await this.getTransferComplete();
    }
  }

  async checkReadyForRedeem() {
    if (!this.props.txData.sendTx || this.state.readyForRedeem) return;
    const isReadyForRedeem = await new Operator().readyForRedeem(
      this.props.txData.route,
      this.props.txData,
    );
    if (isReadyForRedeem) {
      this.props.setReadyForRedeem(true);
      this.setState((prevState) => ({ ...prevState, readyForRedeem: true }));
    }
  }

  async getIsVaaEnqueued() {
    if (!this.props.txData.sendTx || this.state.readyForRedeem) return;
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
    if (!this.state.readyForRedeem || !this.props.txData) return;
    const isComplete = await new Operator().isTransferCompleted(
      this.props.txData.route,
      this.props.txData,
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
          show={!this.state.readyForRedeem && this.props.isVaaEnqueued}
          chain={this.props.txData.fromChain}
        />
        <Stepper />
      </div>
    );
  }
}

function mapStateToProps(state: RootState) {
  const { txData, transferComplete, isVaaEnqueued } = state.redeem;

  return { txData, transferComplete, isVaaEnqueued };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setReadyForRedeem: (readyForRedeem: boolean) =>
      dispatch(setReadyForRedeem(readyForRedeem)),
    setIsVaaEnqueued: (isVaaEnqueued: boolean) =>
      dispatch(setIsVaaEnqueued(isVaaEnqueued)),
    setTransferComplete: () => dispatch(setTransferComplete(true)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Redeem);
