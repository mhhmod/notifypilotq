import { ButtonLink } from "@/components/ui/button";

export default function CampaignNotFound() {
  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-card">
      <h1 className="text-lg font-bold text-foreground">Campaign not found</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        The campaign may have been removed or is no longer available in this workspace.
      </p>
      <ButtonLink href="/dashboard/campaigns" className="mt-5">
        Back to campaigns
      </ButtonLink>
    </div>
  );
}
