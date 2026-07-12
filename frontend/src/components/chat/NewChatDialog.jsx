"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Search, UserSearch, X } from "lucide-react";
import { toast } from "sonner";

import { axiosInstance } from "@/api/axios";
import { userSearchSchema } from "@/validations/user.validation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { UserSearchItem } from "@/components/chat/UserSearchItem";
import { UserSearchSkeleton } from "@/components/chat/UserSearchSkeleton";

export function NewChatDialog({ children }) {
  const [open, setOpen] = React.useState(false);
  const [users, setUsers] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState("");
  const [retryCount, setRetryCount] = React.useState(0);
  const [hasCompletedSearch, setHasCompletedSearch] = React.useState(false);
  const form = useForm({
    resolver: zodResolver(userSearchSchema),
    defaultValues: {
      query: "",
    },
    mode: "onChange",
  });

  const query = useWatch({
    control: form.control,
    name: "query",
  });

  const normalizedQuery = query?.trim() || "";

  const canSearch = normalizedQuery.length >= 2 && normalizedQuery.length <= 50;

  React.useEffect(() => {
    if (!open || !canSearch) {
      return;
    }

    const abortController = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setHasCompletedSearch(false);
        setSearchError("");

        const response = await axiosInstance.get("/user/search", {
          params: {
            q: normalizedQuery,
          },
          signal: abortController.signal,
        });

        setUsers(response.data?.users || []);
        setHasCompletedSearch(true);
      } catch (error) {
        if (
          error?.name === "CanceledError" ||
          error?.name === "AbortError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error("Search users error:", error);

        setUsers([]);
        setSearchError(
          error?.response?.data?.message ||
            "Unable to search users. Please try again.",
        );
        setHasCompletedSearch(true);
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
  }, [open, canSearch, normalizedQuery, retryCount]);

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      form.reset();
      setUsers([]);
      setSearchError("");
      setIsSearching(false);
      setHasCompletedSearch(false);
      setRetryCount(0);
    }
  };

  const handleInvite = (user) => {
    const fullName = [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ");

    toast.info("Chat invitation feature is coming next.", {
      description: `You selected ${fullName || user?.email}.`,
    });
  };

  const handleClearSearch = () => {
    form.setValue("query", "", {
      shouldValidate: true,
      shouldDirty: true,
    });

    setUsers([]);
    setSearchError("");
    setIsSearching(false);
    setHasCompletedSearch(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button type="button">
            <UserSearch className="size-4" />
            New Chat
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Start a new chat</DialogTitle>

          <DialogDescription>
            Search for another user by name or email.
          </DialogDescription>
        </DialogHeader>

        <div className="border-b p-4">
          <form onSubmit={(event) => event.preventDefault()}>
            <FieldGroup>
              <Controller
                name="query"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        {...field}
                        onChange={(event) => {
                          field.onChange(event);
                          setHasCompletedSearch(false);
                          setSearchError("");
                        }}
                        id="new-chat-user-search"
                        placeholder="Search by name or email..."
                        autoComplete="off"
                        autoFocus
                        aria-invalid={fieldState.invalid}
                        className="h-11 pl-9 pr-10"
                      />

                      {field.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={handleClearSearch}
                          className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
                          aria-label="Clear search"
                        >
                          <X className="size-4" />
                        </Button>
                      )}
                    </div>

                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </form>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="min-h-72 p-4">
            {normalizedQuery.length === 0 && <SearchInitialState />}

            {normalizedQuery.length === 1 && <SearchHintState />}

            {canSearch && isSearching && <UserSearchSkeleton />}

            {canSearch && !isSearching && hasCompletedSearch && searchError && (
              <SearchErrorState
                message={searchError}
                onRetry={() => {
                  setSearchError("");
                  setHasCompletedSearch(false);
                  setRetryCount((current) => current + 1);
                }}
              />
            )}

            {canSearch &&
              !isSearching &&
              hasCompletedSearch &&
              !searchError &&
              users.length === 0 && <NoUsersFound />}

            {canSearch &&
              !isSearching &&
              hasCompletedSearch &&
              !searchError &&
              users.length > 0 && (
                <div className="space-y-2">
                  <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {users.length}{" "}
                    {users.length === 1 ? "user found" : "users found"}
                  </p>

                  {users.map((user) => (
                    <UserSearchItem
                      key={user._id}
                      user={user}
                      onInvite={handleInvite}
                    />
                  ))}
                </div>
              )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SearchInitialState() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <UserSearch className="size-7" />
      </div>

      <h3 className="mt-4 font-medium">Find someone to chat with</h3>

      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Search for registered ClickChat users using their name or email address.
      </p>
    </div>
  );
}

function SearchHintState() {
  return (
    <div className="flex min-h-64 items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">
        Enter at least 2 characters to search.
      </p>
    </div>
  );
}

function NoUsersFound() {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <UserSearch className="size-7 text-muted-foreground" />
      </div>

      <h3 className="mt-4 font-medium">No users found</h3>

      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        No registered user matches.
      </p>
    </div>
  );
}

function SearchErrorState({ message, onRetry }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
      <h3 className="font-medium">Search failed</h3>

      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{message}</p>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-4"
      >
        Try again
      </Button>
    </div>
  );
}
