import React, { useState } from 'react';
import { makeStyles } from 'tss-react/mui';
import Dropdown from '../components/Dropdown';
import PageHeader from '../components/PageHeader';

const useStyles = makeStyles()((theme) => ({
  container: {
    width: '100%',
    maxWidth: '700px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '20px',
  },
  faqs: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    width: '100%',
  }
}));

const FAQs = [{
  title: "Some FAQ",
  content: <>Some content</>,
}, {
  title: "Some FAQ",
  content: <>Some content</>,
}, {
  title: "Some FAQ",
  content: <>Some content</>,
}, {
  title: "Some FAQ",
  content: <>Some content</>,
}, {
  title: "Some FAQ",
  content: <>Some content</>,
}]

function FAQ() {
  const { classes } = useStyles();
  const [selected, setSelected] = useState(undefined as number | undefined);

  const toggle = (key: number) => {
    if (key === selected) {
      setSelected(undefined);
    } else {
      setSelected(key);
    }
  }

  return (
    <div className={classes.container}>
      <PageHeader title="FAQ" description='This page collects and answers the most commonly asked questions.' back />

      <div className={classes.faqs}>
        {FAQs.map((faq, i) => {
          const id = i + 1;
          return (
            <Dropdown
              key={id}
              title={faq.title}
              open={!!selected && selected === id}
              onToggle={() => toggle(id)}
            >{faq.content}</Dropdown>
          )
        })}
      </div>
    </div>
  );
}

export default FAQ;
