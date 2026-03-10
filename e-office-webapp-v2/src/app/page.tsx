import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { withBasePath } from '@/lib/navigation';

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('better-auth.session_token');
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
  
  if (sessionCookie) {
    redirect(withBasePath('/dashboard'));
  } else {
    redirect(withBasePath('/login'));
  }
}
