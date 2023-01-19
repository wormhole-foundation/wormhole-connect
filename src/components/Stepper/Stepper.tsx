import * as React from 'react';
import Stack from '@mui/material/Stack';
import StepperContent from './StepperContent';
import StepperLabel from './StepperLabel';

type Step = {
  label: string;
  component: JSX.Element | JSX.Element[];
};

type Props = {
  steps: Step[];
  activeStep: number;
};

export default function Stepper(props: Props) {
  const { steps, activeStep } = props;

  return (
    <Stack sx={{ width: '100%' }}>
      {steps.map((step, index) => (
        <div>
          <StepperLabel index={index + 1} activeStep={activeStep}>
            <div>{step.label}</div>
          </StepperLabel>
          <StepperContent
            index={index + 1}
            activeStep={activeStep}
            last={index + 1 === steps.length}
          >
            {step.component}
          </StepperContent>
        </div>
      ))}
    </Stack>
  );
}
