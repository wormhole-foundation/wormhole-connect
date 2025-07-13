import React from 'react';
import config from 'config';
import PageHeader from 'components/PageHeader';
import { Alignment } from 'components/Header';

const ConfigurablePageHeader = () => {
  const defaults: { text: string; align: Alignment } = {
    text: '',
    align: 'left',
  };

  const headerConfig =
    typeof config.ui.pageHeader === 'string'
      ? { ...defaults, text: config.ui.pageHeader }
      : { ...defaults, ...config.ui.pageHeader };

  return <PageHeader title={headerConfig.text} align={headerConfig.align} />;
};

export default ConfigurablePageHeader;
