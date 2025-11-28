// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import {
  Activity,
  BotFrameworkAdapter,
  ConversationReference,
  MessageFactory,
  TurnContext,
} from 'botbuilder';

export class BotService {
  private readonly adapter: BotFrameworkAdapter;

  constructor(adapter: BotFrameworkAdapter) {
    this.adapter = adapter;
  }

  public async onMessage(context: TurnContext): Promise<void> {
    // Echo the user's message
    const reply: Partial<Activity> = MessageFactory.text(`You said: ${context.activity.text}`);
    await context.sendActivity(reply);
  }

  public async onConversationUpdate(context: TurnContext): Promise<void> {
    // Greet the user when they join the conversation
    if (context.activity.membersAdded && context.activity.membersAdded.length > 0) {
      for (const member of context.activity.membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          const reply: Partial<Activity> = MessageFactory.text(`Hello, ${member.name}!`);
          await context.sendActivity(reply);
        }
      }
    }
  }
}
