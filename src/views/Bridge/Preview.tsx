import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { PaymentOption } from '../../store/transfer';
import { RenderRows, RowsData } from '../../components/RenderRows';
import InputContainer from '../../components/InputContainer';
import { joinClass, OPACITY } from '../../utils/style';
import { Collapse } from '@mui/material';
import BridgeCollapse from './Collapse';

const useStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    borderRadius: '8px',
    boxShadow: theme.palette.card.elevation,
  },
  header: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: theme.palette.card.background + OPACITY[80],
    borderRadius: '8px',
    fontWeight: 'bold',
  },
  open: {
    borderBottomLeftRadius: '0 !important',
    borderBottomRightRadius: '0 !important',
  },
  disabled: {
    opacity: '70%',
    cursor: 'not-allowed !important',
  },
}));

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
  const { classes } = useStyles();
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
