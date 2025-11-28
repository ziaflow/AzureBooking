// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { BotFrameworkAdapter, TurnContext } from 'botbuilder';
import { botController } from './botController';
import { BotService } from '../services/botService';

jest.mock('botbuilder');
jest.mock('../services/botService');

describe('botController', () => {
  let adapter: jest.Mocked<BotFrameworkAdapter>;
  let botService: jest.Mocked<BotService>;
  let processCallback: (context: TurnContext) => Promise<void>;

  beforeEach(() => {
    adapter = new BotFrameworkAdapter({
      appId: 'test-app-id',
      appPassword: 'test-app-password',
    }) as jest.Mocked<BotFrameworkAdapter>;

    adapter.process = jest.fn().mockImplementation(async (req, res, callback) => {
      processCallback = callback;
    });

    botService = new BotService(adapter) as jest.Mocked<BotService>;
    (BotService as jest.Mock).mockImplementation(() => botService);
  });

  it('should call onMessage for message activities', async () => {
    const onMessageSpy = jest.spyOn(botService, 'onMessage');
    const req: any = { body: {} };
    const res: any = {};

    const controller = botController(adapter);
    await controller(req, res);

    const messageContext = { activity: { type: 'message' } } as TurnContext;
    await processCallback(messageContext);

    expect(onMessageSpy).toHaveBeenCalledWith(messageContext);
  });

  it('should call onConversationUpdate for conversationUpdate activities', async () => {
    const onConversationUpdateSpy = jest.spyOn(botService, 'onConversationUpdate');
    const req: any = { body: {} };
    const res: any = {};

    const controller = botController(adapter);
    await controller(req, res);

    const conversationUpdateContext = { activity: { type: 'conversationUpdate' } } as TurnContext;
    await processCallback(conversationUpdateContext);

    expect(onConversationUpdateSpy).toHaveBeenCalledWith(conversationUpdateContext);
  });
});
