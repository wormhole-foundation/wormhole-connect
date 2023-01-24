import React from 'react';
import { styled } from '@mui/material/styles';
import { makeStyles } from 'tss-react/mui';
import { LinearProgress, linearProgressClasses } from '@mui/material';

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  // height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.card.secondary,
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: theme.palette.success[300],
  },
}));

const useStyles = makeStyles()((theme) => ({
  confirmations: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '16px',
  },
  confirmationsText: {
    textAlign: 'center',
  },
}));

type Props = {
  confirmations: number;
  total: number;
};

function Confirmations(props: Props) {
  const { classes } = useStyles();
  const { confirmations, total } = props;
  const percentage = Math.floor((confirmations / total) * 100);
  return (
    <div className={classes.confirmations}>
      <BorderLinearProgress
        variant="determinate"
        value={percentage}
        color="secondary"
      />
      <div className={classes.confirmationsText}>
        {confirmations} / {total} Confirmations
      </div>
    </div>
  );
}

export default Confirmations;
