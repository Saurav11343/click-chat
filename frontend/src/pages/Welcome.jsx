import { MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function Welcome() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <MessageCircle size={32} />
          </div>

          <CardTitle className="text-3xl">Welcome to ChatApp</CardTitle>

          <CardDescription>
            Connect with friends through real-time messaging.
          </CardDescription>

          <div className="mt-6 flex flex-col gap-3">
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>

            <Button variant="outline" asChild>
              <Link to="/register">Create Account</Link>
            </Button>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}

export default Welcome;
