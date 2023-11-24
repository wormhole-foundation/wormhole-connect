import React from 'react';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme: any) => ({
  link: {
    color: theme.palette.text.primary,
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  root: {
    display: 'flex',
    gap: '8px',
    marginTop: theme.spacing(1),
  },
  warningIcon: {
    color: theme.palette.warning[500],
  },
}));

const PorticoSwapFailed = ({
  info: { message, swapUrl, swapUrlText },
}: {
  info: { message: string; swapUrl: string; swapUrlText: string };
}) => {
  const { classes } = useStyles();
  return (
    <div className={classes.root}>
      <div>
        {message}{' '}
        <a
          href={swapUrl}
          target="_blank"
          rel="noreferrer"
          className={classes.link}
        >
          {swapUrlText}
        </a>
      </div>
    </div>
  );
};

export default PorticoSwapFailed;
