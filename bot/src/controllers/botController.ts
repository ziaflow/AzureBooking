// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import * as express from 'express';
import { BotFrameworkAdapter, TurnContext } from 'botbuilder';
import { BotService } from '../services/botService';

export const botController = (adapter: BotFrameworkAdapter) => {
  const botService = new BotService(adapter);

  return async (req: express.Request, res: express.Response): Promise<void> => {
    // Process the incoming activity with the adapter
    await adapter.process(req, res, async (context: TurnContext) => {
      // Route the activity to the appropriate handler in the bot service
      if (context.activity.type === 'message') {
        await botService.onMessage(context);
      } else if (context.activity.type === 'conversationUpdate') {
        await botService.onConversationUpdate(context);
      }
    });
  };
};
