import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { useLoaderData, Form } from "react-router";
import { getShopByDomain, updateShopTwilioCredentials } from "~/models/shop.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");

  if (!shop) {
    throw new Response("Missing shop parameter", { status: 400 });
  }

  const shopData = await getShopByDomain(shop);
  if (!shopData) {
    throw new Response("Shop not found", { status: 404 });
  }

  return {
    shop: {
      id: shopData.id,
      domain: shopData.domain,
      twilioAccountSid: shopData.twilioAccountSid ?? "",
      isActive: shopData.isActive,
    },
  };
}

export default function App() {
  const { shop } = useLoaderData<typeof loader>();

  const statusClass = shop.isActive ? "bg-green-500" : "bg-gray-400";
  const statusText = shop.isActive ? "App installed" : "Setup pending";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            WhatsApp Automation Settings
          </h1>
          <p className="text-gray-600 mb-6">
            Configure your Twilio credentials to enable WhatsApp messaging for{" "}
            <span className="font-medium">{shop.domain}</span>
          </p>

          <Form method="post" className="space-y-6">
            <input type="hidden" name="shop" value={shop.id} />

            <div>
              <label
                htmlFor="twilioAccountSid"
                className="block text-sm font-medium text-gray-700"
              >
                Twilio Account SID
              </label>
              <input
                type="text"
                id="twilioAccountSid"
                name="twilioAccountSid"
                defaultValue={shop.twilioAccountSid}
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Find this in your Twilio Console dashboard
              </p>
            </div>

            <div>
              <label
                htmlFor="twilioAuthToken"
                className="block text-sm font-medium text-gray-700"
              >
                Twilio Auth Token
              </label>
              <input
                type="password"
                id="twilioAuthToken"
                name="twilioAuthToken"
                placeholder={shop.twilioAccountSid ? "••••••••••••••••" : ""}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Your Auth Token is encrypted before storage
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center">
                <div className={`h-2.5 w-2.5 rounded-full mr-2 ${statusClass}`} />
                <span className="text-sm text-gray-600">{statusText}</span>
              </div>

              <button
                type="submit"
                className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Settings
              </button>
            </div>
          </Form>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900">Next Steps</h3>
          <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>Configure your Twilio WhatsApp Sandbox</li>
            <li>Set up message templates for order notifications</li>
            <li>Test sending a message to your number</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  
  const shop = formData.get("shop");
  const twilioAccountSid = formData.get("twilioAccountSid");
  const twilioAuthToken = formData.get("twilioAuthToken");

  if (typeof shop !== "string" || !shop) {
    return { error: "Missing shop" };
  }
  if (typeof twilioAccountSid !== "string" || !twilioAccountSid) {
    return { error: "Missing Twilio Account SID" };
  }
  if (typeof twilioAuthToken !== "string" || !twilioAuthToken) {
    return { error: "Missing Twilio Auth Token" };
  }

  await updateShopTwilioCredentials(shop, {
    twilioAccountSid,
    twilioAuthToken,
  });

  return { success: true };
}
