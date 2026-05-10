import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("auth", "routes/auth/index.ts"),
  route("auth/callback", "routes/auth/callback.ts"),
  route("api/settings", "routes/api/settings.ts"),
  route("api/roi", "routes/api/roi.ts"),
  route("api/dashboard/stats", "routes/api/dashboard/stats.ts"),
  route("api/dashboard/messages", "routes/api/dashboard/messages.ts"),
  route("api/dashboard/settings", "routes/api/dashboard/settings.ts"),
  route("webhook/shopify/checkout", "routes/webhook/checkout.ts"),
  route("webhook/shopify/order", "routes/webhook/order.ts"),
  route("track/:id", "routes/track.$id.ts"),
  route("app", "routes/app.tsx"),
] satisfies RouteConfig;
