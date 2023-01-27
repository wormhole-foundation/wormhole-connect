import React from 'react';
import { connect } from 'react-redux';
import { fetchVaa, ParsedVaa } from '../../utils/vaa';
import PageHeader from '../../components/PageHeader';
import Spacer from '../../components/Spacer';
import NetworksTag from './Tag';
import Stepper from './Stepper';
import { setVaa } from '../../store/redeem';
import { REQUIRED_CONFIRMATIONS } from '../../utils/sdk';

class Redeem extends React.Component<
  { setVaa: any },
  { vaa: ParsedVaa | undefined }
> {
  constructor(props) {
    super(props);
    this.state = { vaa: undefined };
  }

  async getVaa() {
    const vaa = await fetchVaa(
      'ca551687216bfd60ef2652531913b94ccdf032dbd71de5852e764e88b3dff361',
    );
    this.props.setVaa(vaa);
    this.setState({ vaa });
  }

  componentDidMount() {
    console.log('mount');
    this.getVaa();
    const interval = setInterval(() => {
      if (
        this.state.vaa &&
        this.state.vaa.guardianSignatures < REQUIRED_CONFIRMATIONS
      ) {
        this.getVaa();
      } else {
        clearInterval(interval);
      }
    }, 30000);
  }

  render() {
    if (!this.state.vaa) return <div></div>;
    return (
      this.state.vaa && (
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
      )
    );
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    setVaa: (vaa: ParsedVaa) => dispatch(setVaa(vaa)),
  };
};

export default connect(null, mapDispatchToProps)(Redeem);
