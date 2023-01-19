import * as React from 'react';
import { Theme } from '@mui/material/styles';
import Check from '@mui/icons-material/Check';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme: Theme) => ({
  label: {
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    width: '32px',
    height: '32px',
    backgroundColor: theme.palette.primary[700],
    borderRadius: '50%',
    border: `1px solid ${theme.palette.primary[500]}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '16px',
    marginRight: '32px',
  },
  iconActive: {
    border: '1px solid #01BBAC !important',
  },
}));

function StepIcon(props: {
  index: number;
  active?: boolean;
  completed?: boolean;
}) {
  const { active, completed } = props;
  const classes = useStyles();

  if (completed) {
    return (
      <div className={`${classes.icon} ${classes.iconActive}`}>
        {/* TODO: add action color to theme */}
        <Check htmlColor="#01BBAC" />
      </div>
    );
  } else if (active) {
    return (
      <div className={`${classes.icon} ${classes.iconActive}`}>
        {props.index}
      </div>
    );
  }
  return <div className={classes.icon}>{props.index}</div>;
}

type Props = {
  index: number;
  activeStep: number;
  children: JSX.Element | JSX.Element[];
};

export default function StepperLabel(props: Props) {
  const classes = useStyles();
  const { index, activeStep, children } = props;

  return (
    <div className={classes.label}>
      <StepIcon
        index={index}
        active={index === activeStep}
        completed={index < activeStep}
      />
      {children}
    </div>
  );
}
