import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  // Check if user is logged in (has session cookie)
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('better-auth.session_token');
  
  if (sessionCookie) {
    // User is logged in, redirect to dashboard
    redirect('/dashboard');
  } else {
    // User not logged in, redirect to login
    redirect('/login');
  }
}
