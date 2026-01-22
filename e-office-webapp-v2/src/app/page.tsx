import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('better-auth.session_token');
  
  if (sessionCookie) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
