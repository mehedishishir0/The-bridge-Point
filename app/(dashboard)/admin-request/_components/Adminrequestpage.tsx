"use client"

import { CustomPagination } from "@/components/Shared/CustomePaginaion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useQuery, useMutation, useQueryClient, UseMutationResult } from "@tanstack/react-query"
import { ChevronDown } from "lucide-react"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { toast } from "sonner"

/* ───────────── TYPES ───────────── */
interface AdminRequest {
  _id: string
  firstName: string
  lastName: string
  email: string
  role: string
  profileImage: string
  verified: boolean
  phone?: string
  accessRoutes: string[]
  createdAt: string
  updatedAt: string
}

interface ApiResponse {
  statusCode: number
  success: boolean
  message: string
  data: {
    meta: { total: number; page: number; limit: number }
    data: AdminRequest[]
  }
}

interface RouteOption {
  value: string
  label: string
}

/* ───────────── AVAILABLE ROUTES ───────────── */
const AVAILABLE_ROUTES: RouteOption[] = [
  { value: "tenant-applications", label: "Tenant Applications" },
  { value: "extermination-applications", label: "Extermination Applications" },
  { value: "apartment-listings", label: "Apartment Listings" },
  { value: "add-apartment", label: "Add Apartment" },
  { value: "contactors", label: "Contactors" },
  { value: "services", label: "Services" },
  { value: "bookings", label: "Bookings" },
  { value: "payments", label: "Payments" },
  { value: "contacts", label: "Contacts" },
  { value: "newsletter", label: "Newsletter" },
  { value: "admin-request", label: "Admin Request" },
]

/* ───────────── HELPERS ───────────── */
const getRoleBadgeColor = (role: string) => {
  switch (role.toLowerCase()) {
    case "admin": return "bg-purple-100 text-purple-800"
    case "user": return "bg-blue-100 text-blue-800"
    case "moderator": return "bg-green-100 text-green-800"
    default: return "bg-gray-100 text-gray-800"
  }
}

/* ───────────── MUTATION TYPES ───────────── */
type UpdateRoutesVariables = { id: string; accessRoutes: string[] }
type ActionIdVariables = string
type MutationResponse = { success: boolean; message: string }

type UpdateRoutesMutation = UseMutationResult<
  MutationResponse,
  Error,
  UpdateRoutesVariables,
  unknown
>

type ActionMutation = UseMutationResult<
  MutationResponse,
  Error,
  ActionIdVariables,
  unknown
>

/* ───────────── PERMISSION ROW ───────────── */
interface PermissionRowProps {
  request: AdminRequest
  joinedDate: string
  updateRoutesMutation: UpdateRoutesMutation
  approveMutation: ActionMutation
  deactivateMutation: ActionMutation
}

function PermissionRow({
  request,
  joinedDate,
  updateRoutesMutation,
  approveMutation,
  deactivateMutation,
}: PermissionRowProps) {
  const [open, setOpen] = useState(false)
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>(request.accessRoutes)

  useEffect(() => {
    setSelectedRoutes(request.accessRoutes)
  }, [request.accessRoutes])

  const toggleRoute = (route: string) => {
    setSelectedRoutes(prev =>
      prev.includes(route) ? prev.filter(r => r !== route) : [...prev, route]
    )
  }

  const handleSave = () => {
    updateRoutesMutation.mutate(
      { id: request._id, accessRoutes: selectedRoutes },
      { onSuccess: () => setOpen(false) }
    )
  }

  const hasChanges = selectedRoutes.join(",") !== request.accessRoutes.join(",")

  /* Disable background scroll when modal open */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
  }, [open])

  return (
    <>
      <tr className="hover:bg-slate-50 transition-colors">
        {/* Name */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={request.profileImage || "/placeholder.svg"} alt={`${request.firstName} ${request.lastName}`} />
              <AvatarFallback>{request.firstName[0]}{request.lastName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-slate-900">{request.firstName} {request.lastName}</div>
              <div className="text-xs text-slate-500">ID: {request._id.slice(0, 8)}</div>
            </div>
          </div>
        </td>

        {/* Email */}
        <td className="px-6 py-4 text-sm text-slate-600">{request.email}</td>

        {/* Role */}
        <td className="px-6 py-4">
          <Badge className={getRoleBadgeColor(request.role)}>
            {request.role.charAt(0).toUpperCase() + request.role.slice(1)}
          </Badge>
        </td>

        {/* Phone */}
        <td className="px-6 py-4 text-sm text-slate-600">{request.phone || "N/A"}</td>

        {/* Permission Routes Button */}
        <td className="px-6 py-4">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs border border-slate-200 rounded-[8px] flex items-center gap-1"
            onClick={() => setOpen(true)}
          >
            Assign Routes
            <ChevronDown className="h-3 w-3" />
          </Button>
        </td>

        {/* Joined */}
        <td className="px-6 py-4 text-sm text-slate-600">{joinedDate}</td>

        {/* Actions */}
        <td className="px-6 py-4 text-center">
          <div className="flex justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="text-green-600"
              onClick={() => approveMutation.mutate(request._id)}
              disabled={approveMutation.isPending}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600"
              onClick={() => deactivateMutation.mutate(request._id)}
              disabled={deactivateMutation.isPending}
            >
              Deactivate
            </Button>
          </div>
        </td>
      </tr>

      {/* ───────────── MODAL ───────────── */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-[8px] shadow-lg w-80 max-h-[80vh] overflow-y-auto p-4 relative">
            <h3 className="text-sm font-medium mb-3">Select Access Routes</h3>
            <div className="space-y-2">
              {AVAILABLE_ROUTES.map(route => (
                <label key={route.value} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRoutes.includes(route.value)}
                    onChange={() => toggleRoute(route.value)}
                    className="h-4 w-4 accent-[#0F3D61]"
                  />
                  {route.label}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button  className="bg-[red] text-white !rounded-[4px] hover:bg-red/90" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#0F3D61] text-white !rounded-[4px] hover:bg-[#0d3454]"
                onClick={handleSave}
                disabled={updateRoutesMutation.isPending || !hasChanges}
              >
                {updateRoutesMutation.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ───────────── MAIN TABLE ───────────── */
function AdminRequestsTable() {
  const { data: session } = useSession()
  const token = session?.accessToken
  const [currentPage, setCurrentPage] = useState(1)
  const queryClient = useQueryClient()

  /* FETCH DATA */
  const { data, isLoading, error } = useQuery<ApiResponse>({
    queryKey: ["adminRequests", currentPage],
    queryFn: async () => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/all-request-admin?page=${currentPage}&limit=10`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!res.ok) throw new Error("Failed to fetch admin requests")
      return res.json()
    },
    enabled: !!token,
  })

  /* UPDATE ROUTES - TYPED */
  const updateRoutesMutation = useMutation<MutationResponse, Error, UpdateRoutesVariables, unknown>({
    mutationFn: async ({ id, accessRoutes }) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/update-access-routes/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ accessRoutes }),
        }
      )
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Update failed" }))
        throw new Error(err.message || "Failed to update access routes")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Access routes updated successfully")
      queryClient.invalidateQueries({ queryKey: ["adminRequests"] })
    },
    onError: (err) => toast.error(err.message || "Failed to update access routes"),
  })

  /* APPROVE */
  const approveMutation = useMutation<MutationResponse, Error, string, unknown>({
    mutationFn: async (id) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/update-admin/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!res.ok) throw new Error("Failed to approve admin request")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Admin approved successfully")
      queryClient.invalidateQueries({ queryKey: ["adminRequests"] })
    },
    onError: (err) => toast.error(err.message || "Something went wrong"),
  })

  /* DEACTIVATE */
  const deactivateMutation = useMutation<MutationResponse, Error, string, unknown>({
    mutationFn: async (id) => {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/delete-admin/${id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      )
      if (!res.ok) throw new Error("Failed to deactivate admin")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Admin deactivated successfully")
      queryClient.invalidateQueries({ queryKey: ["adminRequests"] })
    },
    onError: (err) => toast.error(err.message || "Something went wrong"),
  })

  const requests = data?.data?.data || []
  const totalItems = data?.data?.meta?.total || 0
  const limit = data?.data?.meta?.limit || 10

  if (error) return <div className="p-6 text-center text-red-600">Error: {(error as Error).message}</div>

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Name</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Email</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Role</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Phone</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Permission Routes</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900">Joined</th>
              <th className="px-6 py-4 text-sm font-semibold text-slate-900 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500 animate-pulse">
                  Loading requests…
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                  No admin requests found.
                </td>
              </tr>
            ) : (
              requests.map((request) => {
                const joinedDate = new Date(request.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
                return (
                  <PermissionRow
                    key={request._id}
                    request={request}
                    joinedDate={joinedDate}
                    updateRoutesMutation={updateRoutesMutation}
                    approveMutation={approveMutation}
                    deactivateMutation={deactivateMutation}
                  />
                )
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="w-full pb-3 mt-4">
        <CustomPagination
          totalItems={totalItems}
          itemsPerPage={limit}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  )
}

/* ───────────── PAGE ───────────── */
export default function AdminRequestPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Requests</h1>
      <AdminRequestsTable />
    </div>
  )
}
