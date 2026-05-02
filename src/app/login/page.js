import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import SiteHeader from "@/components/header/SiteHeader";
import { getSession } from "@/lib/auth/session";
import { validateRelativeCallbackUrl } from "@/lib/utils";

export default async function LoginPage({ searchParams }) {
  const session = await getSession();
  const { callbackUrl } = await searchParams;
  const validatedCallbackUrl = validateRelativeCallbackUrl(callbackUrl);

  if (session) {
    redirect(validatedCallbackUrl || "/home");
  }

  return (
    <>
      <SiteHeader variant="loginPage" />
      <LoginForm />
    </>
  );
}
