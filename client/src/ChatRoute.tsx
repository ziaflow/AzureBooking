// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChatLeadGen } from './components/ChatLeadGen';
import { initializeIcons } from '@fluentui/react/lib/Icons';
import { fetchConfig } from './utils/FetchConfig';

initializeIcons();

const domNode = document.getElementById('root');
if (!domNode) {
  throw new Error('Failed to find the root element');
}

const render = async () => {
  try {
    const config = await fetchConfig();
    createRoot(domNode).render(
      <React.StrictMode>{config ? <ChatLeadGen config={config} /> : <div>Loading config...</div>}</React.StrictMode>
    );
  } catch (e) {
    console.error('Failed to load config', e);
  }
};

render();
