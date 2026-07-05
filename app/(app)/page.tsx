import { redirect } from "next/navigation";
import { auth } from "@/auth";
import GeneratePage from "./generate/page";

type RootPageProps = Parameters<typeof GeneratePage>[0];

// Signed-in users land on their workspace dashboard by default; anonymous
// visitors keep the QR generator as the root experience (the root stays a
// tool, not a marketing page).
export default async function RootPage(props: RootPageProps) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return <GeneratePage {...props} />;
}
