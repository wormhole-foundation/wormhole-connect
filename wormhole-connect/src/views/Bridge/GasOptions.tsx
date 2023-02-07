import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import Options from '../../components/Options';
import BridgeCollapse from './Collapse';
import { PaymentOption, setDestGasPayment } from '../../store/transfer';
import { RootState } from '../../store';
import { CHAINS } from '../../sdk/config';
import { NetworkConfig } from '../../config/types';

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
  column: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
}));

type OptionConfig = {
  title: string;
  subtitle: string;
  description: string;
  estimate: string;
  active: PaymentOption;
};
const getOptions = (dest: NetworkConfig, token: string): OptionConfig[] => [
  {
    title: `Pay with ${token}`,
    subtitle: '(one transaction)',
    description: 'Gas fees will be paid automatically',
    estimate: `TODO ${token}`,
    active: PaymentOption.AUTOMATIC,
  },
  {
    title: `Pay with ${token} and ${dest.gasToken}`,
    subtitle: '(two transactions)',
    description: `Claim with ${dest.gasToken} on ${dest.displayName}`,
    estimate: `TODO ${token} & TODO ${dest.gasToken}`,
    active: PaymentOption.MANUAL,
  },
];

function GasOptions(props: { disabled: boolean }) {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const [state, setState] = React.useState({
    description: '',
    options: [] as OptionConfig[],
  });
  const selectedOption = useSelector(
    (state: RootState) => state.transfer.destGasPayment,
  );
  const token = useSelector((state: RootState) => state.transfer.token);
  const destination = useSelector(
    (state: RootState) => state.transfer.toNetwork,
  );
  const active =
    selectedOption && selectedOption === PaymentOption.AUTOMATIC ? 0 : 1;

  // listen for selectOption
  document.addEventListener('selectOption', (event: Event) => {
    const { detail } = event as CustomEvent;
    if (detail === 1) {
      dispatch(setDestGasPayment(PaymentOption.AUTOMATIC));
    } else {
      dispatch(setDestGasPayment(PaymentOption.MANUAL));
    }
  });

  useEffect(() => {
    const destConfig = destination && CHAINS[destination];
    if (token && destConfig) {
      const description =
        selectedOption === PaymentOption.AUTOMATIC
          ? `Pay with ${token}`
          : `Pay with ${token} & ${destConfig!.nativeToken}`;
      setState({ options: getOptions(destConfig, token), description });
    }
  }, [token, selectedOption, destination]);

  return (
    <BridgeCollapse
      title="Gas payment"
      description={state.description}
      banner={!props.disabled}
      disabled={props.disabled}
      close={props.disabled}
    >
      <Options active={active}>
        {state.options.map((option, i) => {
          return (
            <div className={classes.option} key={i}>
              <div className={classes.column}>
                <div>
                  <span className={classes.title}>{option.title}</span>
                  <span className={classes.subTitle}>{option.subtitle}</span>
                </div>
                <div className={classes.description}>{option.description}</div>
              </div>
              <div className={classes.column}>
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
