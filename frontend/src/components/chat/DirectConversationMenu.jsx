import { useState } from "react";
import { AlertTriangle, Loader2, MessageSquareX, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConversationStore } from "@/store/useConversationStore";
import { useMessageStore } from "@/store/useMessageStore";

const ACTIONS = {
  clear: {
    title: "Clear this chat?",
    description:
      "All messages and shared uploads will be permanently removed for both participants. The conversation will remain available.",
    confirmLabel: "Clear chat",
    loadingLabel: "Clearing...",
    icon: MessageSquareX,
  },
  delete: {
    title: "Delete this conversation?",
    description:
      "The connection, every message, and all shared uploads will be permanently deleted for both participants. You will need to send a new invitation to chat again.",
    confirmLabel: "Delete conversation",
    loadingLabel: "Deleting...",
    icon: Trash2,
  },
};

export function DirectConversationMenu({ conversationId, onDeleted, children }) {
  const [action, setAction] = useState(null);
  const isManaging = useConversationStore((state) => state.isManagingConversation);
  const clearConversation = useConversationStore((state) => state.clearDirectConversation);
  const deleteConversation = useConversationStore((state) => state.deleteDirectConversation);
  const handleConversationCleared = useMessageStore((state) => state.handleConversationCleared);
  const config = action ? ACTIONS[action] : null;
  const ActionIcon = config?.icon;

  const handleConfirm = async () => {
    if (action === "clear") {
      if (await clearConversation(conversationId)) {
        handleConversationCleared(conversationId);
        setAction(null);
      }
      return;
    }

    if (action === "delete" && (await deleteConversation(conversationId))) {
      setAction(null);
      onDeleted?.();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-56 rounded-xl p-1.5">
          <DropdownMenuItem className="gap-3 py-2.5" onSelect={() => setAction("clear")}>
            <MessageSquareX className="size-4" />
            <div><p className="font-medium">Clear chat</p><p className="text-xs text-muted-foreground">Remove all messages</p></div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-3 py-2.5 text-destructive focus:text-destructive" onSelect={() => setAction("delete")}>
            <Trash2 className="size-4" />
            <div><p className="font-medium">Delete conversation</p><p className="text-xs opacity-70">Permanently remove everything</p></div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={Boolean(action)} onOpenChange={(open) => { if (!open && !isManaging) setAction(null); }}>
        <DialogContent
          className="w-[calc(100%-2rem)] max-w-md gap-0 overflow-hidden rounded-3xl p-0"
          showCloseButton={false}
          onEscapeKeyDown={(event) => { if (isManaging) event.preventDefault(); }}
          onInteractOutside={(event) => { if (isManaging) event.preventDefault(); }}
        >
          {config && (
            <>
              <DialogHeader className="px-6 pb-5 pt-6 text-left">
                <span className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-5" />
                </span>
                <DialogTitle className="text-xl tracking-tight">{config.title}</DialogTitle>
                <DialogDescription className="leading-6">{config.description}</DialogDescription>
              </DialogHeader>
              <DialogFooter className="m-0 flex-row justify-end rounded-none px-6 py-4">
                <Button type="button" variant="outline" onClick={() => setAction(null)} disabled={isManaging} className="rounded-xl">Cancel</Button>
                <Button type="button" variant="destructive" onClick={handleConfirm} disabled={isManaging} className="rounded-xl">
                  {isManaging ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    ActionIcon && <ActionIcon className="size-4" />
                  )}
                  {isManaging ? config.loadingLabel : config.confirmLabel}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
