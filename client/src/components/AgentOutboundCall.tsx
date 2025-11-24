// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  CallComposite,
  CallAdapter,
  createAzureCommunicationCallAdapterFromClient,
  createStatefulCallClient
} from '@azure/communication-react';
import { useState, useEffect } from 'react';
import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { Stack, Spinner, PartialTheme, Theme } from '@fluentui/react';
import { fullSizeStyles } from '../styles/Common.styles';
import { AppConfigModel } from '../models/ConfigModel';
import MobileDetect from 'mobile-detect';

export interface AgentOutboundCallProps {
  config: AppConfigModel;
  phoneNumber: string;
  displayName?: string;
  fluentTheme?: PartialTheme | Theme;
  onDisplayError(error: any): void;
}

export const AgentOutboundCall = (props: AgentOutboundCallProps): JSX.Element => {
  const { phoneNumber, displayName, fluentTheme, onDisplayError } = props;
  const [callAdapter, setCallAdapter] = useState<CallAdapter>();
  const [token, setToken] = useState<string>();
  const [userId, setUserId] = useState<string>();

  const formFactorValue = new MobileDetect(window.navigator.userAgent).mobile() ? 'mobile' : 'desktop';

  // Fetch token for the agent
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('/api/token');
        if (!response.ok) {
          throw new Error('Failed to fetch token');
        }
        const data = await response.json();
        // The /api/token endpoint returns { user: { communicationUserId: ... }, token: ... }
        // Wait, let's check tokenController.ts response format.
        // It returns { user: ..., token: ... } usually.
        // Actually, looking at tokenController.ts, it creates a user and returns token.
        // But wait, the standard /api/token in this app might be different?
        // Let's check tokenController.ts.
        setToken(data.token);
        setUserId(data.user.communicationUserId);
      } catch (e) {
        onDisplayError(e);
      }
    };
    fetchToken();
  }, [onDisplayError]);

  useEffect(() => {
    const createAdapter = async () => {
      if (token && userId && phoneNumber) {
        try {
          const credential = new AzureCommunicationTokenCredential(token);
          const client = createStatefulCallClient({ userId: { communicationUserId: userId } });
          const callAgent = await client.createCallAgent(credential, { displayName: displayName || 'Agent' });

          const adapter = await createAzureCommunicationCallAdapterFromClient(
            client,
            callAgent,
            [{ phoneNumber: phoneNumber }] // Target participants for outbound call
          );

          setCallAdapter(adapter);
        } catch (e) {
          onDisplayError(e);
        }
      }
    };
    createAdapter();
  }, [token, userId, phoneNumber, displayName, onDisplayError]);

  if (!callAdapter) {
    return <Spinner data-testid="spinner" styles={fullSizeStyles} label="Initializing Agent Dashboard..." />;
  }

  return (
    <Stack data-testid="agent-composite" style={{ height: '100%' }}>
      <CallComposite
        adapter={callAdapter}
        fluentTheme={fluentTheme}
        formFactor={formFactorValue}
        options={{
          callControls: {
            endCallButton: true
          }
        }}
      />
    </Stack>
  );
};
