import React from 'react';
import { useSelector } from 'react-redux';

import { RootState } from 'store';
import { ValidationErr } from 'store/transferInput';
import AlertBanner from 'components/AlertBanner';

type Props = {
  validations: ValidationErr[];
  margin?: string;
  forceShow?: boolean;
};

function ValidationError(props: Props) {
  const showErrors = useSelector(
    (state: RootState) => state.transferInput.showValidationState,
  );
  const validationErrors = props.validations.filter((v) => !!v) as string[];
  const showError = validationErrors.length > 0;
  const content: React.ReactNode = validationErrors[0];

  const show = (props.forceShow || showErrors) && showError;

  return (
    <AlertBanner show={show} content={content} error margin={props.margin} />
  );
}

export default ValidationError;
