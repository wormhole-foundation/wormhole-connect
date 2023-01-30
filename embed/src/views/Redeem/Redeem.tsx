import React from 'react';
import { connect } from 'react-redux';
import { fetchVaa, ParsedVaa } from '../../utils/vaa';
import PageHeader from '../../components/PageHeader';
import Spacer from '../../components/Spacer';
import NetworksTag from './Tag';
import Stepper from './Stepper';
import { setVaa } from '../../store/redeem';
import { RootState } from '../../store';
import { ChainName } from 'sdk';
import { Alert, AlertTitle } from '@mui/material';

class Redeem extends React.Component<
  {
    setVaa: any;
    txHash: string;
    fromNetwork: ChainName;
    toNetwork: ChainName;
    amount: number;
    senderAddr: string;
    receivingAddr: string;
    token: string;
  },
  { vaa: ParsedVaa | undefined }
> {
  constructor(props) {
    super(props);
    this.state = { vaa: undefined };
  }

  async getVaa() {
    const vaa = await fetchVaa(this.props.txHash.slice(2));
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
    // TODO: write validate function
    const {
      txHash,
      fromNetwork,
      toNetwork,
      amount,
      senderAddr,
      receivingAddr,
      token,
    } = this.props;
    if (
      !txHash ||
      !fromNetwork ||
      !toNetwork ||
      !amount ||
      !senderAddr ||
      !receivingAddr ||
      !token
    )
      return <div></div>;
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

        <Alert severity="warning" sx={{ width: '100%', marginTop: '32px' }}>
          <AlertTitle>Warning</AlertTitle>
          Do not leave page before completing your transfer
        </Alert>

        <Spacer height={40} />
        <NetworksTag />
        <Stepper cta="Some CTA" />
        <Spacer height={60} />
      </div>
    );
  }
}

function mapStateToProps(state: RootState) {
  const { fromNetwork, toNetwork, amount, token, destGasPayment, txHash } =
    state.transfer;
  const { sending, receiving } = state.wallet;
  return {
    txHash,
    fromNetwork,
    toNetwork,
    amount,
    token,
    destGasPayment,
    senderAddr: sending.address,
    receivingAddr: receiving.address,
  };
}

const mapDispatchToProps = (dispatch) => {
  return {
    setVaa: (vaa: ParsedVaa) => dispatch(setVaa(vaa)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Redeem);
