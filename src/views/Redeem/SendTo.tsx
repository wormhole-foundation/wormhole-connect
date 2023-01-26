import React from 'react';
import InputContainer from '../../components/InputContainer';
import Header from './Header';
import { RenderRows } from '../../components/RenderRows';
import Confirmations from './Confirmations';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { context } from '../../utils/sdk';
import { ParsedVaa } from '../../utils/vaa';

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
  amount: string;
  relayerFee: string;
  nativeGas: string;
  showConfirmations: boolean;
};

function SendTo(props: Props) {
  const vaa: ParsedVaa = useSelector((state: RootState) => state.redeem.vaa);
  const toNetwork = context.resolveDomainName(vaa.toChain);
  return (
    vaa && (
      <div>
        <InputContainer>
          <Header network={toNetwork} address={vaa.toAddress} />
          <RenderRows rows={rows} />
        </InputContainer>
        {props.showConfirmations && (
          <Confirmations confirmations={vaa.guardianSignatures} />
        )}
      </div>
    )
  );
}

export default SendTo;
