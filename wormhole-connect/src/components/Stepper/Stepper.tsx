import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Stack from '@mui/material/Stack';
import StepperContent from './StepperContent';
import StepperLabel from './StepperLabel';

type Step = {
  label: string;
  component: JSX.Element | JSX.Element[];
  warningLabel?: boolean;
  warningLine?: boolean;
};

type Props = {
  steps: Step[];
  activeStep: number;
};

export default function Stepper(props: Props) {
  const { steps, activeStep } = props;
  const theme = useTheme();

  return (
    <Stack sx={{ width: '100%' }}>
      {steps.map((step, index) => (
        <div key={index}>
          <StepperLabel
            index={index + 1}
            activeStep={activeStep}
            filled={theme.palette.mode === 'light'}
            warning={step.warningLabel}
          >
            <div>{step.label}</div>
          </StepperLabel>
          <StepperContent
            index={index + 1}
            activeStep={activeStep}
            last={index + 1 === steps.length}
            warning={step.warningLine}
          >
            {step.component}
          </StepperContent>
        </div>
      ))}
    </Stack>
  );
}
