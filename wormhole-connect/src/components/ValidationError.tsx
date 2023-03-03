import React from 'react';
import { Validation } from '../utils/transferValidation';
import AlertBanner from './AlertBanner';

type Props = {
  validations: (Validation | undefined)[]
};

function ValidationError(props: Props) {
  const validationErrors = props.validations.filter(v => v !== undefined && !v[0]) as Validation[];
  const showError = validationErrors.length > 0;

  return (
    <AlertBanner show={showError} text={validationErrors[0] && validationErrors[0][1]} error />
  );
}

export default ValidationError;
