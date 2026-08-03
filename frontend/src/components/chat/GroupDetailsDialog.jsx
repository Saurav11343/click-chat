import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Camera,
  Crown,
  Loader2,
  LogOut,
  ShieldPlus,
  Trash2,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";

import { axiosInstance } from "@/api/axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/useAuthStore";
import { useConversationStore } from "@/store/useConversationStore";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const getId = (value) => (value?._id || value)?.toString();

export function GroupDetailsDialog({ conversation, children, onRemoved }) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState(conversation.name || "");
  const [contacts, setContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const imageInputRef = useRef(null);
  const currentUserId = useAuthStore((state) => state.authUser?._id);
  const store = useConversationStore();

  const adminIds = new Set((conversation.groupAdmins || []).map(getId));
  const memberIds = new Set((conversation.participants || []).map(getId));
  const isCurrentUserAdmin = adminIds.has(currentUserId);
  const availableContacts = contacts.filter(
    (contact) => !memberIds.has(contact._id),
  );

  useEffect(() => {
    if (!open || !isCurrentUserAdmin) return;
    let isMounted = true;
    axiosInstance
      .get("/invitations/contacts")
      .then((response) => {
        if (isMounted) setContacts(response.data.contacts || []);
      })
      .catch((error) => {
        toast.error(error.response?.data?.message || "Unable to load contacts.");
      })
      .finally(() => {
        if (isMounted) setIsLoadingContacts(false);
      });
    return () => {
      isMounted = false;
    };
  }, [open, isCurrentUserAdmin]);

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setGroupName(conversation.name || "");
      if (isCurrentUserAdmin) setIsLoadingContacts(true);
    } else {
      setSelectedIds([]);
    }
  };

  const saveName = async () => {
    setPendingAction("name");
    try {
      await store.updateGroup(conversation.id, { groupName: groupName.trim() });
    } finally {
      setPendingAction(null);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return;
    if (!IMAGE_TYPES.has(file.type)) {
      toast.error("Use a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Group images cannot exceed 5 MB.");
      return;
    }
    setPendingAction("image");
    try {
      await store.updateGroupImage(conversation.id, file);
      if (imageInputRef.current) imageInputRef.current.value = "";
    } finally {
      setPendingAction(null);
    }
  };

  const addMembers = async () => {
    setPendingAction("add-members");
    try {
      const updated = await store.addGroupParticipants(
        conversation.id,
        selectedIds,
      );
      if (updated) setSelectedIds([]);
    } finally {
      setPendingAction(null);
    }
  };

  const updateAdmin = async (memberId, action) => {
    setPendingAction(`admin-${memberId}`);
    try {
      await store.updateGroupAdmin(conversation.id, memberId, action);
    } finally {
      setPendingAction(null);
    }
  };

  const removeMember = async (memberId) => {
    setPendingAction(`remove-${memberId}`);
    try {
      await store.removeGroupParticipant(conversation.id, memberId);
    } finally {
      setPendingAction(null);
    }
  };

  const leaveGroup = async () => {
    setPendingAction("leave");
    try {
      if (await store.leaveGroup(conversation.id)) {
        setOpen(false);
        setConfirmation(null);
        onRemoved?.();
      }
    } finally {
      setPendingAction(null);
    }
  };

  const deleteGroup = async () => {
    setPendingAction("delete");
    try {
      if (await store.deleteGroup(conversation.id)) {
        setOpen(false);
        setConfirmation(null);
        onRemoved?.();
      }
    } finally {
      setPendingAction(null);
    }
  };

  const isConfirming = pendingAction === confirmation;
  const confirmConfig = confirmation === "delete"
    ? {
        title: "Delete this group?",
        description:
          "This permanently deletes the group, its messages, and uploaded files for every member. This cannot be undone.",
        confirmLabel: "Delete permanently",
        loadingLabel: "Deleting...",
        action: deleteGroup,
      }
    : {
        title: "Leave this group?",
        description:
          "You will stop receiving messages and will need an administrator to add you again.",
        confirmLabel: "Leave group",
        loadingLabel: "Leaving...",
        action: leaveGroup,
      };

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex h-[min(780px,92dvh)] w-[calc(100%-1.5rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-3xl p-0">
        <DialogHeader className="shrink-0 border-b bg-muted/30 px-5 py-5 text-left sm:px-6">
          <DialogTitle className="text-xl tracking-tight">
            Group details
          </DialogTitle>
          <DialogDescription className="leading-5">
            View members and manage this group.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="space-y-6 px-4 py-5 sm:px-6">
            <div className="flex flex-col items-center gap-4 rounded-2xl border bg-muted/20 p-5 sm:flex-row">
              <div className="relative">
                <Avatar className="size-20 ring-2 ring-background">
                  <AvatarImage src={conversation.image} alt={conversation.name} className="object-cover" />
                  <AvatarFallback className="text-xl">{conversation.initials}</AvatarFallback>
                </Avatar>
                {isCurrentUserAdmin && (
                  <>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(event) => uploadImage(event.target.files?.[0])}
                    />
                    <Button
                      type="button"
                      size="icon-sm"
                      className="absolute -bottom-1 -right-1 rounded-lg"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={store.isUpdatingGroup}
                      aria-label="Change group image"
                    >
                      {pendingAction === "image" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Camera className="size-4" />
                      )}
                    </Button>
                  </>
                )}
              </div>

              <div className="w-full min-w-0 flex-1">
                {isCurrentUserAdmin ? (
                  <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
                    <Input
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                      minLength={2}
                      maxLength={50}
                      className="rounded-xl"
                    />
                    <Button
                      type="button"
                      onClick={saveName}
                      disabled={
                        store.isUpdatingGroup ||
                        groupName.trim().length < 2 ||
                        groupName.trim() === conversation.name
                      }
                      className="rounded-xl"
                    >
                      {pendingAction === "name" && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {pendingAction === "name" ? "Saving..." : "Save name"}
                    </Button>
                  </div>
                ) : (
                  <h3 className="text-lg font-semibold">{conversation.name}</h3>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {conversation.participants?.length || 0} members
                </p>
              </div>
            </div>

            {isCurrentUserAdmin && (
              <section>
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-semibold">Add members</h3>
                    <p className="text-xs text-muted-foreground">Choose from your connected contacts.</p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={addMembers}
                    disabled={store.isUpdatingGroup || selectedIds.length === 0}
                    className="w-full rounded-lg sm:w-auto"
                  >
                    {pendingAction === "add-members" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserPlus className="size-4" />
                    )}
                    {pendingAction === "add-members" ? "Adding..." : "Add selected"}
                  </Button>
                </div>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border p-2">
                  {isLoadingContacts ? (
                    <div className="flex h-20 items-center justify-center"><Loader2 className="size-5 animate-spin" /></div>
                  ) : availableContacts.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">All connected contacts are already members.</p>
                  ) : (
                    availableContacts.map((contact) => (
                      <label key={contact._id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-muted/50">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(contact._id)}
                          onChange={() => setSelectedIds((current) => current.includes(contact._id) ? current.filter((id) => id !== contact._id) : [...current, contact._id])}
                        />
                        <span className="truncate text-sm">{contact.firstName} {contact.lastName}</span>
                      </label>
                    ))
                  )}
                </div>
              </section>
            )}

            <section>
              <h3 className="mb-3 font-semibold">Members</h3>
              <div className="space-y-2">
                {(conversation.participants || []).map((member) => {
                  const memberId = getId(member);
                  const memberIsAdmin = adminIds.has(memberId);
                  const name = [member.firstName, member.lastName].filter(Boolean).join(" ");
                  return (
                    <div
                      key={memberId}
                      className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-2xl border p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]"
                    >
                      <Avatar className="size-10">
                        <AvatarImage src={member.profilePic?.url} alt={name} />
                        <AvatarFallback>{`${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{name}</p>
                          {memberIsAdmin && <Badge variant="secondary"><Crown className="size-3" /> Admin</Badge>}
                          {memberId === currentUserId && <Badge variant="outline">You</Badge>}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      {isCurrentUserAdmin && memberId !== currentUserId && (
                        <div className="col-span-2 flex justify-end gap-1 border-t pt-2 sm:col-span-1 sm:border-0 sm:pt-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={store.isUpdatingGroup}
                            onClick={() => updateAdmin(memberId, memberIsAdmin ? "remove" : "add")}
                            aria-label={memberIsAdmin ? "Remove administrator" : "Make administrator"}
                          >
                            {pendingAction === `admin-${memberId}` ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <ShieldPlus className="size-4" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            disabled={store.isUpdatingGroup}
                            onClick={() => removeMember(memberId)}
                            aria-label="Remove member"
                            className="text-destructive"
                          >
                            {pendingAction === `remove-${memberId}` ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <UserMinus className="size-4" />
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="flex flex-col gap-2 border-t pt-5 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => setConfirmation("leave")} disabled={store.isUpdatingGroup} className="w-full rounded-xl text-destructive sm:w-auto">
                {pendingAction === "leave" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <LogOut className="size-4" />
                )}
                {pendingAction === "leave" ? "Leaving..." : "Leave group"}
              </Button>
              {isCurrentUserAdmin && (
                <Button type="button" variant="destructive" onClick={() => setConfirmation("delete")} disabled={store.isUpdatingGroup} className="w-full rounded-xl sm:w-auto">
                  {pendingAction === "delete" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  {pendingAction === "delete" ? "Deleting..." : "Delete group"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog
      open={Boolean(confirmation)}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isConfirming) setConfirmation(null);
      }}
    >
      <DialogContent
        className="w-[calc(100%-2rem)] max-w-md gap-0 overflow-hidden rounded-3xl p-0"
        showCloseButton={false}
        onEscapeKeyDown={(event) => {
          if (isConfirming) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isConfirming) event.preventDefault();
        }}
      >
        <DialogHeader className="px-6 pb-5 pt-6 text-left">
          <span className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </span>
          <DialogTitle className="text-xl tracking-tight">
            {confirmConfig.title}
          </DialogTitle>
          <DialogDescription className="leading-6">
            {confirmConfig.description}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="m-0 flex-row justify-end rounded-none px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmation(null)}
            disabled={isConfirming}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={confirmConfig.action}
            disabled={isConfirming}
            className="rounded-xl"
          >
            {isConfirming && <Loader2 className="size-4 animate-spin" />}
            {isConfirming
              ? confirmConfig.loadingLabel
              : confirmConfig.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
