import { LoginCard } from '@/components/login-card';

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6">
      <div className="grid-overlay" />
      <div className="grain-overlay" />
      <div className="relative z-10">
        <LoginCard />
      </div>
    </main>
  );
}
