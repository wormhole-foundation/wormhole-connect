import { makeStyles } from 'tss-react/mui';
import React, { useEffect } from 'react';
import { debounce } from '../utils';

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
  id?: string;
  min?: number;
  max?: number;
  step?: number;
  onChange: (
    e?:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onEnter?: React.MouseEventHandler<HTMLDivElement>;
  onPause?: (
    e?:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
};

function InputTransparent(props: Props) {
  const { classes } = useStyles({ align: props.align });

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && props.onEnter) {
      props.onEnter(e);
    }
  };

  useEffect(() => {
    if (props.onPause && props.id) {
      const input = document.getElementById(props.id);
      if (!input) return;
      input.addEventListener(
        'keyup',
        debounce(() => {
          props.onPause!();
        }, 1000),
      );
    }
  }, []);

  return (
    <input
      id={props.id}
      className={classes.input}
      placeholder={props.placeholder}
      type={props.type}
      min={props.min}
      max={props.max}
      step={props.step}
      onChange={props.onChange}
      onKeyDown={handleKeyDown}
    />
  );
}

export default InputTransparent;
