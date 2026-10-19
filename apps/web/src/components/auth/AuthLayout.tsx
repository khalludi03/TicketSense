import { useEffect, type ReactNode } from 'react';
import { useTheme } from '@/lib/theme';
import { ThemeToggle } from '@/components/theme-toggle';

interface AuthLayoutProps {
  children: ReactNode;
  showLogo?: boolean;
}

export function AuthLayout({ children, showLogo = true }: AuthLayoutProps) {
  const { resolvedTheme } = useTheme();

  // Reset to light when leaving auth pages so the rest of the app stays consistent.
  useEffect(() => {
    return () => {
      document.documentElement.classList.remove('dark');
    };
  }, []);

  return (
    <div className="relative flex min-h-screen w-full bg-background">
      {/* Brand panel - hidden on mobile */}
      <aside className="hidden lg:flex lg:w-1/2 xl:w-5/12">
        <BrandPanel />
      </aside>

      {/* Form area */}
      <main className="relative flex w-full flex-col items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8 xl:w-7/12">
        {/* Background pattern */}
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60 dark:opacity-20"
          aria-hidden="true"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, ${resolvedTheme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Theme toggle */}
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        {/* Mobile logo */}
        {showLogo && (
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900">
              <ZapIcon />
            </div>
            <span className="text-xl font-semibold tracking-tight text-foreground">TicketSense</span>
          </div>
        )}

        <div className="w-full max-w-sm animate-fade-in-up">{children}</div>
      </main>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative flex w-full flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 px-12 py-10 text-white">
      {/* Subtle glow */}
      <div
        className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
          <ZapIcon />
        </div>
        <span className="text-2xl font-semibold tracking-tight">TicketSense</span>
      </div>

      <div className="relative z-10 max-w-sm">
        <h2 className="text-3xl font-semibold leading-tight tracking-tight">AI-powered ticket triage</h2>
        <p className="mt-4 text-lg text-slate-300">
          Let your support team focus on what matters. TicketSense classifies, prioritizes, and routes tickets automatically.
        </p>
      </div>

      <div className="relative z-10 space-y-4">
        <Feature icon="sparkles" title="AI classification">
          Instant category and priority suggestions for every incoming ticket.
        </Feature>
        <Feature icon="users" title="Built for teams">
          Dedicated roles for customers, agents, and admins.
        </Feature>
        <Feature icon="barChart" title="Insightful metrics">
          Track AI acceptance rates and team performance at a glance.
        </Feature>
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  children,
}: {
  icon: 'sparkles' | 'users' | 'barChart';
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
        {icon === 'sparkles' && <SparklesIcon />}
        {icon === 'users' && <UsersIcon />}
        {icon === 'barChart' && <BarChartIcon />}
      </div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-slate-300">{children}</p>
      </div>
    </div>
  );
}

function ZapIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function SparklesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function BarChartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  );
}
