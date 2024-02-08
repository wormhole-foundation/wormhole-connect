import * as React from 'react';
import { makeStyles } from 'tss-react/mui';
import { joinClass } from 'utils/style';

const useStyles = makeStyles()((theme: any) => ({
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
  lineWarning: {
    borderColor: theme.palette.warning[400],
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
  warning?: boolean;
};

export default function StepperLabel(props: Props) {
  const { classes } = useStyles();
  const { index, activeStep, last, children, warning } = props;

  return (
    <div
      className={joinClass([
        classes.content,
        activeStep > index &&
          (warning ? classes.lineWarning : classes.lineActive),
        !!last && classes.lineNone,
      ])}
    >
      {activeStep >= index && children}
    </div>
  );
}
