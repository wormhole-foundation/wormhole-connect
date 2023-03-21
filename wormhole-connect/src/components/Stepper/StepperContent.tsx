import * as React from 'react';
import { makeStyles } from 'tss-react/mui';
import { joinClass } from '../../utils/style';

const useStyles = makeStyles()((theme) => ({
  content: {
    marginLeft: '14px',
    minHeight: '40px',
    borderLeft: `1px solid ${theme.palette.primary[700]}`,
    padding: '8px 0 16px 32px',
    [theme.breakpoints.down('sm')]: {
      marginLeft: '0',
      borderLeft: 'none',
      paddingLeft: '0',
    },
  },
  lineActive: {
    borderColor: theme.palette.success[400],
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
  const { classes } = useStyles();
  const { index, activeStep, last, children } = props;

  return (
    <div
      className={joinClass([
        classes.content,
        activeStep > index && classes.lineActive,
        !!last && classes.lineNone,
      ])}
    >
      {activeStep >= index && children}
    </div>
  );
}
