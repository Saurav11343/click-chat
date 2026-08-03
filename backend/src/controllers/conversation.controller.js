import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import Invitation from "../models/invitation.model.js";
import User from "../models/user.model.js";
import {
  deleteCloudinaryFile,
  uploadGroupPicture,
} from "../services/cloudinary.service.js";
import { getIO } from "../socket/socket.js";

const participantFields =
  "_id firstName lastName email profilePic bio isOnline lastSeen";

const populateConversation = async (conversation) => {
  await conversation.populate("participants", participantFields);
  await conversation.populate("createdBy", "_id firstName lastName");
  await conversation.populate("groupAdmins", "_id firstName lastName");
  await conversation.populate("lastMessage");
  return conversation;
};

const participantId = (participant) =>
  (participant?._id || participant).toString();

const emitConversationToParticipants = (conversation, event) => {
  const io = getIO();
  for (const participant of conversation.participants) {
    io.to(`user:${participantId(participant)}`).emit(event, conversation);
  }
};

const getGroupForAdmin = (conversationId, userId) =>
  Conversation.findOne({
    _id: conversationId,
    type: "group",
    participants: userId,
    groupAdmins: userId,
  });

const areAcceptedContacts = async (userId, contactIds) => {
  if (contactIds.length === 0) return true;

  const accepted = await Invitation.find({
    status: "accepted",
    $or: contactIds.flatMap((contactId) => [
      { sender: userId, recipient: contactId },
      { sender: contactId, recipient: userId },
    ]),
  }).select("sender recipient");

  const connectedIds = new Set(
    accepted.map((invitation) =>
      invitation.sender.toString() === userId.toString()
        ? invitation.recipient.toString()
        : invitation.sender.toString(),
    ),
  );

  return contactIds.every((contactId) => connectedIds.has(contactId));
};

const deleteGroupResources = async (conversation) => {
  const messages = await Message.find({ conversation: conversation._id }).select(
    "attachment",
  );
  const files = messages
    .map((message) => message.attachment)
    .filter((attachment) => attachment?.publicId)
    .map((attachment) => ({
      publicId: attachment.publicId,
      resourceType: attachment.resourceType,
    }));

  if (conversation.groupImage?.publicId) {
    files.push({
      publicId: conversation.groupImage.publicId,
      resourceType: conversation.groupImage.resourceType || "image",
    });
  }

  await Promise.allSettled(files.map(deleteCloudinaryFile));
  await Message.deleteMany({ conversation: conversation._id });
  await Conversation.deleteOne({ _id: conversation._id });
};

const deleteConversationMessages = async (conversationId) => {
  const messages = await Message.find({ conversation: conversationId }).select(
    "attachment",
  );
  const files = messages
    .map((message) => message.attachment)
    .filter((attachment) => attachment?.publicId)
    .map((attachment) => ({
      publicId: attachment.publicId,
      resourceType: attachment.resourceType,
    }));

  await Promise.allSettled(files.map(deleteCloudinaryFile));
  await Message.deleteMany({ conversation: conversationId });
};

const getDirectConversation = (conversationId, userId) =>
  Conversation.findOne({
    _id: conversationId,
    type: "direct",
    participants: userId,
  });

export const clearDirectConversation = async (req, res) => {
  try {
    const conversation = await getDirectConversation(
      req.params.conversationId,
      req.user._id,
    );
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Direct conversation not found.",
      });
    }

    await deleteConversationMessages(conversation._id);
    conversation.lastMessage = null;
    await conversation.save();
    await populateConversation(conversation);

    const io = getIO();
    for (const participant of conversation.participants) {
      const room = `user:${participantId(participant)}`;
      io.to(room).emit("messages:cleared", {
        conversationId: conversation._id.toString(),
      });
      io.to(room).emit("conversation:updated", conversation);
    }

    return res.status(200).json({
      success: true,
      message: "Chat history cleared for both participants.",
      conversation,
    });
  } catch (error) {
    console.error("Clear direct conversation error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to clear the chat.",
    });
  }
};

export const deleteDirectConversation = async (req, res) => {
  try {
    const conversation = await getDirectConversation(
      req.params.conversationId,
      req.user._id,
    );
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Direct conversation not found.",
      });
    }

    const participantIds = conversation.participants.map(participantId);
    await deleteConversationMessages(conversation._id);
    await Conversation.deleteOne({ _id: conversation._id });
    await Invitation.deleteMany({
      status: "accepted",
      $or: [
        { sender: participantIds[0], recipient: participantIds[1] },
        { sender: participantIds[1], recipient: participantIds[0] },
      ],
    });

    const io = getIO();
    for (const id of participantIds) {
      io.to(`user:${id}`).emit("conversation:removed", {
        conversationId: conversation._id.toString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation deleted permanently for both participants.",
    });
  } catch (error) {
    console.error("Delete direct conversation error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to delete the conversation.",
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({ participants: userId })
      .populate(
        "participants",
        "_id firstName lastName email profilePic bio isOnline lastSeen",
      )
      .populate("createdBy", "_id firstName lastName")
      .populate("groupAdmins", "_id firstName lastName")
      .sort({ updatedAt: -1 })
      .populate("lastMessage")
      .lean();

    return res.status(200).json({
      success: true,
      message: "Conversations retrieved successfully.",
      count: conversations.length,
      conversations,
    });
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve conversations.",
    });
  }
};

export const createGroup = async (req, res) => {
  try {
    const creatorId = req.user._id;
    const participantIds = req.body.participantIds.filter(
      (id) => id !== creatorId.toString(),
    );

    if (participantIds.length < 2) {
      return res.status(400).json({
        success: false,
        message: "A group requires at least two other contacts.",
      });
    }

    if (!(await areAcceptedContacts(creatorId, participantIds))) {
      return res.status(403).json({
        success: false,
        message: "Groups can only include your accepted contacts.",
      });
    }

    const existingUsers = await User.countDocuments({
      _id: { $in: participantIds },
    });
    if (existingUsers !== participantIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more selected users no longer exist.",
      });
    }

    const conversation = await Conversation.create({
      type: "group",
      groupName: req.body.groupName,
      participants: [creatorId, ...participantIds],
      groupAdmins: [creatorId],
      createdBy: creatorId,
    });

    await populateConversation(conversation);
    emitConversationToParticipants(conversation, "conversation:created");

    return res.status(201).json({
      success: true,
      message: "Group created successfully.",
      conversation,
    });
  } catch (error) {
    console.error("Create group error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to create the group.",
    });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const conversation = await getGroupForAdmin(
      req.params.conversationId,
      req.user._id,
    );
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Group not found or administrator access is required.",
      });
    }

    conversation.groupName = req.body.groupName;
    await conversation.save();
    await populateConversation(conversation);
    emitConversationToParticipants(conversation, "conversation:updated");

    return res.status(200).json({
      success: true,
      message: "Group name updated.",
      conversation,
    });
  } catch (error) {
    console.error("Update group error:", error);
    return res.status(500).json({ success: false, message: "Unable to update the group." });
  }
};

export const updateGroupImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Select a group image." });
    }

    const conversation = await getGroupForAdmin(
      req.params.conversationId,
      req.user._id,
    );
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Group not found or administrator access is required.",
      });
    }

    const upload = await uploadGroupPicture({
      buffer: req.file.buffer,
      conversationId: conversation._id.toString(),
    });
    conversation.groupImage = {
      url: upload.secure_url,
      publicId: upload.public_id,
      resourceType: upload.resource_type,
    };
    await conversation.save();
    await populateConversation(conversation);
    emitConversationToParticipants(conversation, "conversation:updated");

    return res.status(200).json({
      success: true,
      message: "Group image updated.",
      conversation,
    });
  } catch (error) {
    console.error("Update group image error:", error);
    return res.status(500).json({ success: false, message: "Unable to update the group image." });
  }
};

export const addGroupParticipants = async (req, res) => {
  try {
    const conversation = await getGroupForAdmin(
      req.params.conversationId,
      req.user._id,
    );
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Group not found or administrator access is required.",
      });
    }

    const existingIds = new Set(conversation.participants.map(participantId));
    const addedIds = req.body.participantIds.filter((id) => !existingIds.has(id));
    if (addedIds.length === 0) {
      return res.status(409).json({ success: false, message: "Those users are already members." });
    }
    if (conversation.participants.length + addedIds.length > 100) {
      return res.status(400).json({ success: false, message: "A group cannot exceed 100 members." });
    }
    if (!(await areAcceptedContacts(req.user._id, addedIds))) {
      return res.status(403).json({
        success: false,
        message: "You can only add your accepted contacts.",
      });
    }

    const existingUsers = await User.countDocuments({ _id: { $in: addedIds } });
    if (existingUsers !== addedIds.length) {
      return res.status(400).json({ success: false, message: "One or more selected users no longer exist." });
    }

    conversation.participants.push(...addedIds);
    await conversation.save();
    await populateConversation(conversation);

    const io = getIO();
    for (const id of addedIds) {
      io.to(`user:${id}`).emit("conversation:created", conversation);
    }
    for (const participant of conversation.participants) {
      if (!addedIds.includes(participantId(participant))) {
        io.to(`user:${participantId(participant)}`).emit(
          "conversation:updated",
          conversation,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Members added successfully.",
      conversation,
    });
  } catch (error) {
    console.error("Add group participants error:", error);
    return res.status(500).json({ success: false, message: "Unable to add group members." });
  }
};

export const removeGroupParticipant = async (req, res) => {
  try {
    const conversation = await getGroupForAdmin(
      req.params.conversationId,
      req.user._id,
    );
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Group not found or administrator access is required." });
    }

    const targetId = req.params.participantId;
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Use Leave group to remove yourself." });
    }
    if (!conversation.participants.some((id) => id.toString() === targetId)) {
      return res.status(404).json({ success: false, message: "Member not found in this group." });
    }
    const targetIsAdmin = conversation.groupAdmins.some(
      (id) => id.toString() === targetId,
    );
    if (targetIsAdmin && conversation.groupAdmins.length === 1) {
      return res.status(400).json({ success: false, message: "Assign another administrator before removing this administrator." });
    }

    conversation.participants.pull(targetId);
    conversation.groupAdmins.pull(targetId);
    await conversation.save();
    await populateConversation(conversation);

    getIO().to(`user:${targetId}`).emit("conversation:removed", {
      conversationId: conversation._id.toString(),
    });
    emitConversationToParticipants(conversation, "conversation:updated");

    return res.status(200).json({ success: true, message: "Member removed.", conversation });
  } catch (error) {
    console.error("Remove group participant error:", error);
    return res.status(500).json({ success: false, message: "Unable to remove the member." });
  }
};

export const updateGroupAdmin = async (req, res) => {
  try {
    const conversation = await getGroupForAdmin(
      req.params.conversationId,
      req.user._id,
    );
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Group not found or administrator access is required." });
    }

    const targetId = req.params.participantId;
    if (!conversation.participants.some((id) => id.toString() === targetId)) {
      return res.status(404).json({ success: false, message: "Member not found in this group." });
    }

    const isAdmin = conversation.groupAdmins.some((id) => id.toString() === targetId);
    if (req.body.action === "add" && !isAdmin) {
      conversation.groupAdmins.push(targetId);
    }
    if (req.body.action === "remove" && isAdmin) {
      if (conversation.groupAdmins.length === 1) {
        return res.status(400).json({ success: false, message: "A group must have at least one administrator." });
      }
      conversation.groupAdmins.pull(targetId);
    }

    await conversation.save();
    await populateConversation(conversation);
    emitConversationToParticipants(conversation, "conversation:updated");

    return res.status(200).json({
      success: true,
      message: req.body.action === "add" ? "Administrator added." : "Administrator removed.",
      conversation,
    });
  } catch (error) {
    console.error("Update group admin error:", error);
    return res.status(500).json({ success: false, message: "Unable to update administrators." });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.conversationId,
      type: "group",
      participants: req.user._id,
    }).select("+groupImage.publicId +groupImage.resourceType");
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Group not found." });
    }

    const leavingId = req.user._id.toString();
    if (conversation.participants.length === 1) {
      await deleteGroupResources(conversation);
    } else {
      conversation.participants.pull(leavingId);
      const wasAdmin = conversation.groupAdmins.some((id) => id.toString() === leavingId);
      conversation.groupAdmins.pull(leavingId);
      if (wasAdmin && conversation.groupAdmins.length === 0) {
        conversation.groupAdmins.push(conversation.participants[0]);
      }
      await conversation.save();
      await populateConversation(conversation);
      emitConversationToParticipants(conversation, "conversation:updated");
    }

    getIO().to(`user:${leavingId}`).emit("conversation:removed", {
      conversationId: req.params.conversationId,
    });
    return res.status(200).json({ success: true, message: "You left the group." });
  } catch (error) {
    console.error("Leave group error:", error);
    return res.status(500).json({ success: false, message: "Unable to leave the group." });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const conversation = await getGroupForAdmin(
      req.params.conversationId,
      req.user._id,
    ).select("+groupImage.publicId +groupImage.resourceType");
    if (!conversation) {
      return res.status(404).json({ success: false, message: "Group not found or administrator access is required." });
    }

    const participantIds = conversation.participants.map(participantId);
    await deleteGroupResources(conversation);
    const io = getIO();
    for (const id of participantIds) {
      io.to(`user:${id}`).emit("conversation:removed", {
        conversationId: conversation._id.toString(),
      });
    }

    return res.status(200).json({ success: true, message: "Group deleted permanently." });
  } catch (error) {
    console.error("Delete group error:", error);
    return res.status(500).json({ success: false, message: "Unable to delete the group." });
  }
};
