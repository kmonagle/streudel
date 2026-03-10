import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { User } from "@shared/schema";

export default function Home() {
  const { user } = useAuth() as { user: User | undefined };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Life | Ordered</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-muted-foreground">
                Welcome, {user.firstName || user.email}
              </span>
            )}
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/api/auth/logout'}
            >
              Log Out
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link href="/today">
              <div className="p-6 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <h2 className="text-xl font-semibold mb-2">Today</h2>
                <p className="text-muted-foreground">
                  Focus on your daily tasks and habits
                </p>
              </div>
            </Link>
            
            <Link href="/all-items">
              <div className="p-6 border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <h2 className="text-xl font-semibold mb-2">All Items</h2>
                <p className="text-muted-foreground">
                  Manage all your goals, tasks, and habits
                </p>
              </div>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}