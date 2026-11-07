import { useState, useRef, useEffect } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { UploadCloud, FileText, CheckCircle2, Trash2, ChevronLeft, ChevronRight } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
// Using standard Dialog instead of AlertDialog
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

export default function CandidateDashboard() {
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const [resumes, setResumes] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  const totalPages = Math.ceil(resumes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedResumes = resumes.slice(startIndex, startIndex + itemsPerPage)

  const fetchResumes = async () => {
    try {
      const res = await apiClient.resume.getAll()
      setResumes(res)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchResumes()
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError("")
      setMessage("")
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setIsLoading(true)
    setMessage("")
    setError("")

    try {
      const res = await apiClient.resume.uploadFile(file)
      setMessage(`Success! Resume processed successfully.`)
      localStorage.setItem("resume_id", res.resume_id.toString())
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
      fetchResumes()
    } catch (err: any) {
      setError(err.message || "Failed to upload resume")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await apiClient.resume.delete(id)
      setResumes(resumes.filter(r => r.id !== id))
      // Adjust page if last item on last page is deleted
      if (paginatedResumes.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      }
    } catch (err) {
      console.error("Delete failed", err)
    }
  }

  return (
    <BaseLayout title="Candidate Dashboard" description="Manage your resumes and find matching jobs">
      <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto p-4">

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload New Resume</CardTitle>
            <CardDescription>Upload your resume (PDF or TXT). Our AI will extract the text and analyze it against job descriptions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Input type="file" accept=".pdf,.txt" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              <UploadCloud className="h-10 w-10 text-muted-foreground mb-4" />
              <p className="text-sm font-medium">Click to select a file</p>
              <p className="text-xs text-muted-foreground mt-1">PDF or TXT up to 10MB</p>
            </div>

            {file && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium flex-1">{file.name}</span>
                <span className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            )}

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
            {message && (
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" /> {message}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleUpload} disabled={isLoading || !file}>
              {isLoading ? "Processing..." : "Upload & Analyze"}
            </Button>
          </CardFooter>
        </Card>

        {/* Resumes List with Pagination */}
        <Card>
          <CardHeader>
            <CardTitle>My Uploaded Resumes</CardTitle>
            <CardDescription>You have uploaded {resumes.length} resume(s) in total.</CardDescription>
          </CardHeader>
          <CardContent>
            {resumes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resumes uploaded yet.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File Name</TableHead>
                      <TableHead>Uploaded Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedResumes.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {r.filename}
                        </TableCell>
                        <TableCell>
                          {new Date(r.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                          })}
                        </TableCell>
                        <TableCell className="text-right">

                          {/* Dialog used for Delete Confirmation */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Delete Resume?</DialogTitle>
                                <DialogDescription>
                                  This will permanently delete <strong>{r.filename}</strong> and all associated AI analysis data.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <DialogClose asChild>
                                  <Button variant="outline">Cancel</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                  <Button onClick={() => handleDelete(r.id)} className="bg-red-500 hover:bg-red-600">
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
          {resumes.length > 0 && (
            <CardFooter className="flex items-center justify-between border-t px-6 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, resumes.length)} of {resumes.length} entries
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
