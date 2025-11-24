// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { RoomParticipant, RoomParticipantRole } from '../models/RoomModel';
import { createRoom, UserData } from './FetchRoomsResponse';
import { makeRoomsJoinUrl } from './GetMeetingLink';

export const createRoomAndRedirectUrl = async (userData?: UserData): Promise<string> => {
  let redirectUrl: string;
  try {
    const roomResponse = await createRoom(userData);
    const roomId = roomResponse.roomId;
    const userId = roomResponse.participants.find(
      (participant: RoomParticipant) => (participant.role as RoomParticipantRole) === RoomParticipantRole.presenter
    )?.id;
    if (userId) redirectUrl = makeRoomsJoinUrl(roomId, userId);
    else throw new Error(`room does not have participant with role ${RoomParticipantRole.presenter}`);
  } catch (e) {
    //EndUser to add logging errors in place of console logging below
    console.log(e);
    throw e;
  }
  return redirectUrl;
};
