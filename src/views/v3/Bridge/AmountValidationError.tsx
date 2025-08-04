import React from 'react';
import AlertBannerV3 from 'components/v3/AlertBanner';

import type { AmountValidationResult } from 'hooks/useAmountValidation';

type Props = {
  validation: AmountValidationResult;
};

const AmountValidationError = ({ validation }: Props) => {
  const message = validation.error || validation.warning || validation.info;

  if (!message) {
    return null;
  }

  return (
    <AlertBannerV3 error={!!validation.error} warning={!!validation.warning}>
      {message}
    </AlertBannerV3>
  );
};

export default React.memo(AmountValidationError);
