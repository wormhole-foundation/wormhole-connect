import React from 'react';
import { connect } from 'react-redux';
import { fetchVaa, ParsedVaa, getSignedVAAHash } from '../../utils/vaa';
import { setTransferComplete, setVaa } from '../../store/redeem';
import { RootState } from '../../store';
import { getTransferComplete } from '../../sdk/sdk';
import PageHeader from '../../components/PageHeader';
import Spacer from '../../components/Spacer';
import NetworksTag from './Tag';
import Stepper from './Stepper';

class Redeem extends React.Component<
  {
    setVaa: any;
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
    if (!this.props.txData.sendTx) return;
    const vaa = await fetchVaa(this.props.txData.sendTx);
    this.props.setVaa(vaa);
    this.setState({ ...this.state, vaa });
  }

  async getTransferComplete() {
    if (!this.state.vaa || !this.props.txData) return;
    const hash = getSignedVAAHash(this.state.vaa.hash);
    const isComplete = await getTransferComplete(this.props.txData.toChain, hash);
    if (isComplete) this.props.setTransferComplete();
  }

  componentDidMount() {
    this.update();
    const interval = setInterval(async () => {
      if (!this.props.transferComplete) {
        this.update();
      } else {
        clearInterval(interval);
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

        <Spacer height={40} />
        <NetworksTag />
        <Stepper cta="Some CTA" />
        <Spacer height={60} />
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
    setTransferComplete: () => dispatch(setTransferComplete(true)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Redeem);
