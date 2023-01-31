import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PaymentOption } from '../../store/transfer';
import { RenderRows, RowsData } from '../../components/RenderRows';
import InputContainer from '../../components/InputContainer';
import BridgeCollapse from './Collapse';
import { CHAINS } from '../../sdk/config';

const getRows = (token: string, gasToken: string, payment: PaymentOption): RowsData => {
  // TODO: get amount
  if (payment === PaymentOption.AUTOMATIC) {
    return [{
      title: 'Amount',
      value: `20.35 ${token}`,
    },
    {
      title: 'Native token on destination',
      value: `0.5 ${gasToken}`,
    },
    {
      title: 'Total fee estimate',
      value: `0.5 ${token}`,
      rows: [
        {
          title: 'Relayer fee',
          value: `0.3 ${token}`,
        },
        {
          title: 'Source chain gas estimate',
          value: `~ 0.3 ${token}`,
        },
        {
          title: 'Destination chain gas estimate',
          value: `~ 0.3 ${token}`,
        },
      ],
    }]
  }
  return [{
    title: 'Amount',
    value: `20.45 ${token}`,
  },
  {
    title: 'Total fee estimates',
    value: `0.5 ${token} & 0.5 ${gasToken}`,
    rows: [
      {
        title: 'Source chain gas estimate',
        value: `~ 0.5 ${token}`,
      },
      {
        title: 'Destination chain gas estimate',
        value: `~ 0.5 ${gasToken}`,
      },
    ],
  }]
}

function Preview(props: { collapsed: boolean }) {
  const [state, setState] = React.useState({ rows: [] as RowsData});
  const { token, toNetwork, destGasPayment } = useSelector(
    (state: RootState) => state.transfer,
  );
  useEffect(() => {
    const destConfig = toNetwork && CHAINS[toNetwork];
    if (token && destConfig) {
      const rows = getRows(token, destConfig!.nativeToken, destGasPayment);
      setState({ rows })
    }
  }, [token, toNetwork, destGasPayment]);

  return (
    <BridgeCollapse
      title="Preview"
      disabled={props.collapsed}
      controlled
      value={props.collapsed}
    >
      <InputContainer border styles={{ boxShadow: 'none' }}>
        <RenderRows rows={state.rows} />
      </InputContainer>
    </BridgeCollapse>
  );
}

export default Preview;
