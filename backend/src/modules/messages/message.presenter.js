export const SENDER_FIELDS = "_id firstName lastName profilePic";
export const REPLY_FIELDS =
  "_id content sender messageType attachment gif externalMedia isDeleted createdAt";

export const populateMessage = async (message) => {
  await message.populate("sender", SENDER_FIELDS);

  if (message.replyTo) {
    await message.populate({
      path: "replyTo",
      select: REPLY_FIELDS,
      populate: {
        path: "sender",
        select: SENDER_FIELDS,
      },
    });
  }

  return message;
};

export const messagePopulateOptions = [
  { path: "sender", select: SENDER_FIELDS },
  {
    path: "replyTo",
    select: REPLY_FIELDS,
    populate: { path: "sender", select: SENDER_FIELDS },
  },
  { path: "readBy.user", select: "_id firstName lastName" },
];

