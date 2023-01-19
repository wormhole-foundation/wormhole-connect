import React from 'react';
import InputContainer from '../../components/InputContainer';
import { ChainName } from '../../sdk/types';
import Header from './Header';
import { RenderRows } from '../../components/RenderRows';
import Confirmations from './Confirmations';

const rows = [
  {
    title: 'Amount',
    value: '20.1 MATIC',
  },
  {
    title: 'Native gas token',
    value: '0.5 FTM',
  },
];

type Props = {
  toNetwork: ChainName;
  senderAddress: string;
  amount: string;
  relayerFee: string;
  nativeGas: string;
  showConfirmations: boolean;
};

function SendTo(props: Props) {
  return (
    <div>
      <InputContainer>
        <Header network={props.toNetwork} senderAddress={props.senderAddress} />
        <RenderRows rows={rows} />
      </InputContainer>
      {props.showConfirmations && (
        <Confirmations confirmations={7} total={10} />
      )}
    </div>
  );
}

export default SendTo;
