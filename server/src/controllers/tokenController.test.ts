// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { CommunicationIdentityClient } from '@azure/communication-identity';
import { getDefaultConfig } from '../utils/getDefaultConfig';
import { tokenController } from './tokenController';
import { NextFunction } from 'express';
import { ServerConfigModel } from '../models/configModel';

function createMockedResponseObject(): any {
  const res: any = {};
  res.status = (status) => {
    res.lastStatus = status;
    return res;
  };
  res.json = (json) => {
    res.lastJson = json;
    return res;
  };
  return res;
}

import { ChatClient } from '@azure/communication-chat';

describe('tokenController', () => {
  const cfg = getDefaultConfig() as ServerConfigModel;
  const mockUser = { communicationUserId: 'test' };
  const mockIdentityClient = {
    createUserAndToken: jest.fn().mockImplementation(async (scopes) => {
      requestedScopes = scopes;
      return { user: mockUser, token: 'test-token' };
    })
  };
  const mockChatClient = {
    createChatThread: jest.fn()
  };
  let requestedScopes: any;
  const mockResponse = createMockedResponseObject();
  const mockNextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    requestedScopes = undefined;
    (mockNextFunction as jest.Mock).mockClear();
  });

  test('should request only voip scope when chat is disabled', async () => {
    cfg.chatEnabled = false;

    const controller = tokenController(
      mockIdentityClient as any,
      mockChatClient as any,
      cfg
    );
    await controller({} as any, mockResponse, mockNextFunction);

    expect(requestedScopes).toEqual(['voip']);
    expect(mockChatClient.createChatThread).not.toHaveBeenCalled();
  });

  test('should request both chat and voip scopes when chat is enabled', async () => {
    cfg.chatEnabled = true;
    cfg.botAppId = 'bot-id';
    mockChatClient.createChatThread.mockResolvedValue({ chatThread: { id: 'thread-id' } });

    const controller = tokenController(
      mockIdentityClient as any,
      mockChatClient as any,
      cfg
    );
    await controller({} as any, mockResponse, mockNextFunction);

    expect(requestedScopes).toEqual(expect.arrayContaining(['voip', 'chat']));
    expect(mockChatClient.createChatThread).toHaveBeenCalled();
    expect(mockResponse.lastJson.threadId).toBe('thread-id');
  });

  test('delegates errors to other handlers with next()', async () => {
    cfg.chatEnabled = true;
    mockIdentityClient.createUserAndToken.mockRejectedValue(new Error('test error'));

    const controller = tokenController(
      mockIdentityClient as any,
      mockChatClient as any,
      cfg
    );
    await controller({} as any, mockResponse, mockNextFunction);

    expect(mockNextFunction).toHaveBeenCalledTimes(1);
  });
});
