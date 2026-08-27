import PublicNav from './PublicNav'
import PublicFooter from './PublicFooter'

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-cv-bg text-cv-text font-sans antialiased flex flex-col">
      <PublicNav />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  )
}
