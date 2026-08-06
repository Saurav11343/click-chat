import { useEffect, useState } from "react";
import { Check, Loader2, MessageSquarePlus, Users } from "lucide-react";
import { toast } from "sonner";

import { axiosInstance } from "@/shared/api/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useConversationStore } from "@/features/chat/store/useConversationStore";

export function CreateGroupDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [contacts, setContacts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const createGroup = useConversationStore((state) => state.createGroup);
  const isUpdatingGroup = useConversationStore(
    (state) => state.isUpdatingGroup,
  );

  useEffect(() => {
    if (!open) return;

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
  }, [open]);

  const handleOpenChange = (nextOpen) => {
    if (isUpdatingGroup) return;
    if (nextOpen) setIsLoadingContacts(true);
    setOpen(nextOpen);
    if (!nextOpen) {
      setGroupName("");
      setSelectedIds([]);
    }
  };

  const toggleContact = (contactId) => {
    setSelectedIds((current) =>
      current.includes(contactId)
        ? current.filter((id) => id !== contactId)
        : [...current, contactId],
    );
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    const conversation = await createGroup({
      groupName: groupName.trim(),
      participantIds: selectedIds,
    });
    if (conversation) {
      setOpen(false);
      setGroupName("");
      setSelectedIds([]);
      onCreated?.(conversation._id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0 rounded-xl"
          aria-label="Create group"
        >
          <MessageSquarePlus className="size-4" />
        </Button>
      </DialogTrigger>

      <DialogContent className="flex h-[min(720px,90dvh)] w-[calc(100%-2rem)] max-w-xl flex-col gap-0 overflow-hidden rounded-3xl p-0">
        <DialogHeader className="shrink-0 border-b bg-muted/30 px-5 py-5 text-left sm:px-6">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <MessageSquarePlus className="size-5" />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-xl tracking-tight">
                Create a group
              </DialogTitle>
              <DialogDescription className="mt-1 leading-5">
                Give your group a name and choose at least two contacts.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleCreate}
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <div className="shrink-0 border-b bg-background px-5 py-4 sm:px-6">
            <label
              htmlFor="group-name"
              className="mb-2 block text-sm font-medium"
            >
              Group name
            </label>
            <Input
              id="group-name"
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Weekend plans"
              minLength={2}
              maxLength={50}
              autoFocus
              required
              className="h-11 rounded-xl bg-muted/25"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>2–50 characters</span>
              <span>{groupName.length}/50</span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Select members</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Connected contacts only
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {selectedIds.length} selected
              </span>
            </div>

            <div className="space-y-2">
              {isLoadingContacts ? (
                <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-muted/20">
                  <Loader2 className="size-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">
                    Loading your contacts…
                  </p>
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed bg-muted/20 px-6 text-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Users className="size-6" />
                  </span>
                  <p className="mt-3 text-sm font-medium">No contacts available</p>
                  <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                    Connect with at least two people before creating a group.
                  </p>
                </div>
              ) : (
                contacts.map((contact) => {
                  const selected = selectedIds.includes(contact._id);
                  const name = [contact.firstName, contact.lastName]
                    .filter(Boolean)
                    .join(" ");
                  return (
                    <button
                      key={contact._id}
                      type="button"
                      onClick={() => toggleContact(contact._id)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        selected
                          ? "border-primary/40 bg-primary/8 shadow-sm ring-1 ring-primary/10"
                          : "border-border/80 hover:border-primary/20 hover:bg-muted/50"
                      }`}
                    >
                      <Avatar className="size-10">
                        <AvatarImage src={contact.profilePic?.url} alt={name} />
                        <AvatarFallback>
                          {`${contact.firstName?.[0] || ""}${contact.lastName?.[0] || ""}`}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{name}</p>
                        <p className="truncate text-xs text-muted-foreground">{contact.email}</p>
                      </div>
                      <span className={`flex size-6 shrink-0 items-center justify-center rounded-full border transition-colors ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}>
                        {selected && <Check className="size-3.5" />}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t bg-background px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isUpdatingGroup}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isUpdatingGroup ||
                groupName.trim().length < 2 ||
                selectedIds.length < 2
              }
              className="rounded-xl"
            >
              {isUpdatingGroup && <Loader2 className="size-4 animate-spin" />}
              {isUpdatingGroup ? "Creating..." : "Create group"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
