import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Sent - WhatsApp Cart Recovery for Shopify" },
    { name: "description", content: "Automatically send WhatsApp messages to recover abandoned carts and confirm orders. Free tier includes 200 messages/month." },
    { name: "keywords", content: "WhatsApp, Shopify, abandoned cart, order confirmation, recovery, ecommerce" },
    { property: "og:title", content: "Sent - WhatsApp Cart Recovery for Shopify" },
    { property: "og:description", content: "Automatically send WhatsApp messages to recover abandoned carts and confirm orders." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: "Sent - WhatsApp Cart Recovery for Shopify" },
    { name: "twitter:description", content: "Automatically send WhatsApp messages to recover abandoned carts and confirm orders." },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
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
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Sent
            </Link>
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a
              href="https://docs.sent.app"
              target="_blank"
              rel="noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Docs
            </a>
            <a
              href="https://github.com/sent-app"
              target="_blank"
              rel="noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              GitHub
            </a>
          </div>
          <Link
            to="/auth"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
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
    <section className="relative pt-16 pb-24 lg:pt-32 lg:pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            Recover Abandoned Carts via WhatsApp
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 leading-relaxed">
            Automatically send WhatsApp messages to recover lost sales and confirm orders.
            Free tier includes 200 messages/month.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/auth"
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Get Started Free
            </Link>
            <a
              href="https://docs.sent.app"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              View Documentation
            </a>
          </div>
        </div>
        <div className="mt-16 relative">
          <div className="relative mx-auto max-w-4xl">
            <div className="aspect-[16/9] bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-gray-200 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <MessageIcon className="w-10 h-10 text-blue-600" />
                </div>
                <p className="text-gray-500 text-lg">Dashboard Preview</p>
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
      title: "Abandoned Cart Recovery",
      description: "Automatically message customers who leave items in their cart",
      icon: <CartIcon className="w-6 h-6 text-blue-600" />,
    },
    {
      title: "Order Confirmations",
      description: "Send instant WhatsApp confirmations for every order",
      icon: <CheckIcon className="w-6 h-6 text-blue-600" />,
    },
    {
      title: "ROI Tracking",
      description: "See exactly how much revenue you've recovered",
      icon: <ChartIcon className="w-6 h-6 text-blue-600" />,
    },
  ];

  return (
    <section id="features" className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Everything you need</h2>
          <p className="mt-4 text-lg text-gray-600">
            Powerful features to help you recover more sales
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
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
      step: "01",
      title: "Connect your Shopify store",
      description: "One-click OAuth integration with your Shopify store",
    },
    {
      step: "02",
      title: "Configure Twilio WhatsApp",
      description: "Add your Twilio credentials to start sending messages",
    },
    {
      step: "03",
      title: "Start recovering sales",
      description: "Messages are sent automatically based on your settings",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">How it works</h2>
          <p className="mt-4 text-lg text-gray-600">
            Get up and running in minutes
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item) => (
            <div key={item.step} className="text-center">
              <div className="text-5xl font-bold text-blue-100 mb-6">{item.step}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Simple pricing</h2>
          <p className="mt-4 text-lg text-gray-600">
            Start free, upgrade when you need to
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900">Free</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold text-gray-900">$0</span>
              <span className="ml-2 text-gray-500">/month</span>
            </div>
            <ul className="mt-6 space-y-4">
              <li className="flex items-center text-gray-600">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                200 messages/month
              </li>
              <li className="flex items-center text-gray-600">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                Abandoned cart recovery
              </li>
              <li className="flex items-center text-gray-600">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                Order confirmations
              </li>
              <li className="flex items-center text-gray-600">
                <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                ROI tracking
              </li>
            </ul>
            <Link
              to="/auth"
              className="mt-8 block w-full text-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              Get Started
            </Link>
          </div>
          <div className="bg-blue-600 rounded-xl p-8 shadow-sm border border-blue-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
              Coming Soon
            </div>
            <h3 className="text-xl font-semibold text-white">Pro</h3>
            <div className="mt-4 flex items-baseline">
              <span className="text-4xl font-bold text-white">$19</span>
              <span className="ml-2 text-blue-200">/month</span>
            </div>
            <ul className="mt-6 space-y-4">
              <li className="flex items-center text-blue-100">
                <CheckIcon className="w-5 h-5 text-blue-300 mr-3" />
                Unlimited messages
              </li>
              <li className="flex items-center text-blue-100">
                <CheckIcon className="w-5 h-5 text-blue-300 mr-3" />
                Priority support
              </li>
              <li className="flex items-center text-blue-100">
                <CheckIcon className="w-5 h-5 text-blue-300 mr-3" />
                Custom templates
              </li>
              <li className="flex items-center text-blue-100">
                <CheckIcon className="w-5 h-5 text-blue-300 mr-3" />
                Advanced analytics
              </li>
            </ul>
            <button
              disabled
              className="mt-8 block w-full text-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white opacity-60 cursor-not-allowed"
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
    <footer className="bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <span className="text-xl font-bold text-gray-900">Sent</span>
          </div>
          <div className="flex space-x-6">
            <a
              href="https://docs.sent.app"
              target="_blank"
              rel="noreferrer"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Docs
            </a>
            <a
              href="https://github.com/sent-app"
              target="_blank"
              rel="noreferrer"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              GitHub
            </a>
            <Link to="/privacy" className="text-gray-500 hover:text-gray-900 transition-colors">
              Privacy
            </Link>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-100 text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Sent. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// Icons
function MessageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}
