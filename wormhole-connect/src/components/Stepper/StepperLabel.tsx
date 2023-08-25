import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import Check from '@mui/icons-material/Check';
import { joinClass, OPACITY } from '../../utils/style';

const useStyles = makeStyles()((theme: any) => ({
  label: {
    display: 'flex',
    alignItems: 'center',
  },
  textInactive: {
    color: `${theme.palette.text.primary}${OPACITY[30]} !important`,
  },
  icon: {
    width: '32px',
    height: '32px',
    backgroundColor: theme.palette.card.background,
    borderRadius: '50%',
    border: `1px solid ${theme.palette.primary[500]}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '16px',
    marginRight: '32px',
    [theme.breakpoints.down('sm')]: {
      margin: '0 8px 0 16px',
    },
  },
  filled: {
    backgroundColor: `${theme.palette.success[400]} !important`,
  },
  iconActive: {
    border: `1px solid ${theme.palette.success[400]} !important`,
  },
}));

function StepIcon(props: {
  index: number;
  active?: boolean;
  filled?: boolean;
  completed?: boolean;
}) {
  const { active, completed, filled } = props;
  const { classes } = useStyles();
  const theme = useTheme();

  if (completed) {
    return (
      <div
        className={joinClass([
          classes.icon,
          classes.iconActive,
          !!filled && classes.filled,
        ])}
      >
        <Check htmlColor={filled ? '#fff' : theme.palette.success[500]} />
      </div>
    );
  } else if (active) {
    return (
      <div className={joinClass([classes.icon, classes.iconActive])}>
        {props.index}
      </div>
    );
  }
  return <div className={classes.icon}>{props.index}</div>;
}

type Props = {
  index: number;
  activeStep: number;
  filled?: boolean;
  children: JSX.Element | JSX.Element[];
};

export default function StepperLabel(props: Props) {
  const { classes } = useStyles();
  const { index, activeStep, filled, children } = props;

  return (
    <div
      className={joinClass([
        classes.label,
        index > activeStep && classes.textInactive,
      ])}
    >
      <StepIcon
        index={index}
        active={index === activeStep}
        completed={index < activeStep}
        filled={filled}
      />
      {children}
    </div>
  );
}
