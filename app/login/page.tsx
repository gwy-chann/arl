import Image from 'next/image'
import { LoginForm } from './login-form'
import { ThemeToggle } from './theme-toggle'

export const instant = false

export const metadata = {
  title: 'Log in · ARLQ',
  description: 'Administrator authentication for ARLQ inventory and sales system',
}

interface LoginPageProps {
  searchParams: Promise<{
    redirectTo?: string
  }>
}

export default async function LoginPage(props: LoginPageProps) {
  const searchParams = await props.searchParams
  const redirectTo = searchParams?.redirectTo || '/dashboard'

  return (
    <div className="relative min-h-screen grid grid-cols-1 md:grid-cols-[minmax(440px,46%)_1fr]">
      {/* Theme Toggle in top-right */}
      <div className="absolute top-[18px] right-[18px] z-20">
        <ThemeToggle />
      </div>

      {/* Brand Hero Sidebar */}
      <section className="relative flex flex-col justify-center items-center p-7 md:p-14 text-center bg-primary dark:bg-linear-to-b dark:from-[#166534] dark:to-[#14532D] text-text-light">
        <div className="flex flex-col items-center max-w-[440px] my-auto">
          <div className="w-[min(340px,90%)] mx-auto mb-9">
            <Image
              src="/logo.png"
              alt="ARL Quality Logo"
              width={340}
              height={140}
              priority
              className="w-full h-auto object-contain mx-auto"
            />
          </div>
          <div>
            <h1 className="text-2xl md:text-[32px] font-bold leading-tight max-w-[18ch] mx-auto tracking-tight text-text-light">
              Know what’s on the shelf and who still owes you.
            </h1>
            <p className="mt-4 text-[16.5px] leading-relaxed max-w-[34ch] mx-auto text-text-light/90">
              Stock levels, sales and utang for your toyo, suka and patis business, in one place.
            </p>
          </div>
        </div>
        <small className="hidden md:block absolute bottom-7 left-0 right-0 text-center text-[13.5px] text-text-light/70">
          ARLQ Food Condiments Trading
        </small>
      </section>

      {/* Login Form Container */}
      <section className="flex items-center justify-center p-6 md:p-12 bg-bg-base">
        <div className="w-full max-w-[470px] bg-bg-surface border border-border rounded-xl p-8 md:p-11 shadow-xs">
          <LoginForm redirectTo={redirectTo} />
        </div>
      </section>
    </div>
  )
}
