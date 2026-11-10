import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AppShell } from '@/components/layout/app-shell';

export const instant = false;

interface AdminUserMetadata {
  name?: string;
  role?: string;
}

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await connection();

  let user: {
    id?: string;
    email?: string;
    user_metadata?: AdminUserMetadata;
  } | null = null;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data?.user ?? null;
  } catch {
    user = null;
  }

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
