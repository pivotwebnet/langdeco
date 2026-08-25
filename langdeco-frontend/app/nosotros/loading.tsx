import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { PageLoadingSkeleton } from '@/components/ui/PageLoadingSkeleton'

export default function NosotrosLoading() {
  return (
    <>
      <Header />
      <main className="pd-page">
        <PageLoadingSkeleton variant="hero" />
      </main>
      <Footer />
    </>
  )
}
