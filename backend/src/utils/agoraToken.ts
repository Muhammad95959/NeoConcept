import CustomError from "../types/customError";
import { ErrorMessages } from "../types/errorsMessages";
import { HTTPStatusText } from "../types/HTTPStatusText";

const APP_ID = process.env.AGORA_APP_ID!;
const APP_CERTIFICATE = process.env.AGORA_APP_CERT!;

import { RtcTokenBuilder, Role } from "./agora/rtcTokenBuilder2";

export function generateAgoraToken(channelName: string, uid: string) {
  if (!APP_ID || !APP_CERTIFICATE) {
    throw new CustomError(ErrorMessages.AGORA_APP_ID_OR_CERTIFICATE_MISSING, 400, HTTPStatusText.FAIL);
  }

  const role = Role.PUBLISHER;

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const expireTime = 3600;

  const privilegeExpiredTs = currentTimestamp + expireTime;
  return RtcTokenBuilder.buildTokenWithUserAccount(APP_ID, APP_CERTIFICATE, channelName, uid, role, privilegeExpiredTs);
}

// | Type        | Without Wildcard | With Wildcard |
// | ----------- | ---------------- | ------------- |
// | UID         | Only 1 user      | Many users    |
// | Channel     | Only 1 channel   | Many channels |
// | Security    | High             | Lower         |
// | Flexibility | Low              | High          |
