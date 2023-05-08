import React from 'react';
import { connect } from 'react-redux';
import { fetchVaa, ParsedVaa } from '../../utils/vaa';
import {
  setIsVaaEnqueued,
  setTransferComplete,
  setVaa,
} from '../../store/redeem';
import { RootState } from '../../store';
import { getTransferComplete } from '../../sdk';
import PageHeader from '../../components/PageHeader';
import Spacer from '../../components/Spacer';
import NetworksTag from './Tag';
import Stepper from './Stepper';

class Redeem extends React.Component<
  {
    setVaa: any;
    setIsVaaEnqueued: (isVaaEnqueued: boolean) => any;
    setTransferComplete: any;
    txData: any;
    transferComplete: boolean;
  },
  {
    vaa: ParsedVaa | undefined;
  }
> {
  constructor(props) {
    super(props);
    this.state = {
      vaa: undefined,
    };
  }

  async update() {
    if (!this.props.transferComplete) {
      if (!this.state.vaa) {
        await this.getVaa();
      }
      await this.getTransferComplete();
    }
  }

  async getVaa() {
    if (!this.props.txData.sendTx || !!this.state.vaa) return;
    const vaa = await fetchVaa(this.props.txData);
    if (vaa) {
      this.props.setVaa(vaa);
      this.setState((prevState) => ({ ...prevState, vaa }));
    }
  }

  async getIsVaaEnqueued() {
    if (!this.props.txData.sendTx || !!this.state.vaa) return;
    const isVaaEnqueued = await fetchIsVaaEnqueued(this.props.txData);
    if (isVaaEnqueued) {
      this.props.setIsVaaEnqueued(isVaaEnqueued);
      // this.setState((prevState) => ({ ...prevState, isVaaEnqueued }));
    }
  }

  async getTransferComplete() {
    if (!this.state.vaa || !this.props.txData) return;
    const isComplete = await getTransferComplete(
      this.props.txData.toChain,
      this.state.vaa.bytes,
    );
    if (isComplete) this.props.setTransferComplete();
  }

  componentDidMount() {
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
        <Stepper cta="Some CTA" />
      </div>
    );
  }
}

function mapStateToProps(state: RootState) {
  const txData = state.redeem.txData!;
  const transferComplete = state.redeem.transferComplete;

  return { txData, transferComplete };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setVaa: (vaa: ParsedVaa) => dispatch(setVaa(vaa)),
    setIsVaaEnqueued: (isVaaEnqueued: boolean) =>
      dispatch(setIsVaaEnqueued(isVaaEnqueued)),
    setTransferComplete: () => dispatch(setTransferComplete(true)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Redeem);
