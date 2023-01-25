import React from 'react';

function Spacer(props: { height?: number }) {
  return <div style={{ height: `${props.height || 24}px` }} />;
}

export default Spacer;
