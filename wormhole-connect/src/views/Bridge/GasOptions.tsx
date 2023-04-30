import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import Options from '../../components/Options';
import BridgeCollapse from './Collapse';
import { setDestGasPayment } from '../../store/transfer';
import { RootState } from '../../store';
import { CHAINS } from '../../config';
import { PaymentOption } from '../../sdk';
import { NetworkConfig } from '../../config/types';
import { toFixedDecimals } from '../../utils/balance';

const useStyles = makeStyles()((theme) => ({
  option: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      gap: '16px',
    },
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
    [theme.breakpoints.down('sm')]: {
      textAlign: 'left',
    },
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

const payWith = (token1: string, token2: string): string => {
  if (!token1 || !token2) return '';
  if (token1 === token2) {
    return `Pay with ${token1}`;
  }
  return `Pay with ${token1} & ${token2}`;
};

type OptionConfig = {
  key: PaymentOption;
  title: string;
  subtitle: string;
  description: string;
  estimate: string;
};
const getOptions = (
  source: NetworkConfig,
  dest: NetworkConfig,
  token: string,
  relayAvail: boolean,
  relayerFee: number | undefined,
  gasEst: {
    manual: string;
    automatic: string;
    claim: string;
  },
): OptionConfig[] => {
  const manual = {
    key: PaymentOption.MANUAL,
    title: payWith(source.gasToken, dest.gasToken),
    subtitle: '(two transactions)',
    description: `Claim with ${dest.gasToken} on ${dest.displayName}`,
    estimate:
      gasEst.manual && gasEst.claim
        ? `${gasEst.manual} ${source.gasToken} & ${gasEst.claim} ${dest.gasToken}`
        : '—',
  };
  if (!relayAvail) return [manual];
  const automaticFees = toFixedDecimals(
    `${Number.parseFloat(gasEst.automatic) + relayerFee!}`,
    6,
  );
  const automatic = {
    key: PaymentOption.AUTOMATIC,
    title: payWith(source.gasToken, token),
    subtitle: '(one transaction)',
    description: `Gas fees on ${dest.displayName} will be paid automatically`,
    estimate:
      gasEst.automatic && relayerFee !== undefined
        ? `${automaticFees} ${token}`
        : '—',
  };
  return [automatic, manual];
};

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
  const {
    token,
    fromNetwork,
    toNetwork,
    automaticRelayAvail,
    gasEst,
    relayerFee,
  } = useSelector((state: RootState) => state.transfer);
  const active = selectedOption;

  // listen for selectOption
  document.addEventListener('selectOption', (event: Event) => {
    const { detail } = event as CustomEvent;
    dispatch(setDestGasPayment(detail as PaymentOption));
  });

  useEffect(() => {
    const sourceConfig = fromNetwork && CHAINS[fromNetwork];
    const destConfig = toNetwork && CHAINS[toNetwork];
    if (!token || !sourceConfig || !destConfig) return;

    const description =
      selectedOption === PaymentOption.AUTOMATIC
        ? payWith(sourceConfig.gasToken, token)
        : payWith(sourceConfig.gasToken, destConfig!.gasToken);
    setState({
      options: getOptions(
        sourceConfig,
        destConfig,
        token,
        automaticRelayAvail,
        relayerFee,
        gasEst,
      ),
      description,
    });
  }, [
    token,
    selectedOption,
    fromNetwork,
    toNetwork,
    gasEst,
    relayerFee,
    automaticRelayAvail,
  ]);

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
          const jsx = (
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
          return {
            key: option.key,
            child: jsx,
          };
        })}
      </Options>
    </BridgeCollapse>
  );
}

export default GasOptions;
