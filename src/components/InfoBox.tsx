import React from 'react';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme) => ({
  summaryBox: {
    width: '100%',
    padding: '16px',
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.card.background,
  },
}));

type Props = {
  children: JSX.Element | JSX.Element[];
};

function InfoBox(props: Props) {
  const { classes } = useStyles();

  return <div className={classes.summaryBox}>{props.children}</div>;
}

export default InfoBox;
