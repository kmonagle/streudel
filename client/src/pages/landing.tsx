import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Sparkles, ArrowRight } from "lucide-react";

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
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-500/20 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-amber-500/15 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-orange-600/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '4s' }} />
        <div className="absolute -top-20 left-1/2 w-[600px] h-[600px] bg-gradient-to-br from-orange-600/8 to-amber-600/8 rounded-full blur-[80px]" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-2xl">🥘</span>
            <span className="text-xl font-bold text-white">Streudel</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>
          <Button
            onClick={() => window.location.href = '/api/auth/google'}
            size="sm"
            className="bg-orange-500 hover:bg-orange-400 text-white border-0 px-4"
          >
            Sign in with Google
          </Button>
        </div>
      </nav>

      <section className="relative pt-40 pb-32 px-6">
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 glass px-5 py-2.5 rounded-full text-sm font-medium mb-8 text-orange-300">
            <Sparkles className="w-4 h-4" />
            Recipe saving, made effortless
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>

          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tight">
            <span className="block">Save recipes.</span>
            <span className="block">Plan your week.</span>
            <span className="block bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent animate-gradient">
              Shop smarter.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl leading-relaxed">
            Clip any recipe from the web with one tap. Queue what you want to cook this week.{' '}
            <span className="text-white font-medium">Streudel builds your shopping list automatically.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button
              onClick={() => window.location.href = '/api/auth/google'}
              size="lg"
              className="bg-orange-500 hover:bg-orange-400 text-white shadow-2xl shadow-orange-500/30 text-lg px-10 py-7 rounded-2xl border-0"
            >
              Start for free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-10 py-7 rounded-2xl border-2 border-slate-700 bg-transparent text-white hover:bg-white/5 hover:border-slate-600"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              See how it works ↓
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={() => window.location.href = '/api/auth/dev-login'}
              variant="ghost"
              className="text-sm text-slate-500 hover:text-slate-300 mb-8"
            >
              Development Login (Testing Only)
            </Button>
          )}

          {/* Shopping list mockup */}
          <div className="relative mt-4">
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />
            <div className="glass rounded-3xl p-4 md:p-8 shadow-2xl shadow-orange-500/10 max-w-lg">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-4 text-slate-500 text-sm">Shopping List — This week</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="line-through text-slate-500">Chicken thighs (800g)</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-500 flex-shrink-0" />
                    <span>Coconut milk × 2</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-500 flex-shrink-0" />
                    <span>Lemongrass × 3</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-500 flex-shrink-0" />
                    <span>Pasta (500g)</span>
                  </div>
                </div>
                <p className="text-orange-400 text-xs mt-4">← Built from 2 queued recipes</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-32 px-6 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-950/20 to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <span className="text-orange-400 font-semibold tracking-wider uppercase text-sm">Features</span>
            <h2 className="text-4xl md:text-6xl font-black mt-4 mb-6">
              Everything you need to cook more.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="glass border-0 hover:bg-white/10 transition-all duration-300 group rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform text-3xl">
                  🔗
                </div>
                <h3 className="text-2xl font-bold mb-3">Clip from any site</h3>
                <p className="text-slate-400 leading-relaxed">
                  Paste a URL from NYT Cooking, Bon Appétit, anywhere — Streudel extracts the recipe instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-0 hover:bg-white/10 transition-all duration-300 group rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform text-3xl">
                  📋
                </div>
                <h3 className="text-2xl font-bold mb-3">Queue your meals</h3>
                <p className="text-slate-400 leading-relaxed">
                  Pick which recipes you're cooking this week. Streudel keeps your plan front and centre.
                </p>
              </CardContent>
            </Card>

            <Card className="glass border-0 hover:bg-white/10 transition-all duration-300 group rounded-3xl overflow-hidden">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform text-3xl">
                  🛒
                </div>
                <h3 className="text-2xl font-bold mb-3">Auto shopping list</h3>
                <p className="text-slate-400 leading-relaxed">
                  Ingredients from all queued recipes, merged and organised. Ready before you leave the house.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-32 px-6 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <span className="text-orange-400 font-semibold tracking-wider uppercase text-sm">Pricing</span>
            <h2 className="text-4xl md:text-6xl font-black mt-4 mb-6">
              Simple pricing
            </h2>
            <p className="text-xl text-slate-400">
              Start free, upgrade when you're ready
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free tier */}
            <div className="glass rounded-3xl p-10 hover:bg-white/10 transition-all">
              <div className="text-2xl font-bold mb-2">Free</div>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-6xl font-black">$0</span>
                <span className="text-slate-400">/forever</span>
              </div>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  Save up to 50 recipes
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  Recipe queue
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-green-400" />
                  </div>
                  Shopping lists
                </li>
              </ul>
              <Button
                onClick={() => window.location.href = '/api/auth/google'}
                variant="outline"
                className="w-full py-6 text-lg rounded-xl border-2 border-slate-700 bg-transparent text-white hover:bg-white/5"
              >
                Get started free
              </Button>
            </div>

            {/* Premium tier */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl blur opacity-30" />
              <div className="relative bg-gradient-to-br from-orange-950 to-amber-950 rounded-3xl p-10 border border-orange-500/30">
                <div className="absolute top-6 right-6 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-sm font-bold">
                  POPULAR
                </div>
                <div className="text-2xl font-bold mb-2">Premium</div>
                <div className="flex items-baseline gap-1 mb-8">
                  {/* TODO: replace with actual price when set */}
                  <span className="text-6xl font-black">$—</span>
                  <span className="text-slate-400">/month</span>
                </div>
                <ul className="space-y-4 mb-10">
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-orange-400" />
                    </div>
                    <strong>Unlimited</strong> recipes
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-orange-400" />
                    </div>
                    Everything in Free
                  </li>
                </ul>
                <Button
                  onClick={() => window.location.href = '/api/auth/google'}
                  className="w-full py-6 text-lg rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 border-0"
                >
                  Start free trial
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass rounded-[40px] p-12 md:p-20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-600/20 to-amber-600/20" />
            <div className="relative z-10">
              <div className="text-5xl mb-8">🥘</div>
              <h2 className="text-4xl md:text-5xl font-black mb-6">
                Start cooking smarter.
              </h2>
              <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">
                Free to get started. No credit card needed.
              </p>
              <Button
                onClick={() => window.location.href = '/api/auth/google'}
                size="lg"
                className="bg-orange-500 hover:bg-orange-400 text-white shadow-2xl shadow-orange-500/30 text-lg px-12 py-7 rounded-2xl border-0"
              >
                Sign in with Google
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
              <span className="text-2xl">🥘</span>
              <span className="text-2xl font-bold">Streudel</span>
            </div>
            <div className="flex gap-8 text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-500">
            © 2026 Streudel. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
