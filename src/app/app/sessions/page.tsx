import { redirect } from "next/navigation";

// Redirect /app/sessions to /app/history
export default function SessionsPage() {
  redirect("/app/history");
}
