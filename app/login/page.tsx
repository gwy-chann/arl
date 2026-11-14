import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';
import { ThemeToggle } from '@/components/theme/theme-toggle';

export const instant = false;

export const metadata = {
  title: 'Log in · ARLQ',
  description: 'Administrator authentication for ARLQ inventory and sales system',
};

interface LoginPageProps {
  searchParams: Promise<{
    redirectTo?: string;
  }>;
}

export default async function LoginPage(props: Readonly<LoginPageProps>) {
  const searchParams = await props.searchParams;
  const redirectTo = searchParams?.redirectTo || '/dashboard';

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      redirect(redirectTo.startsWith('/') ? redirectTo : '/dashboard');
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err;
    }
  }

  return (
    <div className="login">
      {/* Theme Toggle in top-right */}
      <div className="login-theme-toggle">
        <ThemeToggle variant="button" />
      </div>

      {/* Brand Hero Sidebar */}
      <section className="login-brand">
        <div className="top">
          <div
            className="logo-mark"
            role="img"
            aria-label="ARL Quality logo"
          />
          <div>
            <h1>Know what’s on the shelf and who still owes you.</h1>
            <p>
              Stock levels, sales and utang for your toyo, suka and patis business, in one place.
            </p>
          </div>
        </div>
        <small>ARLQ Food Condiments Trading</small>
      </section>

      {/* Login Form Container */}
      <section className="login-form-wrap">
        <div className="login-card">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </section>
    </div>
  );
}
