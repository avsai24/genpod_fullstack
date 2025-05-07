'use client'
import ProjectClient from './ProjectClient'

export default function ProjectShell({ project }: { project: string }) {
  return <ProjectClient project={project} />
}