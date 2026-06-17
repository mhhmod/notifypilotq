import { headers } from "next/headers";
import { redirect } from "next/navigation";

const EMPTY_HOSTS = new Set(["lnnsy.com", "www.lnnsy.com"]);

export default async function HomePage() {
  const host = (await headers()).get("host")?.split(":")[0].toLowerCase();

  if (host && EMPTY_HOSTS.has(host)) {
    return null;
  }

  redirect("/dashboard");
}
