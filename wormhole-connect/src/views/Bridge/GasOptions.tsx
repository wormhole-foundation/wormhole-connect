import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import { RootState } from '../../store';
import { CHAINS } from '../../config';
import { Route, setTransferRoute } from '../../store/transferInput';
import { NetworkConfig } from '../../config/types';
import { toFixedDecimals } from '../../utils/balance';
import { CHAIN_ID_SEI } from '@certusone/wormhole-sdk';

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

const manualOption = (
  source: NetworkConfig,
  dest: NetworkConfig,
  gasEst: {
    manual: string;
    automatic: string;
    claim: string;
  },
): OptionConfig => ({
  key: Route.BRIDGE,
  title: payWith(source.gasToken, dest.gasToken),
  subtitle: '(two transactions)',
  description: `Claim with ${dest.gasToken} on ${dest.displayName}`,
  estimate:
    gasEst.manual && gasEst.claim
      ? `${gasEst.manual} ${source.gasToken} & ${gasEst.claim} ${dest.gasToken}`
      : '—',
});

const automaticOption = (
  source: NetworkConfig,
  dest: NetworkConfig,
  token: string,
  relayerFee: number | undefined,
  gasEst: string,
): OptionConfig => {
  let estimateText = '-';

  let title = payWith(source.gasToken, token);

  if (gasEst && relayerFee !== undefined) {
    const isNative = token === source.gasToken;

    const fee = relayerFee + (isNative ? Number.parseFloat(gasEst) : 0);
    const feeStr = toFixedDecimals(fee.toString(), 6);

    if (isNative) {
      estimateText = `${feeStr} ${token}`;
    } else {
      // only add the fee if it's not zero (some times the relay could be subsidized)
      estimateText =
        fee > 0
          ? `${gasEst} ${source.gasToken} & ${feeStr} ${token}`
          : `${gasEst} ${source.gasToken}`;
      title = fee > 0 ? title : payWith(source.gasToken, source.gasToken);
    }
  }

  return {
    key: Route.RELAY,
    title,
    subtitle: '(one transaction)',
    description: `Gas fees on ${dest.displayName} will be paid automatically`,
    estimate: estimateText,
  };
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
  const manual = manualOption(source, dest, gasEst);

  // Sei only allows automatic payments through the translator contract for now
  // however, it does not follow the usual flow due to its different relayer contract
  // it uses a normal sendWithPayload and defines a custom payload structure
  if (dest.id === CHAIN_ID_SEI)
    return [
      {
        ...automaticOption(source, dest, token, relayerFee || 0, gasEst.manual),
        key: Route.BRIDGE,
      },
    ];
  if (!relayAvail) return [manual];
  return [
    automaticOption(source, dest, token, relayerFee, gasEst.automatic),
    manual,
  ];
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
      value={true}
      close={true}
    >
      <Options active={selectedOption}>
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
