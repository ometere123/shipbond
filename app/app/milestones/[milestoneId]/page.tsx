import { redirect } from "next/navigation";

export const metadata = { title: "Milestone Manifest" };

export default async function MilestoneManifestPage({ params }: { params: Promise<{ milestoneId: string }> }) {
  const { milestoneId } = await params;
  redirect(`/app/port/${milestoneId}`);
}
