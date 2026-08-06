import crypto from "node:crypto";
import path from "node:path";

import cloudinary from "../../config/cloudinary.js";

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

    if (filename) {
      uploadOptions.filename_override = filename;
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

const sanitizeFilename = (originalFilename) => {
  const normalizedFilename = String(
    originalFilename || "attachment",
  ).replaceAll("\\", "/");

  const basename = path.posix.basename(normalizedFilename);

  const sanitizedFilename = basename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 150);

  return sanitizedFilename || "attachment";
};

const createRawFilePublicId = (originalFilename) => {
  const sanitizedFilename = sanitizeFilename(originalFilename);
  const extension = path.extname(sanitizedFilename);
  const nameWithoutExtension =
    path.basename(sanitizedFilename, extension) || "attachment";

  const uniqueSuffix = crypto.randomUUID().slice(0, 8);

  /*
   * Cloudinary raw-file public IDs need the extension so browsers receive
   * a useful downloadable filename.
   */
  return `${Date.now()}-${uniqueSuffix}-${nameWithoutExtension}${extension}`;
};

const getCloudinaryUploadConfig = (mimeType) => {
  if (mimeType === "application/pdf") {
    return {
      messageType: "file",
      resourceType: "image",
      folderName: "documents",
      transformation: undefined,
    };
  }

  if (mimeType.startsWith("image/")) {
    return {
      messageType: "image",
      resourceType: "image",
      folderName: "images",
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
    };
  }

  if (mimeType.startsWith("video/")) {
    return {
      messageType: "video",
      resourceType: "video",
      folderName: "videos",
      transformation: undefined,
    };
  }

  if (mimeType.startsWith("audio/")) {
    /*
     * Cloudinary uses its video resource type for audio uploads.
     */
    return {
      messageType: "audio",
      resourceType: "video",
      folderName: "audio",
      transformation: undefined,
    };
  }

  return {
    messageType: "file",
    resourceType: "raw",
    folderName: "documents",
    transformation: undefined,
  };
};

export const uploadChatAttachment = async ({
  buffer,
  conversationId,
  originalFilename,
  mimeType,
}) => {
  const config = getCloudinaryUploadConfig(mimeType);
  const sanitizedFilename = sanitizeFilename(originalFilename);

  const publicId =
    config.resourceType === "raw"
      ? createRawFilePublicId(sanitizedFilename)
      : undefined;

  const result = await uploadBuffer({
    buffer,
    folder: `realtime-chat-app/chats/${conversationId}/${config.folderName}`,
    resourceType: config.resourceType,
    publicId,
    transformation: config.transformation,
    filename: sanitizedFilename,
  });

  return {
    messageType: config.messageType,

    attachment: {
      url: result.secure_url,
      publicId: result.public_id,
      originalName: originalFilename,
      mimeType,
      size: result.bytes,
      resourceType: result.resource_type,
      width: result.width ?? null,
      height: result.height ?? null,
      duration: result.duration ?? null,
    },
  };
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

export const uploadGroupPicture = async ({ buffer, conversationId }) => {
  return uploadBuffer({
    buffer,
    folder: "realtime-chat-app/groups",
    resourceType: "image",
    publicId: `group-${conversationId}`,
    transformation: [
      {
        width: 500,
        height: 500,
        crop: "fill",
        gravity: "auto",
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
  const sanitizedFilename = sanitizeFilename(originalFilename);

  return uploadBuffer({
    buffer,
    folder: `realtime-chat-app/chats/${conversationId}/documents`,
    resourceType: "raw",
    publicId: createRawFilePublicId(sanitizedFilename),
    filename: sanitizedFilename,
  });
};

export const uploadPdf = async ({
  buffer,
  conversationId,
  originalFilename,
}) => {
  const sanitizedFilename = sanitizeFilename(originalFilename);

  return uploadBuffer({
    buffer,
    folder: `realtime-chat-app/chats/${conversationId}/pdfs`,
    resourceType: "image",
    filename: sanitizedFilename,
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
    filename: sanitizeFilename(originalFilename),
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

export const createPrivateAttachmentUrl = ({
  publicId,
  resourceType,
  originalFilename,
  asAttachment = false,
}) => {
  const extension = path.extname(originalFilename || "").slice(1).toLowerCase();

  if (!publicId || !extension) {
    throw new Error("Attachment download metadata is incomplete.");
  }

  return cloudinary.utils.private_download_url(publicId, extension, {
    resource_type: resourceType || "raw",
    type: "upload",
    expires_at: Math.floor(Date.now() / 1000) + 5 * 60,
    attachment: asAttachment,
  });
};
