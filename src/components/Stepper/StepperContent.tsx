import * as React from 'react';
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  content: {
    marginLeft: '14px',
    minHeight: '40px',
    borderLeft: `1px solid ${theme.palette.primary[700]}`,
    padding: '8px 0 16px 32px',
  },
  lineActive: {
    borderColor: '#01BBAC',
  },
  lineNone: {
    border: 'none !important',
  },
}));

type Props = {
  index: number;
  activeStep: number;
  last?: boolean;
  children: JSX.Element | JSX.Element[];
};

export default function StepperLabel(props: Props) {
  const classes = useStyles();
  const { index, activeStep, last, children } = props;

  return (
    <div
      className={`${classes.content} ${
        activeStep > index && classes.lineActive
      } ${last && classes.lineNone}`}
    >
      {index >= activeStep && children}
    </div>
  );
}
