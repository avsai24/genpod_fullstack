import ProjectClient from './ProjectClient'

interface Props {
  params: { project: string }
}

export default async function ProjectPage({ params }: Props) {
  const { project } = await params;

  return (
    <div>
      <ProjectClient project={project} />
    </div>
  )
}