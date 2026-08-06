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

import { axiosInstance } from "@/shared/api/api-client";
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
import { useAuthStore } from "@/features/auth/store/useAuthStore";
import { useConversationStore } from "@/features/chat/store/useConversationStore";

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

  const dialogTrigger =
    typeof children === "function" ? (
      children(() => handleOpenChange(true))
    ) : (
      <DialogTrigger asChild>{children}</DialogTrigger>
    );

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
        {dialogTrigger}
        <DialogContent className="flex h-[min(760px,94dvh)] w-[calc(100%-1rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-2xl border-foreground/10 p-0 sm:w-[calc(100%-2rem)] sm:max-w-4xl">
        <DialogHeader className="shrink-0 border-b px-5 py-4 text-left sm:px-6">
          <DialogTitle className="text-lg tracking-tight">
            Group details
          </DialogTitle>
          <DialogDescription className="text-xs leading-5">
            Group profile, members, and permissions
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid gap-4 px-3 py-4 sm:px-5 lg:grid-cols-[minmax(240px,0.8fr)_minmax(360px,1.35fr)] lg:items-start lg:gap-5">
            <div className="rounded-2xl border bg-card p-4 sm:p-5">
              <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left lg:flex-col lg:text-center">
              <div className="relative">
                <Avatar className="size-20 border-2 border-background ring-1 ring-foreground/10 sm:size-22">
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
                      className="absolute bottom-0 right-0 size-8 rounded-full border-2 border-background shadow-sm"
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
                  <div className="flex min-w-0 gap-2">
                    <Input
                      value={groupName}
                      onChange={(event) => setGroupName(event.target.value)}
                      minLength={2}
                      maxLength={50}
                      aria-label="Group name"
                      className="h-10 rounded-xl bg-background font-semibold sm:text-left lg:text-center"
                    />
                    <Button
                      type="button"
                      onClick={saveName}
                      disabled={
                        store.isUpdatingGroup ||
                        groupName.trim().length < 2 ||
                        groupName.trim() === conversation.name
                      }
                      size="sm"
                      className="h-10 shrink-0 rounded-xl px-4"
                    >
                      {pendingAction === "name" && (
                        <Loader2 className="size-4 animate-spin" />
                      )}
                      {pendingAction === "name" ? "Saving..." : "Save name"}
                    </Button>
                  </div>
                ) : (
                  <h3 className="text-lg font-semibold tracking-tight">{conversation.name}</h3>
                )}
                <p className="mt-2 text-xs font-medium text-muted-foreground">
                  {conversation.participants?.length || 0} members · {adminIds.size} {adminIds.size === 1 ? "admin" : "admins"}
                </p>
              </div>
              </div>
            </div>

            {isCurrentUserAdmin && (
              <section className="rounded-2xl border bg-card p-4 lg:col-start-1">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">Add members</h3>
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
                <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl bg-muted/35 p-2">
                  {isLoadingContacts ? (
                    <div className="flex h-20 items-center justify-center"><Loader2 className="size-5 animate-spin" /></div>
                  ) : availableContacts.length === 0 ? (
                    <p className="p-4 text-center text-sm text-muted-foreground">All connected contacts are already members.</p>
                  ) : (
                    availableContacts.map((contact) => (
                      <label key={contact._id} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 hover:bg-background">
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

            <section className="overflow-hidden rounded-2xl border bg-card lg:col-start-2 lg:row-span-3 lg:row-start-1">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold">Members</h3>
                <Badge variant="secondary">{conversation.participants?.length || 0}</Badge>
              </div>
              <div className="divide-y lg:max-h-[590px] lg:overflow-y-auto lg:[scrollbar-width:thin]">
                {(conversation.participants || []).map((member) => {
                  const memberId = getId(member);
                  const memberIsAdmin = adminIds.has(memberId);
                  const name = [member.firstName, member.lastName].filter(Boolean).join(" ");
                  return (
                    <div
                      key={memberId}
                      className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-3 transition-colors hover:bg-muted/25 sm:gap-3 sm:px-4"
                    >
                      <div className="relative shrink-0">
                        <Avatar className="size-10">
                          <AvatarImage src={member.profilePic?.url} alt={name} />
                          <AvatarFallback>{`${member.firstName?.[0] || ""}${member.lastName?.[0] || ""}`}</AvatarFallback>
                        </Avatar>
                        {member.isOnline && (
                          <span
                            className="absolute bottom-0 right-0 size-3 rounded-full border-2 border-card bg-emerald-500"
                            aria-label={`${name} is online`}
                            title="Online"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-medium">{name}</p>
                          {memberIsAdmin && <Badge variant="secondary"><Crown className="size-3" /> Admin</Badge>}
                          {memberId === currentUserId && <Badge variant="outline">You</Badge>}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      {isCurrentUserAdmin && memberId !== currentUserId && (
                        <div className="flex shrink-0 items-center justify-end gap-0.5">
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

            <div className="flex flex-col gap-2 rounded-2xl border border-destructive/15 p-3 lg:col-start-1">
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
