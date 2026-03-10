import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Check, 
  Target, 
  CalendarDays, 
  ListTodo, 
  Sparkles, 
  ArrowRight,
  Star,
  Zap,
  Smartphone,
  Clock,
  TrendingUp,
  Heart
} from "lucide-react";

export default function Landing() {

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-hidden">
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-float-delay { animation: float 6s ease-in-out infinite; animation-delay: 2s; }
        .animate-pulse-glow { animation: pulse-glow 4s ease-in-out infinite; }
        .animate-gradient { 
          background-size: 200% 200%;
          animation: gradient-shift 8s ease infinite;
        }
        .animate-slide-up { animation: slide-up 0.8s ease-out forwards; }
        .glass { 
          background: rgba(255,255,255,0.05); 
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
        }
      `}</style>

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/30 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-indigo-500/25 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '4s' }} />
        <div className="absolute -top-20 left-1/2 w-[600px] h-[600px] bg-gradient-to-br from-purple-600/10 to-blue-600/10 rounded-full blur-[80px]" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30 animate-gradient">
              <Check className="w-5 h-5 text-white" strokeWidth={3} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent whitespace-nowrap">Life | Ordered</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => window.location.href = '/api/auth/google'}
              size="sm"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/30 border-0 px-4"
            >
              Enter
            </Button>
          </div>
        </div>
      </nav>

      <section className="relative pt-40 pb-32 px-6">
        <div className="absolute top-32 left-20 animate-float opacity-20">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Heart className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="absolute top-48 right-32 animate-float-delay opacity-20">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
            <Check className="w-7 h-7 text-white" />
          </div>
        </div>
        <div className="absolute bottom-32 left-32 animate-float-slow opacity-20">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Star className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="absolute bottom-40 right-24 animate-float opacity-20">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 glass px-5 py-2.5 rounded-full text-sm font-medium mb-8 text-violet-300">
            <Sparkles className="w-4 h-4" />
            The #1 productivity app for achievers
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tight">
            <span className="block">Organize Your</span>
            <span className="block bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent animate-gradient">
              Entire Life
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Goals. Tasks. Habits. All beautifully unified in one 
            <span className="text-white font-medium"> intelligent app </span>
            that helps you become your best self.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button 
              onClick={() => window.location.href = '/api/auth/google'}
              size="lg"
              className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-2xl shadow-purple-500/30 text-lg px-10 py-7 rounded-2xl border-0 animate-gradient"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="text-lg px-10 py-7 rounded-2xl border-2 border-slate-700 bg-transparent text-white hover:bg-white/5 hover:border-slate-600"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Watch Demo
            </Button>
          </div>

          {process.env.NODE_ENV === "development" && (
            <Button 
              onClick={() => window.location.href = '/api/auth/dev-login'}
              variant="ghost"
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              Development Login (Testing Only)
            </Button>
          )}

          <div className="relative mt-16">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="glass rounded-3xl p-4 md:p-8 shadow-2xl shadow-purple-500/10 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-slate-500 text-sm">Life | Ordered - Today</span>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-500" />
                    </div>
                    <span className="line-through text-slate-500">Morning meditation - 10 mins</span>
                    <span className="ml-auto text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">Habit</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="w-6 h-6 rounded-full border-2 border-blue-500" />
                    <span>Review quarterly goals</span>
                    <span className="ml-auto text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">Goal</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="w-6 h-6 rounded-full border-2 border-purple-500" />
                    <span>Prepare presentation slides</span>
                    <span className="ml-auto text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">Task</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="w-6 h-6 rounded-full border-2 border-amber-500" />
                    <span>Read for 30 minutes</span>
                    <span className="ml-auto text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400">Habit</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">10K+</div>
              <div className="text-slate-400 mt-2">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">1M+</div>
              <div className="text-slate-400 mt-2">Tasks Completed</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">4.9</div>
              <div className="text-slate-400 mt-2">App Rating</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">99.9%</div>
              <div className="text-slate-400 mt-2">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="text-violet-400 font-semibold tracking-wider uppercase text-sm">Features</span>
            <h2 className="text-4xl md:text-6xl font-black mt-4 mb-6">
              Everything You Need
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Powerful features that work together seamlessly to supercharge your productivity
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass border-0 hover:bg-white/10 transition-all duration-300 group rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Goal Tracking</h3>
                <p className="text-slate-400 leading-relaxed">
                  Set ambitious goals with milestones, track progress visually, and celebrate every achievement along the way.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-0 hover:bg-white/10 transition-all duration-300 group rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Habit Calendar</h3>
                <p className="text-slate-400 leading-relaxed">
                  Visualize your habit streaks with a beautiful calendar. Build consistency and never break the chain.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-0 hover:bg-white/10 transition-all duration-300 group rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                  <ListTodo className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Smart Tasks</h3>
                <p className="text-slate-400 leading-relaxed">
                  Intuitive drag-and-drop task management with priorities, due dates, and intelligent categorization.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-0 hover:bg-white/10 transition-all duration-300 group rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Execution Mode</h3>
                <p className="text-slate-400 leading-relaxed">
                  Deep focus mode that helps you crush tasks one at a time. Zero distractions, maximum productivity.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-0 hover:bg-white/10 transition-all duration-300 group rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-pink-500/30 group-hover:scale-110 transition-transform">
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Today View</h3>
                <p className="text-slate-400 leading-relaxed">
                  Start every day with clarity. See exactly what needs your attention today, nothing more.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-0 hover:bg-white/10 transition-all duration-300 group rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Mobile First</h3>
                <p className="text-slate-400 leading-relaxed">
                  Designed for your phone with buttery smooth gestures and responsive layouts that feel native.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-32 px-6 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-violet-400 font-semibold tracking-wider uppercase text-sm">Pricing</span>
            <h2 className="text-4xl md:text-6xl font-black mt-4 mb-6">
              Simple, Fair Pricing
            </h2>
            <p className="text-xl text-slate-400">
              Start free, upgrade when you're ready to go unlimited
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass rounded-3xl p-10 hover:bg-white/10 transition-all">
              <div className="text-2xl font-bold mb-2">Free</div>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-6xl font-black">$0</span>
                <span className="text-slate-400">/forever</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  Up to 10 goals
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  Up to 100 tasks
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  Up to 50 habits
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  Habit calendar
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  Today view
                </li>
              </ul>
              <Button 
                onClick={() => window.location.href = '/api/auth/google'}
                variant="outline"
                className="w-full py-6 text-lg rounded-xl border-2 border-slate-700 bg-transparent text-white hover:bg-white/5"
              >
                Get Started Free
              </Button>
            </div>

            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl blur opacity-30" />
              <div className="relative bg-gradient-to-br from-violet-950 to-indigo-950 rounded-3xl p-10 border border-violet-500/30">
                <div className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-sm font-bold">
                  POPULAR
                </div>
                <div className="text-2xl font-bold mb-2">Premium</div>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-6xl font-black">$4.99</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-violet-400" />
                    </div>
                    <strong>Unlimited</strong> goals
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-violet-400" />
                    </div>
                    <strong>Unlimited</strong> tasks
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-violet-400" />
                    </div>
                    <strong>Unlimited</strong> habits
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-violet-400" />
                    </div>
                    Google Calendar sync
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-violet-400" />
                    </div>
                    Priority support
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center">
                      <Check className="w-4 h-4 text-violet-400" />
                    </div>
                    Early access to features
                  </li>
                </ul>
                <Button 
                  onClick={() => window.location.href = '/api/auth/google'}
                  className="w-full py-6 text-lg rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0"
                >
                  Start 7-Day Free Trial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/20 to-transparent pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="text-violet-400 font-semibold tracking-wider uppercase text-sm">Testimonials</span>
            <h2 className="text-4xl md:text-6xl font-black mt-4 mb-6">
              Loved by Thousands
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass border-0 rounded-3xl">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                  "This app changed how I approach my day. The execution mode alone is worth the upgrade to premium!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white font-bold">
                    SM
                  </div>
                  <div>
                    <div className="font-semibold">Sarah Mitchell</div>
                    <div className="text-slate-500 text-sm">Product Designer</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0 rounded-3xl">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                  "Finally, an app that combines goals, tasks, and habits beautifully. My productivity has skyrocketed!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                    JK
                  </div>
                  <div>
                    <div className="font-semibold">James Kim</div>
                    <div className="text-slate-500 text-sm">Startup Founder</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass border-0 rounded-3xl">
              <CardContent className="p-8">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-lg text-slate-300 mb-8 leading-relaxed">
                  "The habit calendar keeps me accountable. I've built 5 new habits in just 3 months!"
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                    ER
                  </div>
                  <div>
                    <div className="font-semibold">Emily Rodriguez</div>
                    <div className="text-slate-500 text-sm">Fitness Coach</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-[40px] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/20 to-indigo-600/20" />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-purple-500/30">
                <TrendingUp className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Ready to Transform<br />Your Productivity?
              </h2>
              <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">
                Join thousands who are achieving more every day with Life | Ordered.
              </p>
              <Button 
                onClick={() => window.location.href = '/api/auth/google'}
                size="lg"
                className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-2xl shadow-purple-500/30 text-lg px-12 py-7 rounded-2xl border-0"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-16 px-6 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Check className="w-6 h-6 text-white" strokeWidth={3} />
              </div>
              <span className="text-2xl font-bold">Life | Ordered</span>
            </div>
            <div className="flex gap-8 text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Support</a>
              <a href="#" className="hover:text-white transition-colors">Blog</a>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-500">
            © 2026 Life | Ordered. All rights reserved. Made with <Heart className="w-4 h-4 inline text-red-500" /> for productivity enthusiasts.
          </div>
        </div>
      </footer>
    </div>
  );
}
