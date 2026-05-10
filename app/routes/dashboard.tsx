import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form, useSubmit } from "react-router";
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

function StatCard({
  title,
  value,
  subtitle,
  highlight = false,
}: {
  title: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl p-6 border ${
        highlight ? "border-blue-200 shadow-md" : "border-gray-200 shadow-sm"
      }`}
    >
      <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
      <p className={`text-3xl font-bold ${highlight ? "text-blue-600" : "text-gray-900"}`}>
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
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
  shopId: string;
}) {
  const submit = useSubmit();

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <Form method="post" className="ml-4">
        <input type="hidden" name="shopId" value={shopId} />
        <input type="hidden" name={name} value={defaultChecked ? "false" : "true"} />
        <button
          type="submit"
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            defaultChecked ? "bg-blue-600" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              defaultChecked ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </Form>
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
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">{shop.domain}</p>
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Message Statistics</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Messages Sent (This Month)"
              value={stats.messagesSentThisMonth.toString()}
              subtitle={`${stats.remainingQuota} remaining in free tier`}
            />
            <StatCard
              title="Delivery Rate"
              value={`${stats.deliveryRate}%`}
              subtitle={`${stats.messagesDelivered} delivered`}
            />
            <StatCard
              title="Click-Through Rate"
              value={`${stats.clickThroughRate}%`}
              subtitle="Of messages with clicks"
            />
            <StatCard
              title="Recovered Revenue"
              value={formatCurrency(stats.totalRecoveredRevenue)}
              subtitle={`${stats.totalRecoveredOrders} orders recovered`}
              highlight
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Feature Toggles */}
          <section className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Features</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Toggle messaging features on or off
                </p>
              </div>
              <div className="px-6 divide-y divide-gray-200">
                <ToggleSwitch
                  name="enableAbandonedCart"
                  label="Abandoned Cart Recovery"
                  description="Automatically send WhatsApp messages to customers who abandoned their cart"
                  defaultChecked={settings.enableAbandonedCart}
                  shopId={shop.id}
                />
                <ToggleSwitch
                  name="enableOrderConfirmation"
                  label="Order Confirmations"
                  description="Send WhatsApp confirmations when customers place an order"
                  defaultChecked={settings.enableOrderConfirmation}
                  shopId={shop.id}
                />
              </div>
            </div>
          </section>

          {/* Message History */}
          <section className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Recent Messages</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Last 20 messages sent from your store
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clicks
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sent
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {messages.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-sm text-gray-500"
                        >
                          No messages sent yet
                        </td>
                      </tr>
                    ) : (
                      messages.map((message) => (
                        <tr key={message.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {message.type === "ABANDONED_CART"
                              ? "Abandoned Cart"
                              : "Order Confirmation"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                            {message.phoneNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={message.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {message.clickCount > 0 ? (
                              <span className="text-green-600 font-medium">
                                {message.clickCount}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {message.sentAt ? formatDate(message.sentAt) : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
