import React, { useMemo } from 'react';
import Link from '@mui/material/Link';
import { useTheme } from '@mui/material/styles';

interface ExplorerLinkProps {
  url: string;
  text: string;
}

const ExplorerLink: React.FC<ExplorerLinkProps> = ({ url, text }) => {
  const theme = useTheme();
  const styles = useMemo(
    () => ({
      addressLink: {
        display: 'inline-flex',
        alignItems: 'center',
        overflow: 'hidden',
        color: theme.palette.text.primary,
        opacity: 0.6,
      },
    }),
    [theme],
  );

  if (!(url && text)) return null;

  return (
    <Link
      onClick={(e) => e.stopPropagation()}
      sx={styles.addressLink}
      href={url}
      rel="noreferrer noopener"
      target="_blank"
    >
      {text}
    </Link>
  );
};

export default ExplorerLink;
