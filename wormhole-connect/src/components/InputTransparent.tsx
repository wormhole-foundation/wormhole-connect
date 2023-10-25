import { makeStyles } from 'tss-react/mui';
import React from 'react';

type StyleProps = {
  align?: 'center' | 'right';
};

const useStyles = makeStyles<StyleProps>()((_, { align }) => ({
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
  inputRef?: React.MutableRefObject<null>;
  onChange?: (
    e?:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  onEnter?: React.KeyboardEventHandler;
  disabled?: boolean;
  value?: string | number;
};

const NUMBER_FORMAT_REGEX = /^\d*\.?\d*$/;
const NUMBER_REPLACE_REGEX = /[^0-9.]/g;

function InputTransparent(props: Props) {
  const { classes } = useStyles({ align: props.align });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (props.type === 'number' && !NUMBER_FORMAT_REGEX.test(e.target.value)) {
      e.target.value = e.target.value.replace(NUMBER_REPLACE_REGEX, '');
    }

    if (props.onChange) {
      props.onChange(e);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && props.onEnter) {
      props.onEnter(e);
    }
  };

  return (
    <input
      ref={props.inputRef}
      id={props.id}
      className={classes.input}
      placeholder={props.placeholder}
      min={props.min}
      max={props.max}
      step={props.step}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      readOnly={props.disabled}
      value={props.value}
    />
  );
}

export default InputTransparent;
