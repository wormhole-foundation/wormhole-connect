import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ValidationErr } from '../../utils/transferValidation';
import AlertBanner from '../../components/AlertBanner';

type Props = {
  validations: ValidationErr[];
};

function ValidationError(props: Props) {
  const showErrors = useSelector((state: RootState) => state.transfer.validate);
  const validationErrors = props.validations.filter((v) => !!v) as string[];
  const showError = validationErrors.length > 0;

  return (
    <AlertBanner
      show={showErrors && showError}
      text={validationErrors[0]}
      error
    />
  );
}

export default ValidationError;
