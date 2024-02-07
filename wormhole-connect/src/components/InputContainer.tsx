import React from 'react';
import { joinClass } from 'utils/style';
import { makeStyles } from 'tss-react/mui';

type StyleProps = { bg?: string };
const useStyles = makeStyles<StyleProps>()((theme: any, { bg }) => ({
  input: {
    width: '100%',
    padding: theme.spacing(1.5),
    borderRadius: '8px',
    backgroundColor: bg || theme.palette.card.background,
    boxShadow: theme.palette.card.elevation,
  },
  border: {
    borderRadius: '0px !important',
    border: `1px solid ${theme.palette.divider}`,
  },
}));

type Props = {
  bg?: string;
  border?: boolean;
  children: JSX.Element | JSX.Element[];
  styles?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
};

function InputContainer(props: Props) {
  const { classes } = useStyles({ bg: props.bg });
  return (
    <div
      className={joinClass([classes.input, !!props.border && classes.border])}
      onClick={props.onClick}
      style={{
        ...props.styles,
        cursor: props.onClick ? 'pointer' : 'default',
      }}
    >
      {props.children}
    </div>
  );
}

export default InputContainer;
