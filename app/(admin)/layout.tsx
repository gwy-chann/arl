import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';

export const instant = false;

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const userInfo = {
    name: (user.user_metadata?.name as string) || 'Administrator',
    role: (user.user_metadata?.role as string) || 'Owner account',
    email: user.email,
  };

  return <AppShell user={userInfo}>{children}</AppShell>;
}

