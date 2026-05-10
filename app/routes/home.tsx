import type { Route } from "./+types/home";
import { Link } from "react-router";

// Inline SVG Icons (Phosphor-style, 1.5px stroke)
function Icon({ path, className = "w-5 h-5" }: { path: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const Icons = {
  Cart: () => <Icon path="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
  Check: () => <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  Chart: () => <Icon path="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
  Chat: () => <Icon path="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />,
  ArrowRight: () => <Icon className="w-4 h-4" path="M14 5l7 7m0 0l-7 7m7-7H3" />,
  Book: () => <Icon path="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />,
  Lightning: () => <Icon path="M13 10V3L4 14h7v7l9-11h-7z" />,
  Shield: () => <Icon path="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
  Rocket: () => <Icon path="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />,
  Github: () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sent - WhatsApp Cart Recovery for Shopify" },
    { name: "description", content: "Automatically send WhatsApp messages to recover abandoned carts and confirm orders. Free tier includes 200 messages/month." },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F7F6F3] font-sans">
      <Navigation />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Footer />
    </div>
  );
}

function Navigation() {
  return (
    <nav className="sticky top-0 z-50 bg-[#F7F6F3]/80 backdrop-blur-md border-b border-[#EAEAEA]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-semibold text-[#111111] tracking-tight">
            Sent
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-[#787774] hover:text-[#111111] transition-colors text-sm">
              Features
            </a>
            <a href="https://docs.sent.app" target="_blank" rel="noreferrer" className="text-[#787774] hover:text-[#111111] transition-colors text-sm">
              Docs
            </a>
            <a href="https://github.com/sent-app" target="_blank" rel="noreferrer" className="text-[#787774] hover:text-[#111111] transition-colors text-sm">
              GitHub
            </a>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white bg-[#111111] hover:bg-[#333333] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
          >
            Add to Shopify
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative pt-20 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-[#787774] text-sm font-medium tracking-wide uppercase mb-6">
            WhatsApp Commerce
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#111111] tracking-tight leading-[1.1]">
            Recover Abandoned Carts via WhatsApp
          </h1>
          <p className="mt-6 text-lg text-[#787774] leading-relaxed max-w-2xl mx-auto">
            Automatically send WhatsApp messages to recover lost sales and confirm orders.
            Start with 200 free messages every month.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg text-white bg-[#111111] hover:bg-[#333333] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started Free
              <Icons.ArrowRight />
            </Link>
            <a
              href="https://docs.sent.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-lg text-[#111111] bg-white border border-[#EAEAEA] hover:border-[#111111] transition-all duration-200"
            >
              <Icons.Book />
              <span className="ml-2">Documentation</span>
            </a>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-16 relative">
          <div className="relative mx-auto max-w-5xl">
            <div className="rounded-xl border border-[#EAEAEA] bg-white shadow-[0_2px_40px_rgba(0,0,0,0.06)] overflow-hidden">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#F7F6F3] border-b border-[#EAEAEA]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#EAEAEA]" />
                  <div className="w-3 h-3 rounded-full bg-[#EAEAEA]" />
                  <div className="w-3 h-3 rounded-full bg-[#EAEAEA]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-3 py-1 bg-white rounded-md text-xs text-[#A5A4A2] font-mono">
                    dashboard.sent.app
                  </div>
                </div>
              </div>
              {/* Dashboard Preview Content */}
              <div className="p-6">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-[#F7F6F3] rounded-lg">
                    <p className="text-xs text-[#787774] uppercase tracking-wide">Messages</p>
                    <p className="font-mono text-2xl text-[#111111] mt-1">1,247</p>
                  </div>
                  <div className="p-4 bg-[#F7F6F3] rounded-lg">
                    <p className="text-xs text-[#787774] uppercase tracking-wide">Delivered</p>
                    <p className="font-mono text-2xl text-[#111111] mt-1">98.2%</p>
                  </div>
                  <div className="p-4 bg-[#F7F6F3] rounded-lg">
                    <p className="text-xs text-[#787774] uppercase tracking-wide">Revenue</p>
                    <p className="font-mono text-2xl text-[#111111] mt-1">$24.5K</p>
                  </div>
                  <div className="p-4 bg-[#F7F6F3] rounded-lg">
                    <p className="text-xs text-[#787774] uppercase tracking-wide">CTR</p>
                    <p className="font-mono text-2xl text-[#111111] mt-1">32.4%</p>
                  </div>
                </div>
                <div className="h-32 bg-gradient-to-r from-[#F7F6F3] to-white rounded-lg border border-[#EAEAEA] flex items-center justify-center">
                  <div className="flex items-center gap-2 text-[#A5A4A2]">
                    <Icons.Chart />
                    <span className="text-sm">Analytics Overview</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: Icons.Cart,
      title: "Abandoned Cart Recovery",
      description: "Automatically message customers who leave items in their cart. Recover up to 15% of lost sales.",
    },
    {
      icon: Icons.Check,
      title: "Order Confirmations",
      description: "Send instant WhatsApp confirmations for every order placed. Build trust with your customers.",
    },
    {
      icon: Icons.Chart,
      title: "ROI Tracking",
      description: "See exactly how much revenue you've recovered. Real-time analytics in your dashboard.",
    },
  ];

  return (
    <section id="features" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-[#787774] text-sm font-medium tracking-wide uppercase mb-4">Features</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#111111] tracking-tight">
            Everything you need to recover sales
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-[#F9F9F8] rounded-xl border border-[#EAEAEA] hover:border-[#111111] transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-lg bg-white border border-[#EAEAEA] flex items-center justify-center mb-6 group-hover:border-[#111111] transition-colors">
                <feature.icon />
              </div>
              <h3 className="text-xl font-semibold text-[#111111] mb-3">{feature.title}</h3>
              <p className="text-[#787774] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Icons.Chat,
      title: "Connect your Shopify store",
      description: "One-click OAuth integration with your Shopify admin.",
    },
    {
      icon: Icons.Lightning,
      title: "Configure Twilio WhatsApp",
      description: "Add your Twilio credentials to enable messaging.",
    },
    {
      icon: Icons.Rocket,
      title: "Start recovering sales",
      description: "Messages send automatically based on customer behavior.",
    },
  ];

  return (
    <section className="py-24 bg-[#F7F6F3]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-[#787774] text-sm font-medium tracking-wide uppercase mb-4">How it works</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#111111] tracking-tight">
            Set up in 3 simple steps
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center font-mono text-sm">
                  {index + 1}
                </div>
                <div className="w-12 h-12 rounded-lg bg-white border border-[#EAEAEA] flex items-center justify-center">
                  <step.icon />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-[#111111] mb-2">{step.title}</h3>
              <p className="text-[#787774]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-[#787774] text-sm font-medium tracking-wide uppercase mb-4">Pricing</p>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#111111] tracking-tight">
            Simple, transparent pricing
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="p-8 bg-[#F9F9F8] rounded-xl border border-[#EAEAEA]">
            <h3 className="text-xl font-semibold text-[#111111] mb-2">Free</h3>
            <p className="text-[#787774] mb-6">Perfect for getting started</p>
            <div className="flex items-baseline mb-8">
              <span className="text-4xl font-semibold text-[#111111]">$0</span>
              <span className="text-[#787774] ml-2">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {["200 messages/month", "Abandoned cart recovery", "Order confirmations", "Basic analytics"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-[#111111]">
                  <Icons.Check />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/auth"
              className="block w-full text-center px-6 py-3 text-base font-medium rounded-lg text-[#111111] bg-white border border-[#EAEAEA] hover:border-[#111111] transition-all duration-200"
            >
              Get Started
            </Link>
          </div>

          {/* Pro Plan */}
          <div className="p-8 bg-[#111111] rounded-xl border border-[#111111]">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold text-white">Pro</h3>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-xs font-medium uppercase tracking-wide">
                Coming Soon
              </span>
            </div>
            <p className="text-white/60 mb-6">For growing businesses</p>
            <div className="flex items-baseline mb-8">
              <span className="text-4xl font-semibold text-white">Custom</span>
            </div>
            <ul className="space-y-4 mb-8">
              {["Unlimited messages", "Priority delivery", "Advanced analytics", "Custom templates", "Priority support"].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-white">
                  <div className="text-white"><Icons.Check /></div>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              disabled
              className="block w-full text-center px-6 py-3 text-base font-medium rounded-lg text-white bg-white/10 opacity-60 cursor-not-allowed"
            >
              Coming Soon
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#F7F6F3] border-t border-[#EAEAEA]">
      <div className="max-w-6xl mx-auto px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-xl font-semibold text-[#111111]">Sent</span>
          </div>
          <div className="flex space-x-6">
            <a href="https://docs.sent.app" target="_blank" rel="noreferrer" className="text-[#787774] hover:text-[#111111] transition-colors text-sm">
              Docs
            </a>
            <a href="https://github.com/sent-app" target="_blank" rel="noreferrer" className="text-[#787774] hover:text-[#111111] transition-colors text-sm flex items-center gap-1">
              <Icons.Github />
              <span>GitHub</span>
            </a>
            <Link to="/privacy" className="text-[#787774] hover:text-[#111111] transition-colors text-sm">
              Privacy
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-[#EAEAEA] text-center text-sm text-[#A5A4A2]">
          {new Date().getFullYear()} Sent. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
