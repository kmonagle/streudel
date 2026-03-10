import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { BottomNav } from "@/components/ui/bottom-nav";
import { useTheme } from "@/components/ui/theme-provider";
import { Check, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { UserDropdown } from "@/components/ui/user-dropdown";
import Today from "@/pages/today";
import AllItems from "@/pages/all-items";
import HabitCalendar from "@/pages/habit-calendar";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Login from "@/pages/login";
import NotFound from "@/pages/not-found";

function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-40">
      <div className="px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Life | Ordered</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          
          {user && <UserDropdown />}
        </div>
      </div>
    </header>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/login" component={Login} />
          <Route path="/" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/" component={Today} />
          <Route path="/home" component={Home} />
          <Route path="/today" component={Today} />
          <Route path="/all-items" component={AllItems} />
          <Route path="/habit-calendar" component={HabitCalendar} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function LayoutWrapper() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100">
      {isAuthenticated && !isLoading && <Header />}
      <main className={isAuthenticated && !isLoading ? "px-4 py-6 pb-20" : ""}>
        <Router />
      </main>
      {isAuthenticated && !isLoading && <BottomNav />}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="life-ordered-theme">
        <TooltipProvider>
          <LayoutWrapper />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
