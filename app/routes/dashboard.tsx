import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, useSubmit } from "react-router";
import { useState } from "react";
import { prisma } from "~/db/client";
import { calculateRecoveredRevenue } from "~/services/attribution.server";

const FREE_QUOTA = 200;

interface DashboardStats {
  messagesSentThisMonth: number;
  messagesDelivered: number;
  remainingQuota: number;
  deliveryRate: number;
  clickThroughRate: number;
  totalRecoveredOrders: number;
  totalRecoveredRevenue: number;
}

interface Message {
  id: string;
  type: string;
  phoneNumber: string;
  status: string;
  sentAt: string | null;
  clickCount: number;
  createdAt: string;
}

interface FeatureSettings {
  enableAbandonedCart: boolean;
  enableOrderConfirmation: boolean;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shopId = url.searchParams.get("shop");

  if (!shopId) {
    throw new Response("Missing shop parameter", { status: 400 });
  }

  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
  });

  if (!shop) {
    throw new Response("Shop not found", { status: 404 });
  }

  // Calculate stats for this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const messagesThisMonth = await prisma.messageLog.findMany({
    where: {
      shopId,
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
  });

  const messagesSentThisMonth = messagesThisMonth.length;
  const messagesDelivered = messagesThisMonth.filter((m) => m.status === "DELIVERED").length;
  const deliveryRate = messagesSentThisMonth > 0
    ? Math.round((messagesDelivered / messagesSentThisMonth) * 100)
    : 0;

  const messagesWithClicks = messagesThisMonth.filter((m) => m.clickCount > 0).length;
  const clickThroughRate = messagesSentThisMonth > 0
    ? Math.round((messagesWithClicks / messagesSentThisMonth) * 100)
    : 0;

  const remainingQuota = Math.max(0, FREE_QUOTA - messagesSentThisMonth);

  // Get recovered revenue data
  const recoveredRevenue = await calculateRecoveredRevenue(shopId);

  // Get recent messages
  const recentMessages = await prisma.messageLog.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      phoneNumber: true,
      status: true,
      sentAt: true,
      clickCount: true,
      createdAt: true,
    },
  });

  const stats: DashboardStats = {
    messagesSentThisMonth,
    messagesDelivered,
    remainingQuota,
    deliveryRate,
    clickThroughRate,
    totalRecoveredOrders: recoveredRevenue.orderCount,
    totalRecoveredRevenue: recoveredRevenue.totalRecovered,
  };

  const messages: Message[] = recentMessages.map((msg) => ({
    ...msg,
    phoneNumber: maskPhoneNumber(msg.phoneNumber),
    sentAt: msg.sentAt?.toISOString() || null,
    createdAt: msg.createdAt.toISOString(),
  }));

  const settings: FeatureSettings = {
    enableAbandonedCart: shop.enableAbandonedCart,
    enableOrderConfirmation: shop.enableOrderConfirmation,
  };

  return {
    shop: {
      id: shop.id,
      domain: shop.domain,
    },
    stats,
    messages,
    settings,
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  
  const shopId = formData.get("shopId");
  const enableAbandonedCart = formData.get("enableAbandonedCart");
  const enableOrderConfirmation = formData.get("enableOrderConfirmation");

  if (typeof shopId !== "string" || !shopId) {
    return { error: "Missing shopId" };
  }

  const updateData: { enableAbandonedCart?: boolean; enableOrderConfirmation?: boolean } = {};

  if (enableAbandonedCart !== null) {
    updateData.enableAbandonedCart = enableAbandonedCart === "true";
  }
  
  if (enableOrderConfirmation !== null) {
    updateData.enableOrderConfirmation = enableOrderConfirmation === "true";
  }

  await prisma.shop.update({
    where: { id: shopId },
    data: updateData,
  });

  return { success: true };
}

function maskPhoneNumber(phone: string): string {
  if (phone.length <= 4) return phone;
  return phone.slice(0, -4).replace(/./g, "*") + phone.slice(-4);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// SVG Icons
function IconCheck({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function IconInfo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconX({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function IconShoppingCart({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function IconMail({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconInbox({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

function IconExternalLink({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function IconLink({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );
}

function IconPaperAirplane({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function IconBookOpen({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DELIVERED: "bg-green-100 text-green-800 border-green-200",
    SENT: "bg-blue-100 text-blue-800 border-blue-200",
    PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    FAILED: "bg-red-100 text-red-800 border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || "bg-gray-100 text-gray-800 border-gray-200"
      }`}
    >
      {status}
    </span>
  );
}

function TooltipIcon({ title }: { title: string }) {
  return (
    <span className="inline-flex ml-1 text-gray-400 hover:text-gray-600 cursor-help" title={title}>
      <IconInfo className="w-4 h-4" />
    </span>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  highlight = false,
  tooltip,
}: {
  title: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
  tooltip?: string;
}) {
  return (
    <div
      className={`bg-white rounded-xl p-4 sm:p-6 border ${
        highlight ? "border-blue-200 shadow-md" : "border-gray-200 shadow-sm"
      }`}
    >
      <p className="text-sm font-medium text-gray-600 mb-1 flex items-center">
        {title}
        {tooltip && <TooltipIcon title={tooltip} />}
      </p>
      <p className={`text-2xl sm:text-3xl font-bold ${highlight ? "text-blue-600" : "text-gray-900"}`}>
        {value}
      </p>
      {subtitle && <p className="text-xs text-gray-500 mt-2">{subtitle}</p>}
    </div>
  );
}

function ToggleSwitch({
  name,
  label,
  description,
  defaultChecked,
  shopId,
  icon: Icon,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
  shopId: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  const submit = useSubmit();

  return (
    <div className="flex items-start justify-between py-4 gap-4">
      <div className="flex-1 flex items-start gap-3">
        {Icon && (
          <div className={`p-2 rounded-lg flex-shrink-0 ${defaultChecked ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500"}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-900">{label}</h4>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              defaultChecked 
                ? "bg-green-100 text-green-800" 
                : "bg-gray-100 text-gray-600"
            }`}>
              {defaultChecked ? "Enabled" : "Disabled"}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
      </div>
      <Form method="post" className="flex-shrink-0">
        <input type="hidden" name="shopId" value={shopId} />
        <input type="hidden" name={name} value={defaultChecked ? "false" : "true"} />
        <button
          type="submit"
          className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-95 touch-manipulation ${
            defaultChecked ? "bg-blue-600" : "bg-gray-200"
          }`}
          aria-label={`Toggle ${label}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
              defaultChecked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </Form>
    </div>
  );
}

function OnboardingChecklist({ shopId }: { shopId: string }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  const steps = [
    { label: "Connect Twilio account", done: false, icon: IconLink },
    { label: "Enable abandoned cart recovery", done: false, icon: IconShoppingCart },
    { label: "Send test message", done: false, icon: IconPaperAirplane },
    { label: "View documentation", done: false, icon: IconBookOpen },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const progress = (completedCount / steps.length) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Get Started</h3>
          <p className="text-sm text-gray-600 mt-1">
            {completedCount === 0 
              ? "Complete these steps to start recovering abandoned carts"
              : `${completedCount} of ${steps.length} completed`
            }
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-blue-200 rounded-full overflow-hidden max-w-xs">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Checklist */}
          <ul className="mt-4 space-y-2">
            {steps.map((step, index) => (
              <li key={index} className="flex items-center gap-3 text-sm">
                <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  step.done 
                    ? "bg-blue-600 border-blue-600" 
                    : "border-gray-300"
                }`}>
                  {step.done && <IconCheck className="w-3 h-3 text-white" />}
                </span>
                <span className={step.done ? "text-gray-500 line-through" : "text-gray-700"}>
                  {step.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
          aria-label="Dismiss checklist"
          title="Dismiss checklist"
        >
          <IconX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
        <IconInbox className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet!</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
        Once you start recovering carts, they&apos;ll appear here.
      </p>
      <a
        href="/docs"
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
      >
        <IconBookOpen className="w-4 h-4" />
        View Setup Guide
      </a>
    </div>
  );
}

export default function Dashboard() {
  const { shop, stats, messages, settings } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1 truncate">{shop.domain}</p>
            </div>
            <a
              href={`/app?shop=${shop.id}`}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Settings →
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Onboarding Checklist */}
        <OnboardingChecklist shopId={shop.id} />

        {/* Stats Grid */}
        <section className="mb-8" aria-label="Message statistics">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Message Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Messages Sent (This Month)"
              value={stats.messagesSentThisMonth.toString()}
              subtitle={`${stats.remainingQuota} remaining in free tier`}
            />
            <StatCard
              title="Delivery Rate"
              value={`${stats.deliveryRate}%`}
              subtitle={`${stats.messagesDelivered} delivered`}
              tooltip="Percentage of messages successfully delivered"
            />
            <StatCard
              title="Click-Through Rate"
              value={`${stats.clickThroughRate}%`}
              subtitle="Of messages with clicks"
              tooltip="Percentage of messages that led to clicks"
            />
            <StatCard
              title="Recovered Revenue"
              value={formatCurrency(stats.totalRecoveredRevenue)}
              subtitle={`${stats.totalRecoveredOrders} orders recovered`}
              highlight
              tooltip="Total revenue from recovered carts"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Feature Toggles */}
          <section className="lg:col-span-1" aria-label="Feature settings">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Features</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Toggle messaging features on or off
                </p>
              </div>
              <div className="px-4 sm:px-6 divide-y divide-gray-200">
                <ToggleSwitch
                  name="enableAbandonedCart"
                  label="Abandoned Cart Recovery"
                  description="Automatically send WhatsApp messages to customers who abandoned their cart"
                  defaultChecked={settings.enableAbandonedCart}
                  shopId={shop.id}
                  icon={IconShoppingCart}
                />
                <ToggleSwitch
                  name="enableOrderConfirmation"
                  label="Order Confirmations"
                  description="Send WhatsApp confirmations when customers place an order"
                  defaultChecked={settings.enableOrderConfirmation}
                  shopId={shop.id}
                  icon={IconMail}
                />
              </div>
            </div>
          </section>

          {/* Message History */}
          <section className="lg:col-span-2" aria-label="Message history">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Messages</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Last 20 messages sent from your store
                </p>
              </div>
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="min-w-[600px] px-4 sm:px-0">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Clicks
                        </th>
                        <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sent
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {messages.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-0 py-0">
                            <EmptyState />
                          </td>
                        </tr>
                      ) : (
                        messages.map((message) => (
                          <tr key={message.id} className="hover:bg-gray-50">
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {message.type === "ABANDONED_CART"
                                ? "Abandoned Cart"
                                : "Order Confirmation"}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                              {message.phoneNumber}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                              <StatusBadge status={message.status} />
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {message.clickCount > 0 ? (
                                <span className="text-green-600 font-medium">
                                  {message.clickCount}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {message.sentAt ? formatDate(message.sentAt) : "-"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
