import { redirect } from "next/navigation";

export default function MarketplacePage() {
  // Marketplace listing has been folded into the dashboard (/dashboard).
  // Any visits to /marketplace should land on the main dashboard discover view.
  redirect("/dashboard");
}
