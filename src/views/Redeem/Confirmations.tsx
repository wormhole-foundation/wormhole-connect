import React from 'react';
import { makeStyles } from 'tss-react/mui';
import { LinearProgress } from '@mui/material';
import { COL_CENTER } from '../../utils/style';

const useStyles = makeStyles()((theme) => ({
  confirmations: {
    ...COL_CENTER,
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
  const percentage = Math.floor(confirmations / total);
  return (
    <div className={classes.confirmations}>
      <LinearProgress variant="determinate" value={percentage} />
      <div className={classes.confirmationsText}>
        {confirmations} / {total} Confirmations
      </div>
    </div>
  );
}

export default Confirmations;
