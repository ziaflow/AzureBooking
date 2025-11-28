// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as express from 'express';
import { CommunicationIdentityClient, TokenScope } from '@azure/communication-identity';
import { ChatClient } from '@azure/communication-chat';
import { ServerConfigModel } from '../models/configModel';

export const tokenController = (
  identityClient: CommunicationIdentityClient,
  chatClient: ChatClient,
  config: ServerConfigModel
) => {
  return async (_req: express.Request, res: express.Response, next: express.NextFunction): Promise<void> => {
    try {
      const scopes: TokenScope[] = config.chatEnabled ? ['chat', 'voip'] : ['voip'];
      const userAndToken = await identityClient.createUserAndToken(scopes);

      let threadId: string | undefined = undefined;
      if (config.chatEnabled && config.botAppId) {
        const createChatThreadResult = await chatClient.createChatThread({
          topic: 'Virtual Appointment',
          participants: [{ id: userAndToken.user }, { id: { communicationUserId: config.botAppId } }]
        });
        threadId = createChatThreadResult.chatThread?.id;
      }

      res.status(200).json({ ...userAndToken, threadId });
    } catch (error) {
      return next(error);
    }
  };
};
