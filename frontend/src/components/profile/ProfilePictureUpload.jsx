import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, Upload, UserRound, X } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

  const [selectedFile, setSelectedFile] = useState(null);

  const [previewUrl, setPreviewUrl] = useState("");

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

    setSelectedFile(null);
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

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!validateImage(file)) {
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const localPreviewUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(localPreviewUrl);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image");
      return;
    }

    const success = await updateProfilePic(selectedFile);

    if (success) {
      clearSelectedImage();
      setIsDialogOpen(false);
    }
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
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
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
              className="absolute bottom-1 right-1 rounded-full shadow-md"
              aria-label="Change profile picture"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </div>

        <div className="text-center">
          <p className="font-semibold">{fullName || "User"}</p>

          <p className="text-sm text-muted-foreground">
            Click the camera icon to change your photo
          </p>
        </div>
      </div>

      <DialogContent
        className="sm:max-w-md"
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
        <DialogHeader>
          <DialogTitle>Update profile picture</DialogTitle>

          <DialogDescription>
            Upload a JPEG, PNG or WebP image smaller than 5 MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-40 w-40 border-4 border-background shadow-md">
                <AvatarImage
                  src={previewUrl || profilePicUrl}
                  alt="Selected profile picture preview"
                  className="object-cover"
                />

                <AvatarFallback className="bg-muted text-4xl font-semibold">
                  {initials || (
                    <UserRound className="h-14 w-14 text-muted-foreground" />
                  )}
                </AvatarFallback>
              </Avatar>

              {selectedFile && !isUpdatingProfilePic && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -right-2 -top-2 h-8 w-8 rounded-full"
                  onClick={clearSelectedImage}
                  aria-label="Remove selected image"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <Input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUpdatingProfilePic}
          />

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isUpdatingProfilePic}
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="mr-2 h-4 w-4" />

            {selectedFile ? "Choose another image" : "Choose image"}
          </Button>

          {selectedFile && (
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="truncate text-sm font-medium">
                {selectedFile.name}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isUpdatingProfilePic}
            >
              Cancel
            </Button>
          </DialogClose>

          <Button
            type="button"
            disabled={!selectedFile || isUpdatingProfilePic}
            onClick={handleUpload}
          >
            {isUpdatingProfilePic ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload picture
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ProfilePictureUpload;
