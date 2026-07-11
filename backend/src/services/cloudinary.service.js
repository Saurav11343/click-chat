import cloudinary from "../config/cloudinary.js";

/**
 * Uploads an in-memory file buffer to Cloudinary.
 */
const uploadBuffer = ({
  buffer,
  folder,
  resourceType = "auto",
  publicId,
  transformation,
  filename,
}) => {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
    };

    if (publicId) {
      uploadOptions.public_id = publicId;
    }

    if (transformation) {
      uploadOptions.transformation = transformation;
    }

    /*
     * Raw files can need the filename extension preserved.
     */
    if (resourceType === "raw" && filename) {
      uploadOptions.public_id = publicId || filename;
      uploadOptions.use_filename = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(buffer);
  });
};

export const uploadProfilePicture = async ({ buffer, userId }) => {
  return uploadBuffer({
    buffer,
    folder: "realtime-chat-app/users/profile-pictures",
    resourceType: "image",
    publicId: `user-${userId}`,
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "fill",
        gravity: "face",
      },
      {
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });
};

export const uploadChatImage = async ({ buffer, conversationId }) => {
  return uploadBuffer({
    buffer,
    folder: `realtime-chat-app/chats/${conversationId}/images`,
    resourceType: "image",
    transformation: [
      {
        width: 1600,
        height: 1600,
        crop: "limit",
      },
      {
        quality: "auto",
        fetch_format: "auto",
      },
    ],
  });
};

export const uploadChatVideo = async ({ buffer, conversationId }) => {
  return uploadBuffer({
    buffer,
    folder: `realtime-chat-app/chats/${conversationId}/videos`,
    resourceType: "video",
  });
};

export const uploadDocument = async ({
  buffer,
  conversationId,
  originalFilename,
}) => {
  return uploadBuffer({
    buffer,
    folder: `realtime-chat-app/chats/${conversationId}/documents`,
    resourceType: "raw",
    filename: originalFilename,
  });
};

export const uploadPdf = async ({
  buffer,
  conversationId,
  originalFilename,
}) => {
  return uploadBuffer({
    buffer,
    folder: `realtime-chat-app/chats/${conversationId}/pdfs`,
    resourceType: "image",
    filename: originalFilename,
  });
};

export const uploadGenericFile = async ({
  buffer,
  folder = "realtime-chat-app/uploads",
  originalFilename,
}) => {
  return uploadBuffer({
    buffer,
    folder,
    resourceType: "auto",
    filename: originalFilename,
  });
};

export const deleteCloudinaryFile = async ({
  publicId,
  resourceType = "image",
}) => {
  if (!publicId) {
    return null;
  }

  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
};
