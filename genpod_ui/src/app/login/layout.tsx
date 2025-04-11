// src/app/login/layout.tsx
export const metadata = {
  title: 'Login - Genpod',
  description: 'Secure login to your Genpod workspace',
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-screen h-screen bg-gradient-to-br from-[#14532d] via-[#0f766e] to-[#0a0a0a] flex items-center justify-center">
      {children}
    </div>
  )
}