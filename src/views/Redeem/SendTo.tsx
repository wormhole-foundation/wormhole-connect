import React from 'react';
import InputContainer from '../../components/InputContainer';
import Header from './Header';
import { RenderRows } from '../../components/RenderRows';
import Confirmations from './Confirmations';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { context, REQUIRED_CONFIRMATIONS } from '../../utils/sdk';
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

function SendTo() {
  const vaa: ParsedVaa = useSelector((state: RootState) => state.redeem.vaa);
  if (!vaa) return <div></div>;
  const toNetwork = context.resolveDomainName(vaa.toChain);
  const pending = vaa.guardianSignatures < REQUIRED_CONFIRMATIONS;

  return (
    <div>
      <InputContainer>
        <Header
          network={toNetwork}
          address={vaa.toAddress}
          txHash={!pending ? vaa.txHash : undefined}
        />
        <RenderRows rows={rows} />
      </InputContainer>
      {pending && <Confirmations confirmations={vaa.guardianSignatures} />}
    </div>
  );
}

export default SendTo;
