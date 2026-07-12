import User from "../models/user.model.js";

const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const searchUsersService = async ({ query, currentUserId }) => {
  const safeQuery = escapeRegex(query);

  const users = await User.find({
    _id: {
      $ne: currentUserId,
    },
    $or: [
      {
        firstName: {
          $regex: safeQuery,
          $options: "i",
        },
      },
      {
        lastName: {
          $regex: safeQuery,
          $options: "i",
        },
      },
      {
        email: {
          $regex: safeQuery,
          $options: "i",
        },
      },
      {
        $expr: {
          $regexMatch: {
            input: {
              $concat: [
                {
                  $ifNull: ["$firstName", ""],
                },
                " ",
                {
                  $ifNull: ["$lastName", ""],
                },
              ],
            },
            regex: safeQuery,
            options: "i",
          },
        },
      },
    ],
  })
    .select("_id firstName lastName email profilePic")
    .sort({
      firstName: 1,
      lastName: 1,
    })
    .limit(20)
    .lean();

  return users;
};
