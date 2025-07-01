import { BuilderLayout } from '@/components/builder/builder-layout'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(authenticated)/builder')({
  component: RouteComponent,
})

function RouteComponent() {
  return <BuilderLayout />
}
