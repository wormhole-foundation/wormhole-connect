import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { RootState } from 'store';
import { ValidationErr, setTransferRoute } from 'store/transferInput';
import { Route } from 'config/types';
import RouteOperator from 'routes/operator';
import AlertBanner from 'components/AlertBanner';
import { isPorticoRoute } from 'routes/porticoBridge/utils';

const useStyles = makeStyles()((theme) => ({
  minAmtError: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
  },
  link: {
    textDecoration: 'underline',
    opacity: '0.8',
    padding: '4px 0',
    cursor: 'pointer',
    '&:hover': {
      opacity: '1',
    },
  },
}));

type Props = {
  validations: ValidationErr[];
  margin?: string;
  forceShow?: boolean;
};

function ValidationError(props: Props) {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const showErrors = useSelector(
    (state: RootState) => state.transferInput.showValidationState,
  );
  const { route } = useSelector((state: RootState) => state.transferInput);
  const { toNativeToken, relayerFee } = useSelector(
    (state: RootState) => state.relay,
  );
  const portico = useSelector((state: RootState) => state.porticoBridge);
  const validationErrors = props.validations.filter((v) => !!v) as string[];
  const showError = validationErrors.length > 0;
  let content: React.ReactNode = validationErrors[0];

  const selectManual = () => {
    // TODO: Only change the enum
    if (route === Route.CCTPRelay || route === Route.CCTPManual) {
      dispatch(setTransferRoute(Route.CCTPManual));
    } else {
      dispatch(setTransferRoute(Route.Bridge));
    }
  };

  if (
    route &&
    validationErrors[0] &&
    validationErrors[0].includes('Minimum amount is')
  ) {
    const r = RouteOperator.getRoute(route);
    if (!isPorticoRoute(route)) {
      const min = r.getMinSendAmount({ toNativeToken, relayerFee });
      content = (
        <div className={classes.minAmtError}>
          <div>
            Minimum amount is {min} for single transaction automatic transfers.
          </div>
          <div className={classes.link} onClick={selectManual}>
            Switch to a manual claim transfer?
          </div>
        </div>
      );
    } else {
      const min = r.getMinSendAmount(portico);
      content = (
        <div className={classes.minAmtError}>
          <div>Minimum amount is {min}.</div>
        </div>
      );
    }
  }

  const show = (props.forceShow || showErrors) && showError;

  return (
    <AlertBanner show={show} content={content} error margin={props.margin} />
  );
}

export default ValidationError;
