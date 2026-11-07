import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { Plus, Edit, Trash2, Briefcase, Clock, TrendingUp } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"

// Reusable Master Card Component
function MasterCard({ title, description, icon: Icon, tableName }: any) {
  const [items, setItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any>(null)

  const [formData, setFormData] = useState({ name: "", description: "" })

  const fetchItems = async () => {
    setIsLoading(true)
    try {
      const res = await apiClient.get(`/masters/${tableName}`)
      setItems(res)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [tableName])

  const handleSave = async () => {
    try {
      if (editingItem) {
        await apiClient.put(`/masters/${tableName}/${editingItem.id}`, formData)
      } else {
        await apiClient.post(`/masters/${tableName}`, formData)
      }
      setIsModalOpen(false)
      setFormData({ name: "", description: "" })
      setEditingItem(null)
      fetchItems()
    } catch (err) {
      console.error("Save failed", err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this?")) return
    try {
      await apiClient.delete(`/masters/${tableName}/${id}`)
      fetchItems()
    } catch (err) {
      console.error("Delete failed", err)
    }
  }

  const openEdit = (item: any) => {
    setEditingItem(item)
    setFormData({ name: item.name, description: item.description || "" })
    setIsModalOpen(true)
  }

  const openAdd = () => {
    setEditingItem(null)
    setFormData({ name: "", description: "" })
    setIsModalOpen(true)
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" /> {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <Button onClick={openAdd} size="icon" variant="outline" className="rounded-full">
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto max-h-[300px]">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No records found.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md group">
                <span className="text-sm font-medium">{item.name}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(item)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {/* Add/Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit" : "Add"} {title.slice(0, -1)}</DialogTitle>
            <DialogDescription>Enter the details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="e.g., Remote" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Description (Optional)</label>
              <Input value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="e.g., Work from anywhere" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleSave} disabled={!formData.name.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

export default function MastersPage() {
  return (
    <BaseLayout title="Master Data Management" description="Manage job modes, types, and experience levels">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4 max-w-6xl mx-auto">
        <MasterCard
          title="Job Modes"
          description="Remote, Hybrid, Onsite"
          icon={Briefcase}
          tableName="job-modes"
        />
        <MasterCard
          title="Job Types"
          description="Full-time, Part-time, Contract"
          icon={Clock}
          tableName="job-types"
        />
        <MasterCard
          title="Experience Levels"
          description="Entry, Mid, Senior, Lead"
          icon={TrendingUp}
          tableName="experience-levels"
        />
      </div>
    </BaseLayout>
  )
}
