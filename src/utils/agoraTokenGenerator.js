import pkg from "agora-access-token";
const { RtcRole, RtcTokenBuilder } = pkg;

const appId = "0577357b75274dfaa0515383d8cfcc18";
const appCertificate = "0a669d1616944e4e810da99e187a1138";
import SubscriptionPlan from "../models/subscriptionPlanModel.js";

const role = RtcRole.PUBLISHER;

const genrateRtcToken = async (uid, channelName, callerId, receiverId) => {
  // Get both caller and receiver subscription plans
  const [callerPlan, receiverPlan] = await Promise.all([
    SubscriptionPlan.findOne({ user: callerId }),
    SubscriptionPlan.findOne({ user: receiverId }),
  ]);

  console.log("Caller Plan:", callerPlan);
  console.log("Receiver Plan:", receiverPlan);

  // Validate UID
  const numericUid = Number(uid);
  if (isNaN(numericUid) || numericUid < 0 || numericUid > 4294967295) {
    throw new Error("Invalid UID");
  }

  // Determine token duration
  const expirationTimeInSeconds =
    callerPlan && receiverPlan
      ? 24 * 60 * 60 // 24 hours
      : 2 * 60; // 2 minutes

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expirationTimeInSeconds;

  console.log(
    `Generating token for UID: ${numericUid}, Channel: ${channelName}, Duration: ${expirationTimeInSeconds} seconds`
  );

  return RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    numericUid,
    role,
    privilegeExpireTime
  );
};

export default genrateRtcToken;
