'use client'

import { use } from 'react'
import ProjectClient from './ProjectClient'
import AuthGuard from '@/components/auth/AuthGuard'

interface Props {
  params: Promise<{ project: string }>
}

export default function ProjectPage({ params }: Props) {
  const { project } = use(params) 

  return (
    <AuthGuard>
      <ProjectClient project={project} />
    </AuthGuard>
  )
}