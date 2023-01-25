import React from 'react';
import { useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';
import Slider, { SliderThumb } from '@mui/material/Slider';
import { styled } from '@mui/material/styles';
import BridgeCollapse from './Collapse';
import InputContainer from '../../components/InputContainer';
import { CHAINS, TOKENS } from '../../store/transfer';
import { TokenConfig } from '../../sdk/types';
import { RootState } from '../../store';

const useStyles = makeStyles()((theme) => ({
  amounts: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountDisplay: {
    display: 'flex',
    alignItems: 'center',
  },
  amountIcon: {
    width: '16px',
    height: '16px',
    marginRight: '8px',
  },
  sliderIcon: {
    width: '100%',
    height: '100%',
    padding: '6px',
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
  const tokenName = useSelector((state: RootState) => state.transfer.token);
  const destName = useSelector((state: RootState) => state.transfer.toNetwork);
  const destConfig = CHAINS[destName];
  const sendingToken = TOKENS[tokenName];
  const nativeGasToken = TOKENS[destConfig?.gasToken];
  // const disabled = !sendingToken || !nativeGasToken

  function Thumb(props: ThumbProps) {
    const { children, ...other } = props;
    const { classes } = useStyles();
    return (
      <SliderThumb {...other}>
        {children}
        <img
          className={classes.sliderIcon}
          src={nativeGasToken.icon}
          alt="slider"
        />
      </SliderThumb>
    );
  }

  return (
    <BridgeCollapse
      text="Native gas delivery"
      disabled={props.disabled}
      close={props.disabled}
    >
      <InputContainer
        styles={{
          borderTopRightRadius: '0px',
          borderTopLeftRadius: '0px',
          boxShadow: 'none',
        }}
      >
        <div>
          Your wallet has no native gas (FTM) balance on Fantom. Would you like
          to convert some of the MATIC you’re bridging to FTM?
        </div>
        <div>You will receive:</div>
        {sendingToken !== undefined && nativeGasToken !== undefined ? (
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
                <img
                  className={classes.amountIcon}
                  src={nativeGasToken.icon}
                  alt={nativeGasToken.symbol}
                />
                0.0045 {nativeGasToken.symbol}
              </div>
              <div className={classes.amountDisplay}>
                <img
                  className={classes.amountIcon}
                  src={(sendingToken as TokenConfig)!.icon}
                  alt={(sendingToken as TokenConfig)!.symbol}
                />
                0.0045 {(sendingToken as TokenConfig)!.symbol}
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
