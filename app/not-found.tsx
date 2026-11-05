import Link from 'next/link';

export const metadata = {
  title: 'Page Not Found · ARLQ Food Condiments Trading',
};

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-bg-base text-text-primary text-center">
      <div className="w-full max-w-md bg-bg-surface border border-border rounded-2xl p-8 sm:p-10 shadow-sm flex flex-col items-center">
        {/* Brand Logo / Badge */}
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
          <span className="text-2xl font-bold font-mono">404</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-text-primary mb-2">
          Page Not Found
        </h1>

        <p className="text-sm text-text-muted mb-8 leading-relaxed max-w-xs">
          The page you are looking for doesn&apos;t exist or has moved. Explore one of our active sections instead.
        </p>

        <div className="w-full flex flex-col gap-2.5">
          <Link
            href="/dashboard"
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover text-text-light rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/products/categories"
            className="w-full py-2.5 px-4 bg-bg-muted hover:bg-border text-text-primary border border-border rounded-lg text-sm font-semibold transition-colors"
          >
            Product Categories
          </Link>
          <Link
            href="/login"
            className="text-xs text-text-muted hover:text-text-primary mt-2 transition-colors"
          >
            Sign in to another account →
          </Link>
        </div>
      </div>

      <p className="text-xs text-text-muted mt-8">
        ARLQ Food Condiments Trading · Inventory and Sales System
      </p>
    </main>
  );
}
