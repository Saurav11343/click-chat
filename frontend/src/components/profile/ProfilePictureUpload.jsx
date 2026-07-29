import { useEffect, useRef, useState } from "react";
import {
  Camera,
  ImagePlus,
  Loader2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

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

import { useAuthStore } from "@/store/useAuthStore";
import { useUserStore } from "@/store/useUserStore";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const getProfilePicUrl = (profilePic) => {
  if (!profilePic) {
    return "";
  }

  /*
   * Temporary support for old users whose profilePic
   * may still be stored as a string.
   */
  if (typeof profilePic === "string") {
    return profilePic;
  }

  return profilePic.url || "";
};

function ProfilePictureUpload() {
  const fileInputRef = useRef(null);

  const authUser = useAuthStore((state) => state.authUser);

  const updateProfilePic = useUserStore((state) => state.updateProfilePic);

  const isUpdatingProfilePic = useUserStore(
    (state) => state.isUpdatingProfilePic,
  );

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [previewUrl, setPreviewUrl] = useState("");

  const [isDragging, setIsDragging] = useState(false);

  const profilePicUrl = getProfilePicUrl(authUser?.profilePic);

  const initials = `${authUser?.firstName?.[0] || ""}${
    authUser?.lastName?.[0] || ""
  }`.toUpperCase();

  const fullName = [authUser?.firstName, authUser?.lastName]
    .filter(Boolean)
    .join(" ");

  const clearSelectedImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const validateImage = (file) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only JPEG, PNG and WebP images are allowed");

      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image size must be less than 5 MB");

      return false;
    }

    return true;
  };

  const selectImage = async (file) => {
    if (!file) {
      return;
    }

    if (!validateImage(file)) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const localPreviewUrl = URL.createObjectURL(file);

    setPreviewUrl(localPreviewUrl);

    const success = await updateProfilePic(file);

    if (success) {
      URL.revokeObjectURL(localPreviewUrl);
      setPreviewUrl("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setIsDialogOpen(false);
    }
  };

  const handleFileChange = (event) => {
    selectImage(event.target.files?.[0]);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);

    if (isUpdatingProfilePic) {
      return;
    }

    selectImage(event.dataTransfer.files?.[0]);
  };

  const handleDialogChange = (open) => {
    if (isUpdatingProfilePic) {
      return;
    }

    setIsDialogOpen(open);

    if (!open) {
      clearSelectedImage();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Avatar className="size-32 border-4 border-background bg-background shadow-xl ring-1 ring-foreground/10 sm:size-36">
            <AvatarImage
              src={profilePicUrl}
              alt={
                fullName
                  ? `${fullName}'s profile picture`
                  : "User profile picture"
              }
              className="object-cover"
            />

            <AvatarFallback className="bg-muted text-3xl font-semibold">
              {initials || (
                <UserRound className="h-12 w-12 text-muted-foreground" />
              )}
            </AvatarFallback>
          </Avatar>

          <DialogTrigger asChild>
            <Button
              type="button"
              size="icon"
              className="absolute bottom-1 right-1 rounded-xl border-4 border-background shadow-lg sm:bottom-2 sm:right-2"
              aria-label="Change profile picture"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </div>

        <div className="text-center">
          <p className="text-xl font-semibold tracking-tight sm:text-2xl">{fullName || "User"}</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Click the camera to update your photo
          </p>
        </div>
      </div>

      <DialogContent
        className="gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-lg"
        onInteractOutside={(event) => {
          if (isUpdatingProfilePic) {
            event.preventDefault();
          }
        }}
        onEscapeKeyDown={(event) => {
          if (isUpdatingProfilePic) {
            event.preventDefault();
          }
        }}
      >
        <DialogHeader className="border-b bg-muted/25 px-6 py-5 text-left">
          <DialogTitle className="text-xl tracking-tight">Update profile picture</DialogTitle>

          <DialogDescription>
            Choose a clear photo so friends can recognize you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-6">
          <Input
            ref={fileInputRef}
            id="profile-picture-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUpdatingProfilePic}
          />

          <div
            onDragEnter={(event) => {
              event.preventDefault();
              if (!isUpdatingProfilePic) setIsDragging(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setIsDragging(false);
              }
            }}
            onDrop={handleDrop}
            onClick={() => {
              if (!isUpdatingProfilePic) fileInputRef.current?.click();
            }}
            onKeyDown={(event) => {
              if (
                !isUpdatingProfilePic &&
                (event.key === "Enter" || event.key === " ")
              ) {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={isUpdatingProfilePic ? -1 : 0}
            aria-label="Choose a new profile picture"
            className={`relative overflow-hidden rounded-2xl border border-dashed p-5 transition-all ${
              isDragging
                ? "border-primary bg-primary/8 ring-4 ring-primary/10"
                : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/35"
            } ${
              isUpdatingProfilePic
                ? "cursor-wait"
                : "cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
            }`}
          >
            <div className="flex flex-col items-center text-center sm:flex-row sm:text-left">
              <div className="relative shrink-0">
                <Avatar className="size-28 border-4 border-background bg-background shadow-lg ring-1 ring-foreground/10 sm:size-32">
                  <AvatarImage
                    src={previewUrl || profilePicUrl}
                    alt="Selected profile picture preview"
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-muted text-3xl font-semibold">
                    {initials || <UserRound className="size-12 text-muted-foreground" />}
                  </AvatarFallback>
                </Avatar>

                {isUpdatingProfilePic && (
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-background/65 backdrop-blur-[2px]">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                      <Loader2 className="size-5 animate-spin" />
                    </span>
                  </span>
                )}
              </div>

              <div className="mt-4 min-w-0 flex-1 sm:ml-5 sm:mt-0">
                <p className="font-medium">
                  {isUpdatingProfilePic
                    ? "Uploading your photo..."
                    : "Drop your photo here"}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {isUpdatingProfilePic
                    ? "This window will close when the upload is complete."
                    : "Or click anywhere to browse · JPEG, PNG or WebP · Maximum 5 MB"}
                </p>
              </div>
            </div>

            {isDragging && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur-sm">
                <div className="text-center">
                  <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <ImagePlus className="size-5" />
                  </span>
                  <p className="mt-3 text-sm font-medium">Release to select image</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProfilePictureUpload;
