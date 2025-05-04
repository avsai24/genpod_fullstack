'use client'

export default function ProjectsPanel() {
  const projects = ['avsai', 'charan', 'chandu', 'viswas']

  return (
    <div
      className="absolute top-0 left-16 w-48 bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)] rounded-md shadow-lg z-50"
      onMouseLeave={(e) => {
        // optional: you can move this into Sidebar logic too
      }}
    >
      <div className="p-3 text-xs font-semibold text-[var(--text-secondary)] uppercase border-b border-[var(--border)]">
        Projects
      </div>
      <ul className="p-2 space-y-1">
        {projects.map((project) => (
          <li
            key={project}
            className="px-3 py-1 rounded hover:bg-[var(--surface-hover)] cursor-pointer text-sm"
          >
            {project}
          </li>
        ))}
      </ul>
    </div>
  )
}