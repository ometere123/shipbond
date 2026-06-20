import { redirect } from "next/navigation";

// Canonical URL is /app/milestones/create
export default function NewMilestonePage() {
  redirect("/app/milestones/create");
}
