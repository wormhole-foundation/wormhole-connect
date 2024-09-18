import React from 'react';
import { useDispatch /*, useSelector*/ } from 'react-redux';

import config from 'config';
import { setRoute } from 'store/router';

import Button from 'components/Button';
import InputContainer from 'components/InputContainer';
import Spacer from 'components/Spacer';
import AddToWallet from './AddToWallet';
//import { RootState } from 'store';
//import PorticoSwapFailed from './PorticoSwapFailed';
//import { isPorticoTransferDestInfo } from 'routes/porticoBridge/utils';
//import { useTheme } from '@mui/material/styles';
//import { OPACITY } from 'utils/style';

function BridgeComplete() {
  const dispatch = useDispatch();
  /*
  const transferDestInfo = useSelector(
    (state: RootState) => state.redeem.transferDestInfo,
  );
   */
  //const theme: any = useTheme();
  const toLink = () => {
    if (typeof window !== 'undefined') {
      window.location.href = config.ui.cta!.link;
    }
  };
  const toBridge = () => {
    dispatch(setRoute('bridge'));
  };

  const containerBg: string | undefined = undefined;
  const component: React.JSX.Element = (
    <div data-testid="transaction-complete-message">
      The bridge is now complete.
    </div>
  );
  /*
  if (
    isPorticoTransferDestInfo(transferDestInfo) &&
    transferDestInfo.destTxInfo.swapFailed
  ) {
    containerBg = theme.palette.warning[500] + OPACITY[25];
    component = <PorticoSwapFailed info={transferDestInfo.destTxInfo} />;
  }
   */

  return (
    <div>
      <InputContainer bg={containerBg}>
        <>
          {component}
          {!!config.ui.cta && (
            <div>Click the button below to begin using your new assets.</div>
          )}
          <AddToWallet />
        </>
      </InputContainer>
      <Spacer />
      {config.ui.cta ? (
        <Button onClick={toLink} action elevated>
          {config.ui.cta.text}
        </Button>
      ) : (
        <Button onClick={toBridge} action elevated>
          Bridge more assets
        </Button>
      )}
    </div>
  );
}

export default BridgeComplete;
