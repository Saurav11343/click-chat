import { success } from "zod";
import Invitation from "../models/invitation.model.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";

export const sendInvitation = async (req, res) => {
  try {
    const senderId = req.user._id;
    const { recipientId } = req.body;

    if (senderId.toString() === recipientId) {
      return res.status(400).json({
        success: false,
        message: "You cannot send an invitation to yourself",
      });
    }

    const recipient = await User.findById(recipientId).select("_id");

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: "Recipient not found",
      });
    }

    const existingInvitation = await Invitation.findOne({
      status: {
        $in: ["pending", "accepted"],
      },
      $or: [
        {
          sender: senderId,
          recipient: recipientId,
        },
        {
          sender: recipientId,
          recipient: senderId,
        },
      ],
    });

    if (existingInvitation) {
      const message =
        existingInvitation.status === "accepted"
          ? "You are already connected with this user."
          : "An invitation is already pending between these users.";

      return res.status(409).json({
        success: false,
        message,
      });
    }

    const invitation = await Invitation.create({
      sender: senderId,
      recipient: recipientId,
    });

    return res.status(201).json({
      success: true,
      message: "Invitation sent successfully",
    });
  } catch (error) {
    console.error("Send invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send invitation",
    });
  }
};

export const getInvitations = async (req, res) => {
  try {
    const userId = req.user._id;

    const [receivedInvitations, sentInvitations] = await Promise.all([
      Invitation.find({
        recipient: userId,
        status: "pending",
      })
        .populate("sender", "_id firstName lastName email profilePic")
        .sort({
          createdAt: -1,
        })
        .lean(),

      Invitation.find({
        sender: userId,
        status: "pending",
      })
        .populate("recipient", "_id firstName lastName email profilePic")
        .sort({
          createdAt: -1,
        })
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      message: "Invitations retrieved successfully.",
      received: receivedInvitations,
      sent: sentInvitations,
    });
  } catch (error) {
    console.error("Get invitations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve invitations",
    });
  }
};

export const respondToInvitation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { invitationId } = req.params;
    const { action } = req.body;

    const invitation = await Invitation.findOne({
      _id: invitationId,
      recipient: userId,
      status: "pending",
    });

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message:
          "Pending invitation not found or you are not authorized to update it.",
      });
    }

    let conversation = null;

    if (action === "accepted") {
      const participants = [invitation.sender, invitation.recipient];

      const directKey = participants
        .map((participant) => participant.toString())
        .sort()
        .join(":");

      conversation = await Conversation.findOneAndUpdate(
        {
          type: "direct",
          directKey,
        },
        {
          $setOnInsert: {
            type: "direct",
            participants,
            directKey,
            createdBy: invitation.sender,
          },
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      ).populate(
        "participants",
        "_id firstName lastName email profilePic bio isOnline lastSeen",
      );
    }
    
    invitation.status = action;

    await invitation.save();

    await invitation.populate(
      "sender",
      "_id firstName lastName email profilePic",
    );

    await invitation.populate(
      "recipient",
      "_id firstName lastName email profilePic",
    );

    const message =
      action === "accepted"
        ? "Invitation accepted and conversation created successfully."
        : "Invitation declined successfully.";

    return res.status(200).json({
      success: true,
      message,
      invitation,
      conversation,
    });
  } catch (error) {
    console.error("Respond to invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update invitation.",
    });
  }
};

export const getAcceptedContacts = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentUserId = userId.toString();

    const acceptedInvitations = await Invitation.find({
      status: "accepted",
      $or: [
        {
          sender: userId,
        },
        {
          recipient: userId,
        },
      ],
    })
      .populate(
        "sender",
        "_id firstName lastName email profilePic bio isOnline lastSeen",
      )
      .populate(
        "recipient",
        "_id firstName lastName email profilePic bio isOnline lastSeen",
      )
      .sort({
        updatedAt: -1,
      })
      .lean();

    const contactsMap = new Map();

    acceptedInvitations.forEach((invitation) => {
      const senderId = invitation.sender?._id?.toString();

      const contact =
        senderId === currentUserId ? invitation.recipient : invitation.sender;

      if (contact?._id) {
        contactsMap.set(contact._id.toString(), {
          ...contact,
          connectedAt: invitation.updatedAt,
        });
      }
    });

    // These lines must be outside forEach()
    const contacts = Array.from(contactsMap.values());

    return res.status(200).json({
      success: true,
      message: "Accepted contacts retrieved successfully.",
      count: contacts.length,
      contacts,
    });
  } catch (error) {
    console.error("Get accepted contacts error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve accepted contacts.",
    });
  }
};
