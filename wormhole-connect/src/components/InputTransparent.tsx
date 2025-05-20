import React, { useMemo } from 'react';

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
  testId?: string;
};

const NUMBER_FORMAT_REGEX = /^\d*\.?\d*$/;
const NUMBER_REPLACE_REGEX = /[^0-9.]/g;

function InputTransparent(props: Props) {
  const styles = useMemo(() => ({
    input: {
      width: '100%',
      border: 'none',
      backgroundImage: 'none',
      backgroundColor: 'transparent',
      fontSize: 'inherit',
      boxShadow: 'none',
      outline: 'none',
      flexGrow: 1,
      textAlign: props.align || 'left',
    } as React.CSSProperties,
  }), [props.align]);

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
      style={styles.input}
      placeholder={props.placeholder}
      min={props.min}
      max={props.max}
      step={props.step}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      readOnly={props.disabled}
      value={props.value}
      data-testid={props.testId}
    />
  );
}

export default InputTransparent;
