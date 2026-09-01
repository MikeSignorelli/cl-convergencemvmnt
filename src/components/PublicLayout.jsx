import PublicNav from './PublicNav'
import PublicFooter from './PublicFooter'

export default function PublicLayout({ page = '/', children }) {
  return (
    <div className="flex min-h-screen flex-col bg-ink font-sans text-cream antialiased">
      <PublicNav page={page} />
      <main className="flex-1">{children}</main>
      <PublicFooter page={page} />
    </div>
  )
}
