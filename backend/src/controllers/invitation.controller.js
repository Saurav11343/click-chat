import { success } from "zod";
import Invitation from "../models/invitation.model.js";
import User from "../models/user.model.js";

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
      status: "pending",
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
      return res.status(409).json({
        success: false,
        message: "An invitation is already pending between these users.",
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

    const invitation = await Invitation.findOneAndUpdate(
      {
        _id: invitationId,
        recipient: userId,
        status: "pending",
      },
      {
        status: action,
      },
      {
        new: true,
        runValidators: true,
      },
    )
      .populate(
        "sender",
        "_id firstName lastName email profilePic",
      )
      .populate(
        "recipient",
        "_id firstName lastName email profilePic",
      );

    if (!invitation) {
      return res.status(404).json({
        success: false,
        message:
          "Pending invitation not found or you are not authorized to update it.",
      });
    }

    const message =
      action === "accepted"
        ? "Invitation accepted successfully."
        : "Invitation declined successfully.";

    return res.status(200).json({
      success: true,
      message,
      invitation,
    });
  } catch (error) {
    console.error("Respond to invitation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update invitation.",
    });
  }
};