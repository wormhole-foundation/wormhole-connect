import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { RootState } from '../../store';
import { CHAINS } from '../../config';
import { Route, setTransferRoute } from '../../store/transferInput';
import { NetworkConfig } from '../../config/types';
import { toFixedDecimals } from '../../utils/balance';

import Options from '../../components/Options';
import BridgeCollapse, { XLabsBanner } from './Collapse';

const useStyles = makeStyles()((theme) => ({
  option: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      gap: '16px',
      alignItems: 'flex-start',
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
  key: Route;
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
    key: Route.BRIDGE,
    title: payWith(source.gasToken, dest.gasToken),
    subtitle: '(two transactions)',
    description: `Claim with ${dest.gasToken} on ${dest.displayName}`,
    estimate:
      gasEst.manual && gasEst.claim
        ? `${gasEst.manual} ${source.gasToken} & ${gasEst.claim} ${dest.gasToken}`
        : '—',
  };
  if (!relayAvail) return [manual];

  let estimateText = '-';

  if (gasEst.automatic && relayerFee !== undefined) {
    const isNative = token === source.gasToken;

    const fee = toFixedDecimals(
      `${relayerFee + (isNative ? Number.parseFloat(gasEst.automatic) : 0)}`,
      6,
    );
    estimateText = isNative
      ? `${fee} ${token}`
      : `${gasEst.automatic} ${source.gasToken} & ${fee} ${token}`;
  }

  const automatic = {
    key: Route.RELAY,
    title: payWith(source.gasToken, token),
    subtitle: '(one transaction)',
    description: `Gas fees on ${dest.displayName} will be paid automatically`,
    estimate: estimateText,
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
    (state: RootState) => state.transferInput.route,
  );
  const { token, fromNetwork, toNetwork, automaticRelayAvail, gasEst } =
    useSelector((state: RootState) => state.transferInput);
  const { relayerFee } = useSelector((state: RootState) => state.relay);
  const active = selectedOption;

  // listen for selectOption
  document.addEventListener('selectOption', (event: Event) => {
    const { detail } = event as CustomEvent;
    dispatch(setTransferRoute(detail as Route));
  });

  useEffect(() => {
    const sourceConfig = fromNetwork && CHAINS[fromNetwork];
    const destConfig = toNetwork && CHAINS[toNetwork];
    if (!token || !sourceConfig || !destConfig) return;

    const description =
      selectedOption === Route.RELAY
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

  const banner = automaticRelayAvail && !props.disabled && <XLabsBanner />;

  return (
    <BridgeCollapse
      title="Gas payment"
      description={state.description}
      banner={banner}
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
