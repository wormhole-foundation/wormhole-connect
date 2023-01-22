import { makeStyles } from 'tss-react/mui';
import React from 'react';

type StyleProps = {
  align?: 'center' | 'right';
};

const useStyles = makeStyles<StyleProps>()((theme, { align }) => ({
  input: {
    width: '100%',
    border: 'none',
    backgroundImage: 'none',
    backgroundColor: 'transparent',
    background: 'transparent',
    fontSize: 'inherit',
    boxShadow: 'none',
    webkitBoxShadow: 'none',
    moxBoxShadow: 'none',
    outline: 'none',
    flexGrow: '1',
    textAlign: align || 'left',
  },
}));

type Props = {
  placeholder?: string;
  type?: 'string' | 'number';
  align?: 'center' | 'right';
  onChange?: (
    e?:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
};

function InputTransparent(props: Props) {
  const { classes } = useStyles({ align: props.align });
  return (
    <input
      className={classes.input}
      placeholder={props.placeholder}
      type={props.type}
      onChange={props.onChange}
    />
  );
}

export default InputTransparent;
