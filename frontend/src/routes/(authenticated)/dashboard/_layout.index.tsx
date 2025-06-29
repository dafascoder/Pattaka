import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { IconRobot, IconGitBranch, IconPlug, IconActivity, IconPlus, IconTrendingUp, IconClock, IconCheck, IconArrowRight } from '@tabler/icons-react'
import { useCurrentUser } from '@/lib/react-query'
import { DashboardOverview } from '@/components/dashboard/dashboard-overview'
import { apiClient } from '@/lib/api-client'

export const Route = createFileRoute('/(authenticated)/dashboard/_layout/')({
  component: DashboardPage,
  loader: async ({context}) => {
    const agents = await context.queryClient.fetchQuery({
      queryKey: ['agents'],
      queryFn: () => apiClient.getAgents()
    })
    return { agents, agentsLoading: false }
  },
})

function DashboardPage() {
  const { agents, agentsLoading } = Route.useLoaderData()

  return (
    <DashboardOverview agents={agents} agentsLoading={agentsLoading} />
  )

}
