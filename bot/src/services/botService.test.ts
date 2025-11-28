// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { BotFrameworkAdapter, TurnContext, Activity } from 'botbuilder';
import { BotService } from './botService';

describe('BotService', () => {
  let adapter: BotFrameworkAdapter;
  let botService: BotService;

  beforeEach(() => {
    adapter = new BotFrameworkAdapter({
      appId: 'test-app-id',
      appPassword: 'test-app-password',
    });
    botService = new BotService(adapter);
  });

  it('onMessage should send a reply', async () => {
    const context = createMockContext('message', 'hello');
    const sendActivitySpy = jest.spyOn(context, 'sendActivity').mockResolvedValue(undefined as any);

    await botService.onMessage(context);

    expect(sendActivitySpy).toHaveBeenCalledWith(expect.objectContaining({ text: 'You said: hello' }));
  });

  it('onConversationUpdate should send a welcome message', async () => {
    const context = createMockContext('conversationUpdate');
    context.activity.membersAdded = [{ id: 'user-id', name: 'Test User' }];
    const sendActivitySpy = jest.spyOn(context, 'sendActivity').mockResolvedValue(undefined as any);

    await botService.onConversationUpdate(context);

    expect(sendActivitySpy).toHaveBeenCalledWith(expect.objectContaining({ text: 'Hello, Test User!' }));
  });

  function createMockContext(type: string, text?: string): TurnContext {
    const activity: Partial<Activity> = {
      type,
      text,
      recipient: { id: 'bot-id', name: 'Bot' },
    };
    return new TurnContext(adapter, activity as Activity);
  }
});
