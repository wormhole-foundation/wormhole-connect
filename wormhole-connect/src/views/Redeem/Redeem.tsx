import React from 'react';
import { connect } from 'react-redux';
// import { fetchVaa, ParsedVaa, getSignedVAAHash } from '../../utils/vaa';
import { ParsedVaa } from '../../utils/vaa';
import { setVaa } from '../../store/redeem';
import { RootState } from '../../store';
// import { getTransferComplete } from '../../sdk/sdk';
import PageHeader from '../../components/PageHeader';
import Spacer from '../../components/Spacer';
import NetworksTag from './Tag';
import Stepper from './Stepper';

class Redeem extends React.Component<
  {
    setVaa: any;
    txData: any;
  },
  {
    vaa: ParsedVaa | undefined;
    isComplete: boolean;
  }
> {
  constructor(props) {
    super(props);
    this.state = {
      vaa: undefined,
      isComplete: false,
    };
  }

  async update() {
    console.log('start')
    setTimeout(() => {
      console.log('update')
      this.setState({ ...this.state, isComplete: true });
    }, 10000)
  }

  // async update() {
  //   if (!this.state.isComplete) {
  //     if (!this.state.vaa) {
  //       await this.getVaa();
  //     }
  //     await this.getTransferComplete();
  //   }
  // }

  // async getVaa() {
  //   if (!this.props.txData.sendTx) return;
  //   const vaa = await fetchVaa(this.props.txData.sendTx.slice(2));
  //   this.props.setVaa(vaa);
  //   this.setState({ ...this.state, vaa });
  // }

  // async getTransferComplete() {
  //   if (!this.state.vaa || !this.props.txData) return;
  //   const hash = getSignedVAAHash(this.state.vaa.hash);
  //   const isComplete = await getTransferComplete(this.props.txData.toChain, hash);
  //   this.setState({ ...this.state, isComplete });
  // }

  componentDidMount() {
    console.log('mount')
    this.update();
    const interval = setInterval(async () => {
      if (!this.state.isComplete) {
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
        <Stepper cta="Some CTA" isComplete={this.state.isComplete} />
        <Spacer height={60} />
      </div>
    );
  }
}

function mapStateToProps(state: RootState) {
  const txData = state.redeem.txData!;

  return { txData };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setVaa: (vaa: ParsedVaa) => dispatch(setVaa(vaa)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Redeem);
