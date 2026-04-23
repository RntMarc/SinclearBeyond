import { getSession } from "@/lib/auth/session";
import { redirect } from 'next/navigation';
import SiteHeader from "@/components/header/SiteHeader";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await getSession();

  return (
    <>
      <SiteHeader variant="loginPage" />

      {session ? (
        redirect('/home')
      ) : (
        <LoginForm />
      )}
    </>
  );
}
