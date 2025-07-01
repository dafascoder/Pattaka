import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/_layout')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div>
      <Outlet />
    </div>
  )
} 