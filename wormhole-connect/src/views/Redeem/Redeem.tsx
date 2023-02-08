import React from 'react';
import { connect } from 'react-redux';
import { fetchVaa, ParsedVaa } from '../../utils/vaa';
import { setVaa } from '../../store/redeem';
import { RootState } from '../../store';
import PageHeader from '../../components/PageHeader';
import Spacer from '../../components/Spacer';
import NetworksTag from './Tag';
import Stepper from './Stepper';
import TxSearch from './TxSearch';

class Redeem extends React.Component<
  {
    setVaa: any;
    txData: any;
  },
  { vaa: ParsedVaa | undefined }
> {
  constructor(props) {
    super(props);
    this.state = { vaa: undefined };
  }

  async getVaa() {
    if (!this.props.txData.sendTx) return;
    const vaa = await fetchVaa(this.props.txData.sendTx.slice(2));
    this.props.setVaa(vaa);
    this.setState({ vaa });
  }

  componentDidMount() {
    this.getVaa();
    const interval = setInterval(() => {
      if (!this.state.vaa) {
        this.getVaa();
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

  return { txData };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setVaa: (vaa: ParsedVaa) => dispatch(setVaa(vaa)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Redeem);
