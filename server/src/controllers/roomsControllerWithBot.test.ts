// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import { RoomParticipant, RoomsClient } from '@azure/communication-rooms';
import { PagedAsyncIterableIterator } from '@azure/core-paging';
import { CommunicationIdentityClient } from '@azure/communication-identity';
import { createRoom } from './roomsController';
import { CreateRoomResponse, RoomParticipantRole } from '../models/roomModel';

jest.mock('@azure/communication-identity');

describe('roomsController with Bot', () => {
  let response;
  let next;
  const validFrom = new Date();
  const validUntilDate = new Date(validFrom);
  validUntilDate.setHours(validFrom.getHours() + 1);
  const validUntil = new Date(validUntilDate);

  const expectedRoomId = 'room-id';
  const expectedPresenterId = 'communicationUserId-presenter';
  const expectedAttendeeId = 'communicationUserId-attendee';
  const expectedBotAppId = 'bot-app-id';

  function createPartipantsIterator(): Iterator<RoomParticipant> {
    let nextIndex = 0;
    const participants = [
      {
        id: {
          communicationUserId: expectedPresenterId
        },
        role: RoomParticipantRole.presenter
      },
      {
        id: {
          communicationUserId: expectedAttendeeId
        },
        role: RoomParticipantRole.attendee
      },
      {
        id: {
          microsoftBotId: expectedBotAppId,
          isResourceAccountConfigured: false
        } as any, // casting as any because of potential type mismatch in test environment vs real types
        role: RoomParticipantRole.presenter
      }
    ];

    const iterator = {
      next: () => {
        let result;
        if (nextIndex < participants.length) {
          result = { value: participants[nextIndex], done: false };
          nextIndex++;
          return result;
        }
        return { value: undefined, done: true };
      }
    };
    return iterator;
  }

  beforeEach(() => {
    jest.resetAllMocks();
    response = {
      send: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis()
    } as any;
    next = jest.fn();
  });

  test('Should include Bot participant when botAppId is provided', async () => {
    const mockedIdentityClient = {
      createUser: async () => ({ communicationUserId: 'testing-communication-user-id' })
    } as CommunicationIdentityClient;

    const participantsIterator = createPartipantsIterator();

    const createRoomSpy = jest.fn().mockResolvedValue({
      id: expectedRoomId,
      createdOn: validFrom,
      validFrom: validFrom,
      validUntil: validUntil,
      pstnDialOutEnabled: false
    });

    const mockedRoomsClient = {
      createRoom: createRoomSpy,
      listParticipants: (_roomId): PagedAsyncIterableIterator<RoomParticipant> => {
        return {
          byPage: (): AsyncIterableIterator<RoomParticipant[]> => {
            return {
              next: async () => {
                return {
                  done: true,
                  value: []
                };
              },
              [Symbol.asyncIterator]() {
                return this;
              }
            };
          },
          next: async () => {
            return participantsIterator.next();
          },
          [Symbol.asyncIterator]() {
            return this;
          }
        };
      }
    } as unknown as RoomsClient;

    const expectedResponse: CreateRoomResponse = {
      roomId: expectedRoomId,
      participants: [
        {
          id: expectedPresenterId,
          role: RoomParticipantRole.presenter
        },
        {
          id: expectedAttendeeId,
          role: RoomParticipantRole.attendee
        },
        {
          id: expectedBotAppId,
          role: RoomParticipantRole.presenter
        }
      ],
      validFrom: validFrom.toISOString(),
      validUntil: validUntil.toISOString()
    };

    await createRoom(mockedIdentityClient, mockedRoomsClient, expectedBotAppId)({} as any, response, next);

    expect(createRoomSpy).toHaveBeenCalled();
    // Check if the 3rd participant (the bot) was passed to createRoom options
    const callArgs = createRoomSpy.mock.calls[0][0];
    expect(callArgs.participants).toHaveLength(3);
    expect(callArgs.participants[2].id).toEqual({ microsoftBotId: expectedBotAppId, isResourceAccountConfigured: false });

    expect(response.send).toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(201);
    expect(response.send).toHaveBeenCalledWith(expectedResponse);
  });
});
