import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome } from "lucide-react";

export default function Login() {
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Life | Ordered</CardTitle>
          <CardDescription>
            Sign in to manage your goals, tasks, and habits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3"
            size="lg"
            data-testid="button-google-signin"
          >
            <Chrome className="w-5 h-5" />
            Sign in with Google
          </Button>
          <p className="text-center text-sm text-gray-500 dark:text-slate-400 mt-4">
            Secure authentication powered by Google
          </p>
        </CardContent>
      </Card>
    </div>
  );
}