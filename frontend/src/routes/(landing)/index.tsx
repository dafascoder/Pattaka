import Hero from '@/components/landing/hero'
import Header from '@/components/landing/header'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(landing)/')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-grow">
        <Hero />
      </main>
    </div>
  )
}
