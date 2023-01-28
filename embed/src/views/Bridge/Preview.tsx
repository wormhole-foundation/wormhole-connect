import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PaymentOption } from '../../store/transfer';
import { RenderRows, RowsData } from '../../components/RenderRows';
import InputContainer from '../../components/InputContainer';
import BridgeCollapse from './Collapse';

const automaticRows: RowsData = [
  {
    title: 'Amount',
    value: '20.35 MATIC',
  },
  {
    title: 'Destination gas token amount',
    value: '0.5 FTM',
  },
  {
    title: 'Total fee estimate',
    value: '0.5 MATIC',
    rows: [
      {
        title: 'Relayer fee',
        value: '0.3 MATIC',
      },
    ],
  },
];

const manualRows: RowsData = [
  {
    title: 'Amount',
    value: '20.45 MATIC',
  },
  {
    title: 'Total fee estimates',
    value: '0.5 MATIC & 0.5 FTM',
    rows: [
      {
        title: 'Source chain gas',
        value: '~ 0.5 MATIC',
      },
      {
        title: 'Destination chain gas',
        value: '~ 0.5 FTM',
      },
    ],
  },
];

function Preview(props: { collapsed: boolean }) {
  const selectedOption = useSelector(
    (state: RootState) => state.transfer.destGasPayment,
  );
  const rows =
    selectedOption === PaymentOption.AUTOMATIC ? automaticRows : manualRows;

  return (
    <BridgeCollapse
      text="Preview"
      disabled={props.collapsed}
      controlled
      value={props.collapsed}
    >
      <InputContainer border styles={{ boxShadow: 'none' }}>
        <RenderRows rows={rows} />
      </InputContainer>
    </BridgeCollapse>
  );
}

export default Preview;
