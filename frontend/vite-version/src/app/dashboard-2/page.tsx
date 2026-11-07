import { useState, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { apiClient } from "@/lib/api"
import { Briefcase, MapPin, Clock, GraduationCap, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
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

export default function EmployerDashboard() {
  // Form State
  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("Newpage Solutions")
  const [content, setContent] = useState("")
  const [jobMode, setJobMode] = useState("")
  const [jobType, setJobType] = useState("")
  const [expLevel, setExpLevel] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")

  // Dropdown Data
  const [modes, setModes] = useState<any[]>([])
  const [types, setTypes] = useState<any[]>([])
  const [levels, setLevels] = useState<any[]>([])

  // Jobs List State
  const [jobs, setJobs] = useState<any[]>([])
  const [isFetchingJobs, setIsFetchingJobs] = useState(true)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const totalPages = Math.ceil(jobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedJobs = jobs.slice(startIndex, startIndex + itemsPerPage)

  const fetchDropdowns = async () => {
    try {
      const [m, t, e] = await Promise.all([
        apiClient.get("/masters/job-modes"),
        apiClient.get("/masters/job-types"),
        apiClient.get("/masters/experience-levels")
      ])
      setModes(m)
      setTypes(t)
      setLevels(e)
    } catch (err) {
      console.error("Failed to load dropdowns", err)
    }
  }

  const fetchJobs = async () => {
    setIsFetchingJobs(true)
    try {
      const res = await apiClient.job.getAll()
      setJobs(res)
    } catch (err) {
      console.error("Failed to fetch jobs", err)
    } finally {
      setIsFetchingJobs(false)
    }
  }

  useEffect(() => {
    fetchDropdowns()
    fetchJobs()
  }, [])

  const handlePostJob = async () => {
    if (!title || !content || !company) return
    setIsLoading(true)
    setMessage("")

    try {
      await apiClient.job.upload(
        title,
        company,
        content,
        jobMode ? Number(jobMode) : undefined,
        jobType ? Number(jobType) : undefined,
        expLevel ? Number(expLevel) : undefined
      )
      setMessage(`Success! Job posted successfully.`)
      setTitle(""); setCompany(""); setContent(""); setJobMode(""); setJobType(""); setExpLevel("")
      fetchJobs()
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteJob = async (id: number) => {
    try {
      await apiClient.job.delete(id)
      setJobs(jobs.filter(j => j.id !== id))
      if (paginatedJobs.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (err) {
      console.error("Delete failed", err)
    }
  }

  return (
    <BaseLayout title="Employer Dashboard" description="Post job descriptions and find best candidates">
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-4">

        {/* Job Posting Form */}
        <Card>
          <CardHeader>
            <CardTitle>Post a New Job</CardTitle>
            <CardDescription>Enter job details to find matching candidates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Job Title</label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Senior Frontend Developer" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Company Name</label>
                <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Newpage Solutions" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Job Mode</label>
                <Select
                  value={jobMode}
                  onValueChange={setJobMode}
                  items={modes.reduce((acc, m) => ({ ...acc, [m.id.toString()]: m.name }), {})}
                >
                  <SelectTrigger><SelectValue placeholder="Select Mode" /></SelectTrigger>
                  <SelectContent>
                    {modes.map((m) => <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Job Type</label>
                <Select
                  value={jobType}
                  onValueChange={setJobType}
                  items={types.reduce((acc, t) => ({ ...acc, [t.id.toString()]: t.name }), {})}
                >
                  <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                  <SelectContent>
                    {types.map((t) => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Experience Level</label>
                <Select
                  value={expLevel}
                  onValueChange={setExpLevel}
                  items={levels.reduce((acc, l) => ({ ...acc, [l.id.toString()]: l.name }), {})}
                >
                  <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                  <SelectContent>
                    {levels.map((l) => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Job Description (JD)</label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste the full job description..." className="min-h-[150px]" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <span className={`text-sm ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</span>
            <Button onClick={handlePostJob} disabled={isLoading || !title || !content || !company}>
              {isLoading ? "Posting..." : "Post Job"}
            </Button>
          </CardFooter>
        </Card>

        {/* Posted Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>Posted Jobs</CardTitle>
            <CardDescription>You have posted {jobs.length} job(s).</CardDescription>
          </CardHeader>
          <CardContent>
            {isFetchingJobs ? (
              <p className="text-sm text-muted-foreground">Loading jobs...</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No jobs posted yet.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job Title</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            {job.title}
                          </div>
                        </TableCell>
                        <TableCell>{job.company}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            {job.job_mode && <Badge variant="secondary" className="flex items-center gap-1"><MapPin className="h-3 w-3"/> {job.job_mode.name}</Badge>}
                            {job.job_type && <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3"/> {job.job_type.name}</Badge>}
                            {job.experience_level && <Badge variant="secondary" className="flex items-center gap-1"><GraduationCap className="h-3 w-3"/> {job.experience_level.name}</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Job Posting?</DialogTitle>
                                <DialogDescription>
                                  This will permanently delete <strong>{job.title}</strong> and all associated candidates' analysis.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button onClick={() => handleDeleteJob(job.id)} className="bg-red-500 hover:bg-red-600">
                                    Delete
                                  </Button>
                                </DialogClose>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>

          {/* Pagination Controls */}
          {jobs.length > 0 && (
            <CardFooter className="flex items-center justify-between border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, jobs.length)} of {jobs.length} entries
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardFooter>
          )}
        </Card>

      </div>
    </BaseLayout>
  )
}
