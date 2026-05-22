import { redirect } from "next/navigation";

interface VerifyRedirectPageProps {
  readonly searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function VerifyRedirectPage({
  searchParams,
}: VerifyRedirectPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();
  const url = params?.url;

  if (typeof url === "string" && url.trim()) {
    query.set("url", url);
  }

  redirect(query.size > 0 ? `/links?${query.toString()}` : "/links");
}
