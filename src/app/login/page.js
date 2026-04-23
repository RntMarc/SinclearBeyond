import { getSession } from "@/lib/session";
import { redirect } from 'next/navigation';
import SiteHeader from "@/components/SiteHeader";
import LoginForm from "@/components/LoginForm";

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
