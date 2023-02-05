import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import Slider, { SliderThumb } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import BridgeCollapse from './Collapse';
import InputContainer from '../../components/InputContainer';
import { CHAINS, TOKENS } from '../../sdk/config';
import { calculateMaxSwapAmount } from '../../sdk/sdk';
import { TokenConfig } from '../../config/types';
import { RootState } from '../../store';
import TokenIcon from '../../icons/components/TokenIcons';
import { BigNumber } from 'ethers';
import { toDecimals } from '../../utils/balance';
import { setMaxSwapAmt } from '../../store/transfer';

const useStyles = makeStyles()((theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    width: '100%',
  },
  amounts: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
}));

type SliderProps = {
  color1: string;
  color2: string;
};

const PrettoSlider = styled(Slider)<SliderProps>(({ color1, color2 }) => ({
  color: color1,
  height: 8,
  '& .MuiSlider-rail': {
    height: '4px',
    backgroundColor: color2,
  },
  '& .MuiSlider-track': {
    height: '6px',
  },
  '& .MuiSlider-thumb': {
    height: 28,
    width: 28,
    backgroundColor: '#fff',
  },
}));

interface ThumbProps extends React.HTMLAttributes<unknown> {}

function GasSlider(props: { disabled: boolean }) {
  const { classes } = useStyles();
  const { token, toNetwork } = useSelector((state: RootState) => state.transfer);
  const destConfig = CHAINS[toNetwork!];
  const sendingToken = TOKENS[token];
  const nativeGasToken = TOKENS[destConfig?.gasToken!];

  useEffect(() => {
    if (!toNetwork || !sendingToken) return;
    if (sendingToken.tokenId) {
      calculateMaxSwapAmount(toNetwork, sendingToken.tokenId).then((res: BigNumber) => {
        const amt = toDecimals(res, sendingToken.decimals, 6);
        setMaxSwapAmt(Number.parseFloat(amt));
      });
    } else {
      if (!sendingToken.wrappedAsset) throw new Error('could not get wrapped asset for native token')
      const wrappedAsset = TOKENS[sendingToken.wrappedAsset];
      calculateMaxSwapAmount(toNetwork, wrappedAsset.tokenId!).then((res: BigNumber) => {
        const amt = toDecimals(res, sendingToken.decimals, 6);
        setMaxSwapAmt(Number.parseFloat(amt));
      });
    }
  }, [sendingToken, toNetwork])

  function Thumb(props: ThumbProps) {
    const { children, ...other } = props;
    return (
      <SliderThumb {...other}>
        {children}
        <TokenIcon name={nativeGasToken.icon} height={16} />
      </SliderThumb>
    );
  }

  return (
    <BridgeCollapse
      title="Extra native gas"
      banner={!props.disabled}
      disabled={props.disabled}
      close={props.disabled}
    >
      <InputContainer
        styles={{
          width: '100%',
          borderTopRightRadius: '0px',
          borderTopLeftRadius: '0px',
          boxShadow: 'none',
        }}
      >
        {sendingToken !== undefined &&
        nativeGasToken !== undefined &&
        destConfig !== undefined ? (
          <div className={classes.container}>
            <div>
              Your wallet has no native gas ({nativeGasToken.symbol}) balance on{' '}
              {destConfig?.displayName}. Would you like to convert some of the{' '}
              {sendingToken.symbol} you’re bridging to {nativeGasToken.symbol}?
            </div>
            <div>You will receive:</div>
            <div>
              <PrettoSlider
                slots={{ thumb: Thumb }}
                aria-label="Native gas conversion amount"
                defaultValue={0.5}
                color1={nativeGasToken.color}
                color2={sendingToken.color}
              />
              <div className={classes.amounts}>
                <div className={classes.amountDisplay}>
                  <TokenIcon name={nativeGasToken.icon} height={16} />
                  0.0045 {nativeGasToken.symbol}
                </div>
                <div className={classes.amountDisplay}>
                  <TokenIcon
                    name={(sendingToken as TokenConfig)!.icon}
                    height={16}
                  />
                  0.0045 {(sendingToken as TokenConfig)!.symbol}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div></div>
        )}
      </InputContainer>
    </BridgeCollapse>
  );
}

export default GasSlider;
