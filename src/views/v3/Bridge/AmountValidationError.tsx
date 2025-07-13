import React, { useMemo } from 'react';
import { useTheme } from '@mui/material';
import AlertBannerV3 from 'components/v3/AlertBanner';

type ValidationResult = {
  error?: string;
  warning?: string;
};

type Props = {
  validation: ValidationResult;
};

const AmountValidationError = ({ validation }: Props) => {
  const theme = useTheme();

  const validationAlert = useMemo(() => {
    const hasError = !!validation.error;
    const hasWarning = !!validation.warning;
    const message = validation.error || validation.warning;

    if (!hasError && !hasWarning) {
      return null;
    }

    return (
      <AlertBannerV3
        warning={hasWarning}
        error={hasError}
        color={
          validation.error
            ? theme.palette.error.main
            : theme.palette.warning.main
        }
      >
        {message}
      </AlertBannerV3>
    );
  }, [
    validation.error,
    validation.warning,
    theme.palette.error.main,
    theme.palette.warning.main,
  ]);

  return validationAlert;
};

export default React.memo(AmountValidationError);
