import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const instant = false;

export default async function Home() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      redirect('/dashboard');
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err;
    }
  }

  redirect('/login');
}

