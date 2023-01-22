import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import Options from '../../components/Options';
import BridgeCollapse from './Collapse';
import { PaymentOption, setDestGasPayment } from '../../store/transfer';
import { RootState } from '../../store';

const useStyles = makeStyles()((theme) => ({
  option: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginRight: '8px',
  },
  subTitle: {
    fontSize: '14px',
    opacity: '80%',
  },
  description: {
    fontSize: '12px',
    opacity: '80%',
  },
  estimateHeader: {
    fontSize: '12px',
    opacity: '80%',
    textAlign: 'right',
  },
  estimate: {
    fontSize: '14px',
    textAlign: 'right',
  },
}));

const options = [
  {
    title: 'Pay with MATIC',
    subtitle: '(one transaction)',
    description: 'Gas fees will be paid automatically',
    estimate: '0.75 FTM',
    active: PaymentOption.AUTOMATIC,
  },
  {
    title: 'Pay with MATIC and FTM',
    subtitle: '(two transactions)',
    description: 'Claim with FTM on Fantom',
    estimate: '0.05 MATIC & 0.5 FTM',
    active: PaymentOption.MANUAL,
  },
];

function GasOptions() {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const selectedOption = useSelector(
    (state: RootState) => state.transfer.destGasPayment,
  );
  const active =
    selectedOption && selectedOption === PaymentOption.AUTOMATIC ? 0 : 1;
  // listen for selectOption
  document.addEventListener('selectOption', (event: Event) => {
    const { detail } = event as CustomEvent;
    // setFromNetworkStore(detail);
    if (detail === 1) {
      dispatch(setDestGasPayment(PaymentOption.AUTOMATIC));
    } else {
      dispatch(setDestGasPayment(PaymentOption.MANUAL));
    }
  });

  return (
    <BridgeCollapse text="Gas payment options - Pay with MATIC">
      <Options active={active}>
        {options.map((option, i) => {
          return (
            <div className={classes.option} key={i}>
              <div>
                <div>
                  <span className={classes.title}>{option.title}</span>
                  <span className={classes.subTitle}>{option.subtitle}</span>
                </div>
                <div className={classes.description}>{option.description}</div>
              </div>
              <div>
                <div className={classes.estimateHeader}>Current estimate</div>
                <div className={classes.estimate}>{option.estimate}</div>
              </div>
            </div>
          );
        })}
      </Options>
    </BridgeCollapse>
  );
}

export default GasOptions;
