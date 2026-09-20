// Redirect /cms/loyalty → /cms/loyalty/members
import { redirect } from "next/navigation";

export default function LoyaltyHubRedirect() {
  redirect("/cms/loyalty/members");
}