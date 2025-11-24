// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import express from 'express';
import { CommunicationIdentityClient } from '@azure/communication-identity';
import { RoomsClient } from '@azure/communication-rooms';
import { createRoom, getToken } from '../controllers/roomsController';

export const roomsRouter = (
  identityClient: CommunicationIdentityClient,
  roomsClient: RoomsClient,
  botAppId?: string,
  logicAppUrl?: string
): express.Router => {
  // Initialize router
  const router = express.Router();

  router.post('/', createRoom(identityClient, roomsClient, botAppId, logicAppUrl));
  router.post('/token', getToken(identityClient, roomsClient));

  return router;
};
