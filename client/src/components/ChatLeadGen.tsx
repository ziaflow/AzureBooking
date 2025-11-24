// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { useState } from 'react';
import { Stack, TextField, PrimaryButton, Text, Spinner, ThemeProvider } from '@fluentui/react';
import { backgroundStyles } from '../styles/Common.styles';
import { Header } from '../Header';
import { createRoomAndRedirectUrl } from '../utils/CreateRoom';
import GenericContainer from './GenericContainer';
import { AppConfigModel } from '../models/ConfigModel';

const PARENT_ID = 'ChatSection';

interface ChatLeadGenProps {
  config: AppConfigModel;
}

export const ChatLeadGen = (props: ChatLeadGenProps): JSX.Element => {
  const { config } = props;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      // Saving to localStorage/sessionStorage for client-side use (e.g. Visit page name)
      sessionStorage.setItem('userDisplayName', name);
      sessionStorage.setItem('userEmail', email);
      sessionStorage.setItem('userPhone', phone);
      sessionStorage.setItem('initialMessage', message);

      // Create room (Bot will be added by server if configured) and send lead data
      const redirectUrl = await createRoomAndRedirectUrl({ name, email, phone, message });

      window.location.assign(redirectUrl);
    } catch (e) {
      setError((e as any).message || 'An error occurred while starting the chat.');
      setIsLoading(false);
    }
  };

  return (
    <ThemeProvider theme={config.theme} style={{ height: '100%' }}>
      <Stack styles={backgroundStyles(config.theme)}>
        <Header companyName={config.companyName} parentid={PARENT_ID} />
        <GenericContainer layerHostId={PARENT_ID} theme={config.theme}>
          <Stack
            tokens={{ childrenGap: 15 }}
            style={{ maxWidth: 400, margin: '0 auto', padding: 20, backgroundColor: 'white', borderRadius: 4 }}
          >
            <Text variant="xLarge">Chat with us</Text>
            <Text>Please enter your details to start chatting.</Text>

            <TextField label="Name" required value={name} onChange={(_, v) => setName(v || '')} />
            <TextField label="Email" required value={email} onChange={(_, v) => setEmail(v || '')} />
            <TextField label="Phone" value={phone} onChange={(_, v) => setPhone(v || '')} />
            <TextField
              label="How can we help?"
              multiline
              rows={3}
              value={message}
              onChange={(_, v) => setMessage(v || '')}
            />

            {error && <Text color="red">{error}</Text>}

            {isLoading ? (
              <Spinner label="Connecting..." />
            ) : (
              <PrimaryButton text="Start Chat" onClick={handleSubmit} disabled={!name || !email} />
            )}
          </Stack>
        </GenericContainer>
      </Stack>
    </ThemeProvider>
  );
};
