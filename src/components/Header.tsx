import React from 'react';
import { makeStyles } from 'tss-react/mui';

type Alignment = 'center' | 'left' | 'right';

type StyleProps = { align: Alignment };
const useStyles = makeStyles<StyleProps>()((theme, { align }) => ({
  title: {
    fontSize: '32px',
    width: '100%',
    textAlign: align,
  },
}));

function Header(props: { text: string; align?: Alignment }) {
  const styleProps = {
    align: props.align || 'center',
  };
  const { classes } = useStyles(styleProps);
  return <div className={classes.title}>{props.text}</div>;
}

export default Header;
