import { ArrowLeft, Mail, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ProfilePictureUpload from "@/components/profile/ProfilePictureUpload";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useAuthStore } from "@/store/useAuthStore";

function Profile() {
  const navigate = useNavigate();

  const authUser = useAuthStore((state) => state.authUser);

  const fullName = [authUser?.firstName, authUser?.lastName]
    .filter(Boolean)
    .join(" ");

  const handleGoHome = () => {
    navigate("/chat");
  };

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Button
          type="button"
          variant="ghost"
          className="mb-4"
          onClick={handleGoHome}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chat
        </Button>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Profile</CardTitle>

            <CardDescription>
              Manage your profile picture and personal information.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            <ProfilePictureUpload />

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <UserRound className="h-5 w-5 text-muted-foreground" />
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Full name</p>

                  <p className="font-medium">{fullName || "Not available"}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Email</p>

                  <p className="truncate font-medium">
                    {authUser?.email || "Not available"}
                  </p>
                </div>
              </div>

              {authUser?.bio && (
                <div className="rounded-lg border p-4">
                  <p className="mb-1 text-xs text-muted-foreground">Bio</p>

                  <p className="text-sm">{authUser.bio}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default Profile;
