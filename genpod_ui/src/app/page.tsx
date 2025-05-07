// src/app/page.tsx
import PromptLayout from '@/components/layouts/PromptLayout'
import PromptView from '@/components/main_page/PromptView'

export default function Home() {
  return (
    <PromptLayout>
      <PromptView />
    </PromptLayout>
  )
}