import { useLocation } from "wouter";
import { Calendar, LayoutGrid } from "lucide-react";

export function BottomNav() {
  const [location, setLocation] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        <button
          type="button"
          onClick={() => setLocation("/")}
          className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[44px] ${location === "/" ? "text-primary" : "text-gray-400 dark:text-slate-500"}`}
          data-testid="nav-today"
        >
          <Calendar className="w-5 h-5 pointer-events-none" />
          <span className="text-xs font-medium mt-1 pointer-events-none">Today</span>
        </button>
        <button
          type="button"
          onClick={() => setLocation("/all-items")}
          className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[44px] ${location === "/all-items" ? "text-primary" : "text-gray-400 dark:text-slate-500"}`}
          data-testid="nav-all-items"
        >
          <LayoutGrid className="w-5 h-5 pointer-events-none" />
          <span className="text-xs font-medium mt-1 pointer-events-none">All Items</span>
        </button>
      </div>
    </nav>
  );
}
