import React from 'react';
import { makeStyles } from 'tss-react/mui';

export type Alignment = 'center' | 'left' | 'right';

type StyleProps = { align: Alignment; fontSize: number };
const useStyles = makeStyles<StyleProps>()(
  (theme: any, { align, fontSize }) => ({
    title: {
      fontSize: `${fontSize}px`,
      width: '100%',
      textAlign: align,
      fontFamily: theme.palette.font.header,
      [theme.breakpoints.down('sm')]: {
        fontSize: '24px',
      },
    },
  }),
);

type Props = {
  text: string;
  align?: Alignment;
  size?: number;
};

function Header(props: Props) {
  const styleProps = {
    align: props.align || 'center',
    fontSize: props.size || 42,
  };
  const { classes } = useStyles(styleProps);
  return <div className={classes.title}>{props.text}</div>;
}

export default Header;
