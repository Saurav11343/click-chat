import { Check, Mail, X } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useInvitationStore } from "@/store/useInvitationStore";

export function InvitationsDialog() {
  const receivedInvitations = useInvitationStore(
    (state) => state.receivedInvitations,
  );

  const isLoadingInvitations = useInvitationStore(
    (state) => state.isLoadingInvitations,
  );

  const respondingToInvitationId = useInvitationStore(
    (state) => state.respondingToInvitationId,
  );

  const getInvitations = useInvitationStore((state) => state.getInvitations);

  const respondToInvitation = useInvitationStore(
    (state) => state.respondToInvitation,
  );
  const sentInvitations = useInvitationStore((state) => state.sentInvitations);

  const handleOpenChange = (open) => {
    if (open) {
      getInvitations();
    }
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative shrink-0 rounded-xl"
          aria-label="View chat invitations"
        >
          <Mail className="size-4" />

          {receivedInvitations.length > 0 && (
            <Badge className="absolute -right-2 -top-2 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
              {receivedInvitations.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg">
        <DialogHeader className="border-b bg-muted/35 px-5 py-5">
          <DialogTitle className="text-xl tracking-tight">Chat invitations</DialogTitle>

          <DialogDescription>
            Accept or decline invitations from other users.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-72">
          <div className="space-y-6 p-4">
            {isLoadingInvitations ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Loading invitations...
              </p>
            ) : (
              <>
                <section>
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Received
                  </h3>

                  {receivedInvitations.length === 0 ? (
                    <p className="rounded-2xl border border-dashed bg-muted/20 p-5 text-center text-sm text-muted-foreground">
                      No received invitations.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {receivedInvitations.map((invitation) => (
                        <InvitationItem
                          key={invitation._id}
                          invitation={invitation}
                          isResponding={
                            respondingToInvitationId === invitation._id
                          }
                          onRespond={respondToInvitation}
                        />
                      ))}
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Sent
                  </h3>

                  {sentInvitations.length === 0 ? (
                    <p className="rounded-2xl border border-dashed bg-muted/20 p-5 text-center text-sm text-muted-foreground">
                      No sent invitations.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {sentInvitations.map((invitation) => (
                        <SentInvitationItem
                          key={invitation._id}
                          invitation={invitation}
                        />
                      ))}
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function InvitationItem({ invitation, isResponding, onRespond }) {
  const sender = invitation.sender;

  const fullName = [sender?.firstName, sender?.lastName]
    .filter(Boolean)
    .join(" ");

  const initials = `${
    sender?.firstName?.charAt(0) || ""
  }${sender?.lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm">
      <Avatar className="size-11 shrink-0 border">
        <AvatarImage
          src={sender?.profilePic?.url || ""}
          alt={fullName || "User profile picture"}
          className="object-cover"
        />

        <AvatarFallback>{initials || "U"}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {fullName || "Unknown user"}
        </p>

        <p className="truncate text-xs text-muted-foreground">
          {sender?.email}
        </p>
      </div>

      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          size="icon"
          className="rounded-xl"
          disabled={isResponding}
          onClick={() => onRespond(invitation._id, "accepted")}
          aria-label={`Accept invitation from ${fullName}`}
        >
          <Check className="size-4" />
        </Button>

        <Button
          type="button"
          size="icon"
          variant="outline"
          className="rounded-xl"
          disabled={isResponding}
          onClick={() => onRespond(invitation._id, "declined")}
          aria-label={`Decline invitation from ${fullName}`}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

function SentInvitationItem({ invitation }) {
  const recipient = invitation.recipient;

  const fullName = [recipient?.firstName, recipient?.lastName]
    .filter(Boolean)
    .join(" ");

  const initials = `${
    recipient?.firstName?.charAt(0) || ""
  }${recipient?.lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm">
      <Avatar className="size-11 shrink-0 border">
        <AvatarImage
          src={recipient?.profilePic?.url || ""}
          alt={fullName || "User profile picture"}
          className="object-cover"
        />

        <AvatarFallback>{initials || "U"}</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {fullName || "Unknown user"}
        </p>

        <p className="truncate text-xs text-muted-foreground">
          {recipient?.email}
        </p>
      </div>

      <Badge variant="secondary">Pending</Badge>
    </div>
  );
}
