import { useEffect, useState } from "react";
import { Check, Mail, Search, UserPlus, UsersRound, X } from "lucide-react";

import { axiosInstance } from "@/api/axios";
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserSearchItem } from "@/components/chat/UserSearchItem";
import { UserSearchSkeleton } from "@/components/chat/UserSearchSkeleton";
import { useConversationStore } from "@/store/useConversationStore";
import { useInvitationStore } from "@/store/useInvitationStore";

export function InvitationsDialog() {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("requests");
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);

  const receivedInvitations = useInvitationStore(
    (state) => state.receivedInvitations,
  );
  const sentInvitations = useInvitationStore((state) => state.sentInvitations);
  const isLoadingInvitations = useInvitationStore(
    (state) => state.isLoadingInvitations,
  );
  const respondingToInvitationId = useInvitationStore(
    (state) => state.respondingToInvitationId,
  );
  const sendingToUserId = useInvitationStore((state) => state.sendingToUserId);
  const getInvitations = useInvitationStore((state) => state.getInvitations);
  const respondToInvitation = useInvitationStore(
    (state) => state.respondToInvitation,
  );
  const sendInvitation = useInvitationStore((state) => state.sendInvitation);
  const conversations = useConversationStore((state) => state.conversations);

  const normalizedQuery = query.trim();
  const canSearch = normalizedQuery.length >= 2 && normalizedQuery.length <= 50;

  useEffect(() => {
    if (!open || activeTab !== "find" || !canSearch) {
      return;
    }

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setSearchError("");
        setHasSearched(false);

        const response = await axiosInstance.get("/user/search", {
          params: { q: normalizedQuery },
          signal: abortController.signal,
        });

        setUsers(response.data?.users || []);
        setHasSearched(true);
      } catch (error) {
        if (error?.code === "ERR_CANCELED" || error?.name === "AbortError") {
          return;
        }

        setUsers([]);
        setSearchError(
          error?.response?.data?.message || "Unable to search users.",
        );
        setHasSearched(true);
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [activeTab, canSearch, normalizedQuery, open]);

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);

    if (nextOpen) {
      getInvitations();
      return;
    }

    setActiveTab("requests");
    setQuery("");
    setUsers([]);
    setSearchError("");
    setHasSearched(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="relative shrink-0 rounded-xl"
          aria-label="Manage connections"
        >
          <UsersRound className="size-4" />
          {receivedInvitations.length > 0 && (
            <Badge className="absolute -right-2 -top-2 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
              {receivedInvitations.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-lg">
        <DialogHeader className="border-b bg-muted/35 px-5 py-5">
          <DialogTitle className="text-xl tracking-tight">Connections</DialogTitle>
          <DialogDescription>
            Manage requests or find someone new to chat with.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-1 border-b bg-muted/20 p-2">
          <TabButton
            active={activeTab === "requests"}
            onClick={() => setActiveTab("requests")}
            icon={Mail}
            label="Invitations"
            count={receivedInvitations.length}
          />
          <TabButton
            active={activeTab === "find"}
            onClick={() => setActiveTab("find")}
            icon={UserPlus}
            label="Find people"
          />
        </div>

        {activeTab === "requests" ? (
          <InvitationsPanel
            received={receivedInvitations}
            sent={sentInvitations}
            isLoading={isLoadingInvitations}
            respondingId={respondingToInvitationId}
            onRespond={respondToInvitation}
          />
        ) : (
          <FindPeoplePanel
            query={query}
            onQueryChange={setQuery}
            users={users}
            isSearching={isSearching}
            hasSearched={hasSearched}
            searchError={searchError}
            sentInvitations={sentInvitations}
            receivedInvitations={receivedInvitations}
            conversations={conversations}
            sendingToUserId={sendingToUserId}
            onInvite={(user) => sendInvitation(user._id)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count = 0 }) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
      className="relative rounded-xl"
    >
      <Icon className="size-4" /> {label}
      {count > 0 && <Badge className="ml-1 px-1.5">{count}</Badge>}
    </Button>
  );
}

function InvitationsPanel({
  received,
  sent,
  isLoading,
  respondingId,
  onRespond,
}) {
  return (
    <ScrollArea className="min-h-0 flex-1">
      <div className="min-h-72 space-y-6 p-4">
        {isLoading ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Loading invitations...
          </p>
        ) : (
          <>
            <InvitationSection title="Received" empty="No received invitations.">
              {received.map((invitation) => (
                <ReceivedInvitation
                  key={invitation._id}
                  invitation={invitation}
                  isResponding={respondingId === invitation._id}
                  onRespond={onRespond}
                />
              ))}
            </InvitationSection>
            <InvitationSection title="Sent" empty="No sent invitations.">
              {sent.map((invitation) => (
                <SentInvitation key={invitation._id} invitation={invitation} />
              ))}
            </InvitationSection>
          </>
        )}
      </div>
    </ScrollArea>
  );
}

function FindPeoplePanel({
  query,
  onQueryChange,
  users,
  isSearching,
  hasSearched,
  searchError,
  sentInvitations,
  receivedInvitations,
  conversations,
  sendingToUserId,
  onInvite,
}) {
  const normalizedQuery = query.trim();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search by name or email..."
            maxLength={50}
            autoFocus
            className="h-11 rounded-xl bg-muted/40 pl-9 pr-10"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onQueryChange("")}
              className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="min-h-72 p-4">
          {normalizedQuery.length < 2 && (
            <EmptyState text="Enter at least 2 characters to find people." />
          )}
          {normalizedQuery.length >= 2 && isSearching && <UserSearchSkeleton />}
          {!isSearching && hasSearched && searchError && (
            <EmptyState text={searchError} />
          )}
          {!isSearching && hasSearched && !searchError && users.length === 0 && (
            <EmptyState text="No registered users found." />
          )}
          {!isSearching && !searchError && users.length > 0 && (
            <div className="space-y-2">
              {users.map((user) => (
                <UserSearchItem
                  key={user._id}
                  user={user}
                  onInvite={onInvite}
                  isInviting={sendingToUserId === user._id}
                  isPending={
                    sentInvitations.some(
                      (item) => item.recipient?._id === user._id,
                    ) ||
                    receivedInvitations.some(
                      (item) => item.sender?._id === user._id,
                    )
                  }
                  isConnected={conversations.some(
                    (conversation) =>
                      conversation.type === "direct" &&
                      conversation.participants.some(
                        (participant) => participant._id === user._id,
                      ),
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function InvitationSection({ title, empty, children }) {
  const hasItems = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section>
      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {hasItems ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <p className="rounded-2xl border border-dashed bg-muted/20 p-5 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      )}
    </section>
  );
}

function ReceivedInvitation({ invitation, isResponding, onRespond }) {
  const user = invitation.sender;

  return (
    <InvitationUser user={user}>
      <Button
        type="button"
        size="icon"
        className="rounded-xl"
        disabled={isResponding}
        onClick={() => onRespond(invitation._id, "accepted")}
        aria-label="Accept invitation"
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
        aria-label="Decline invitation"
      >
        <X className="size-4" />
      </Button>
    </InvitationUser>
  );
}

function SentInvitation({ invitation }) {
  return (
    <InvitationUser user={invitation.recipient}>
      <Badge variant="secondary">Pending</Badge>
    </InvitationUser>
  );
}

function InvitationUser({ user, children }) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const initials = `${user?.firstName?.charAt(0) || ""}${
    user?.lastName?.charAt(0) || ""
  }`.toUpperCase();

  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 shadow-sm">
      <Avatar className="size-11 shrink-0 border">
        <AvatarImage
          src={user?.profilePic?.url || ""}
          alt={fullName || "User"}
          className="object-cover"
        />
        <AvatarFallback>{initials || "U"}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{fullName || "Unknown user"}</p>
        <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
      </div>
      <div className="flex shrink-0 gap-2">{children}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex min-h-64 items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
