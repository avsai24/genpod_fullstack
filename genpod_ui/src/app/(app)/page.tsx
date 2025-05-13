// /Users/venkatasaiancha/Documents/captenai/genpod_UI/genpod_ui/src/app/(app)/page.tsx

import AuthGuard from '@/components/auth/AuthGuard'
import PromptLayout from '@/components/layouts/PromptLayout'
import PromptView from '@/components/main_page/PromptView'

export default function Home() {
  return (
    <AuthGuard>
      <PromptLayout>
        <PromptView />
      </PromptLayout>
    </AuthGuard>
  )
}