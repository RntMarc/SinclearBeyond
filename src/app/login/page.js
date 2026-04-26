import { redirect } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import SiteHeader from "@/components/header/SiteHeader";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const session = await getSession();

  return (
    <>
      <SiteHeader variant="loginPage" />

      {session ? redirect("/home") : <LoginForm />}
    </>
  );
}
