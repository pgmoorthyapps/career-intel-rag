import type { ComponentType } from "react"
import { Navigate, type RouteObject } from "react-router-dom"

function page(load: () => Promise<{ default: ComponentType }>) {
  return async () => ({ Component: (await load()).default })
}

export const routes: RouteObject[] = [
  { path: "/", element: <Navigate to="/auth/sign-in" replace /> },
  { path: "/auth/sign-in", lazy: page(() => import("@/app/auth/sign-in/page")) },
  { path: "/auth/sign-up", lazy: page(() => import("@/app/auth/sign-up/page")) },

  // Candidate Routes
  { path: "/candidate/dashboard", lazy: page(() => import("@/app/dashboard/page")) },
  { path: "/candidate/jobs", lazy: page(() => import("@/app/jobs/page")) },
  { path: "/candidate/analyze", lazy: page(() => import("@/app/analyze/page")) },

  // Employer Routes
  { path: "/employer/dashboard", lazy: page(() => import("@/app/dashboard-2/page")) },

  // Master Routes
  { path: "/masters", lazy: page(() => import("@/app/masters/page")) },

  { path: "*", element: <Navigate to="/auth/sign-in" replace /> },
]
