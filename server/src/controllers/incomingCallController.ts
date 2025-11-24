// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import express from 'express';
import { CallAutomationClient, AnswerCallOptions } from '@azure/communication-call-automation';
import { getServerConfig } from '../utils/getConfig';
import { VV_SERVER_WEBSOCKET_URL } from '../constants';

export const incomingCallController = async (req: express.Request, res: express.Response) => {
  // Handle Event Grid Validation Handshake
  if (req.body && Array.isArray(req.body) && req.body[0].eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent') {
    const validationCode = req.body[0].data.validationCode;
    res.status(200).json({ validationResponse: validationCode });
    return;
  }

  // Handle Incoming Call Event
  if (req.body && Array.isArray(req.body) && req.body[0].eventType === 'Microsoft.Communication.IncomingCall') {
    const event = req.body[0];
    const incomingCallContext = event.data.incomingCallContext;
    const callerId = event.data.from.phoneNumber.value;

    console.log(`Incoming call from ${callerId}`);

    const config = getServerConfig();
    const client = new CallAutomationClient(config.communicationServicesConnectionString);

    const websocketUrl = process.env[VV_SERVER_WEBSOCKET_URL];
    if (!websocketUrl) {
        console.error('VV_SERVER_WEBSOCKET_URL is not set. Cannot answer call with media streaming.');
        res.status(500).send('Server configuration error');
        return;
    }

    // Construct the media streaming transport URL
    // Assuming the server is hosted at websocketUrl (e.g. wss://myapp.azurewebsites.net)
    // The path for media streaming will be /api/media-stream (to be configured in app.ts)
    // transportUrl must be wss format
    const transportUrl = `${websocketUrl}/api/media-stream`;
    const callbackUrl = `${process.env.VV_SERVER_HTTP_URL}/api/callAutomationEvent`;

    const answerCallOptions: AnswerCallOptions = {
      mediaStreamingOptions: {
        transportUrl: transportUrl,
        transportType: 'websocket',
        contentType: 'audio',
        audioChannelType: 'mixed',
      }
    };

    try {
      await client.answerCall(incomingCallContext, callbackUrl, answerCallOptions);
      console.log('Answered call with media streaming enabled');
      res.status(200).end();
    } catch (e) {
      console.error('Failed to answer call:', e);
      res.status(500).send('Failed to answer call');
    }
    return;
  }

  // Default response for other events
  res.status(200).end();
};
