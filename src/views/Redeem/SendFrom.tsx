import React from 'react';
import InputContainer from '../../components/InputContainer';
import { ChainName } from '../../sdk/types';
import Header from './Header';
import { RenderRows } from '../../components/RenderRows';
import Confirmations from './Confirmations';

const rows = [
  {
    title: 'Amount',
    value: '20.45 MATIC',
  },
  {
    title: 'Relayer fee',
    value: '1.5 MATIC',
  },
  {
    title: 'Conver to native gas token',
    value: '≈ 0.3 MATIC --> FTM',
  },
];

type Props = {
  network: ChainName;
  address: string;
  amount: string;
  relayerFee: string;
  nativeGas: string;
  showConfirmations: boolean;
};

function SendFrom(props: Props) {
  return (
    <div>
      <InputContainer>
        <Header network={props.network} address={props.address} />
        <RenderRows rows={rows} />
      </InputContainer>
      {props.showConfirmations && (
        <Confirmations confirmations={18} total={32} />
      )}
    </div>
  );
}

export default SendFrom;
