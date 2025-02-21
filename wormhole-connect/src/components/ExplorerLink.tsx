import React from 'react';
import Link from '@mui/material/Link';
import ArrowOutwardIcon from '@mui/icons-material/ArrowOutward';
import { makeStyles } from 'tss-react/mui';

const useStyles = makeStyles()((theme) => ({
  addressLink: {
    display: 'inline-flex',
    alignItems: 'center',
    overflow: 'hidden',
    color: theme.palette.text.primary,
    opacity: 0.6,
  },
}));

interface ExplorerLinkProps {
  url: string;
  text: string;
}

const ExplorerLink: React.FC<ExplorerLinkProps> = ({ url, text }) => {
  const { classes } = useStyles();

  if (!(url && text)) return null;

  return (
    <Link
      onClick={(e) => e.stopPropagation()}
      className={classes.addressLink}
      href={url}
      rel="noreferrer noopener"
      target="_blank"
    >
      {text}
      <ArrowOutwardIcon
        sx={{
          height: '10px',
          width: '10px',
          marginLeft: '2px',
        }}
      />
    </Link>
  );
};

export default ExplorerLink;
