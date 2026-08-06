import { getMessagePreview } from "@/shared/formatters/message-preview";

export function toConversationListItems(conversations, currentUserId) {
  return conversations.map((conversation) =>
    conversation.type === "group"
      ? toGroupListItem(conversation)
      : toDirectListItem(conversation, currentUserId),
  );
}

function toGroupListItem(conversation) {
  const groupName = conversation.groupName || "Unnamed group";
  const initials = groupName
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    id: conversation._id,
    conversationId: conversation._id,
    name: groupName,
    initials: initials || "G",
    image: conversation.groupImage?.url || "",
    participants: conversation.participants,
    groupAdmins: conversation.groupAdmins || [],
    createdBy: conversation.createdBy,
    lastMessage: getMessagePreview(
      conversation.lastMessage,
      "Group conversation created.",
    ),
    time: formatConversationTime(
      conversation.lastMessage?.createdAt || conversation.updatedAt,
    ),
    unreadCount: 0,
    online: false,
    isGroup: true,
  };
}

function toDirectListItem(conversation, currentUserId) {
  const otherUser = conversation.participants.find(
    (participant) => participant._id !== currentUserId,
  );
  const fullName = [otherUser?.firstName, otherUser?.lastName]
    .filter(Boolean)
    .join(" ");
  const initials = `${otherUser?.firstName?.charAt(0) || ""}${
    otherUser?.lastName?.charAt(0) || ""
  }`.toUpperCase();

  return {
    id: conversation._id,
    conversationId: conversation._id,
    userId: otherUser?._id,
    name: fullName || "Unknown user",
    initials: initials || "U",
    image: otherUser?.profilePic?.url || "",
    email: otherUser?.email || "",
    bio: otherUser?.bio || "",
    lastMessage: getMessagePreview(conversation.lastMessage),
    time: formatConversationTime(
      conversation.lastMessage?.createdAt || conversation.updatedAt,
    ),
    unreadCount: 0,
    online: otherUser?.isOnline || false,
    lastSeen: otherUser?.lastSeen,
    isGroup: false,
  };
}

function formatConversationTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

