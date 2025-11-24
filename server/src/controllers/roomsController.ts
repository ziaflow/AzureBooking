// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import express from 'express';
import { CommunicationUserIdentifier } from '@azure/communication-common';
import { CommunicationAccessToken, CommunicationIdentityClient, TokenScope } from '@azure/communication-identity';
import { CommunicationRoom, RoomsClient, RoomParticipant, CreateRoomOptions } from '@azure/communication-rooms';
import { joinRoomRequestValidator } from '../utils/validators';
import {
  CreateRoomResponse,
  JoinRoomResponse,
  RoomParticipantRole,
  RoomParticipant as TestAppointmentRoomParticipant
} from '../models/roomModel';
import { ERROR_NO_USER_FOUND_IN_ROOM } from '../constants';

export const createRoom = (
  identityClient: CommunicationIdentityClient,
  roomsClient: RoomsClient,
  botAppId?: string,
  logicAppUrl?: string
) => async (req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> => {
  try {
    const presenter = await identityClient.createUser();
    const attendee = await identityClient.createUser();

    // Options payload to create a room
    const validFrom = new Date();
    const validUntilDate = new Date(validFrom);
    validUntilDate.setHours(validFrom.getHours() + 1);
    const validUntil = new Date(validUntilDate);

    const participantsPayload = [
      {
        id: presenter,
        role: RoomParticipantRole.presenter
      },
      {
        id: attendee,
        role: RoomParticipantRole.attendee
      }
    ];

    if (botAppId) {
      participantsPayload.push({
        id: { microsoftBotId: botAppId, isResourceAccountConfigured: false } as any,
        role: RoomParticipantRole.presenter
      });
    }

    const createRoomOptions: CreateRoomOptions = {
      validFrom: validFrom,
      validUntil: validUntil,
      participants: participantsPayload
    };

    // Create a room with the request payload
    const room: CommunicationRoom = await roomsClient.createRoom(createRoomOptions);

    // Retrieve participants list
    const participantsIterator = await roomsClient.listParticipants(room.id);
    const participantsList = await toArray(participantsIterator);

    // Formulating participants
    const participants: TestAppointmentRoomParticipant[] = participantsList.map(
      (participant: RoomParticipant): TestAppointmentRoomParticipant => {
        const id = (participant.id as CommunicationUserIdentifier).communicationUserId
          ? (participant.id as CommunicationUserIdentifier).communicationUserId
          : (participant.id as any).microsoftBotId;

        return {
          id: id as string,
          role: participant.role as RoomParticipantRole
        };
      }
    );

    // Formulate response
    const response: CreateRoomResponse = {
      roomId: room.id,
      participants: participants,
      validFrom: room.validFrom.toISOString(),
      validUntil: room.validUntil.toISOString()
    };

    // Trigger Logic App for Lead Gen Notification if configured
    if (logicAppUrl && req.body && req.body.email) {
      const { name, email, phone, message } = req.body;
      try {
        // Using global fetch (Node 18+)
        fetch(logicAppUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            message,
            roomId: room.id,
            timestamp: new Date().toISOString()
          })
        }).catch((err) => console.error('Failed to trigger Logic App:', err));
      } catch (e) {
        console.error('Error triggering Logic App:', e);
      }
    }

    return res.status(201).send(response);
  } catch (error) {
    return next(error);
  }
};

export const getToken = (identityClient: CommunicationIdentityClient, roomsClient: RoomsClient) => async (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): Promise<any> => {
  try {
    const { body: requestData } = req;

    // Validation
    const errors = joinRoomRequestValidator(requestData);

    if (errors.length > 0) {
      return res.status(400).send({ errors });
    }

    const { roomId, userId } = requestData;

    // Retrieve participants list
    const participantsList = await toArray(await roomsClient.listParticipants(roomId as string));

    // Check if the user is part of participants
    const foundUserParticipant: RoomParticipant | undefined = participantsList.find(
      (participant: RoomParticipant) => (participant.id as CommunicationUserIdentifier).communicationUserId === userId
    );

    if (!foundUserParticipant) {
      return res.status(404).send(ERROR_NO_USER_FOUND_IN_ROOM);
    }

    let invitee: TestAppointmentRoomParticipant | undefined;

    if (foundUserParticipant.role === RoomParticipantRole.presenter) {
      const attendee = participantsList.find(
        (participant: RoomParticipant) => (participant.id as CommunicationUserIdentifier).communicationUserId !== userId
      );
      if (attendee) {
        invitee = {
          id: (attendee.id as CommunicationUserIdentifier).communicationUserId,
          role: attendee.role as RoomParticipantRole
        };
      }
    }

    // Create token
    const scopes: TokenScope[] = ['voip'];
    const user: CommunicationUserIdentifier = {
      communicationUserId: userId as string
    };

    const tokenResponse: CommunicationAccessToken = await identityClient.getToken(user, scopes);

    // Formulating response
    const response: JoinRoomResponse = {
      participant: {
        id: (foundUserParticipant.id as CommunicationUserIdentifier).communicationUserId,
        role: foundUserParticipant.role as RoomParticipantRole
      },
      invitee: invitee,
      token: tokenResponse.token
    };

    return res.send(response);
  } catch (error) {
    return next(error);
  }
};

async function toArray(asyncIterator): Promise<RoomParticipant[]> {
  const arr: RoomParticipant[] = [];
  let result = await asyncIterator.next();
  while (result.value) {
    arr.push(result.value);
    if (result.done) {
      break;
    }
    result = await asyncIterator.next();
  }
  return arr;
}
