import { useState, useEffect, useMemo } from "react"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { apiClient } from "@/lib/api"
import { useNavigate } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, MapPin, Clock, GraduationCap } from "lucide-react"

export default function JobListPage() {
  const [jobs, setJobs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  // Filters State
  const [selectedMode, setSelectedMode] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [selectedLevel, setSelectedLevel] = useState("all")

  // Dropdown Data State
  const [jobModes, setJobModes] = useState<any[]>([])
  const [jobTypes, setJobTypes] = useState<any[]>([])
  const [experienceLevels, setExperienceLevels] = useState<any[]>([])

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobsRes, modesRes, typesRes, levelsRes] = await Promise.all([
          apiClient.job.getAll(),
          apiClient.get("/masters/job-modes"),
          apiClient.get("/masters/job-types"),
          apiClient.get("/masters/experience-levels")
        ])
        setJobs(jobsRes)
        setJobModes(modesRes)
        setJobTypes(typesRes)
        setExperienceLevels(levelsRes)
      } catch (err) {
        console.error("Failed to fetch data", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filter Logic
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchMode = selectedMode === "all" || job.job_mode?.name === selectedMode
      const matchType = selectedType === "all" || job.job_type?.name === selectedType
      const matchLevel = selectedLevel === "all" || job.experience_level?.name === selectedLevel
      return matchMode && matchType && matchLevel
    })
  }, [jobs, selectedMode, selectedType, selectedLevel])

  // Pagination Logic
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedJobs = filteredJobs.slice(startIndex, startIndex + itemsPerPage)

  const handleApply = (jobId: number) => {
    navigate(`/candidate/analyze?job_id=${jobId}`)
  }

  // Reset page to 1 whenever a filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedMode, selectedType, selectedLevel])

  return (
    <BaseLayout title="Browse Jobs" description="Find your next opportunity">
      <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto">

        {/* Filter Bar with 3 Dropdowns */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-card p-4 rounded-lg border">
          <div className="flex flex-wrap items-center gap-4 w-full">
            {/* Mode Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mode:</span>
              <Select value={selectedMode} onValueChange={setSelectedMode}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Modes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {jobModes.map((m) => (
                    <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Type:</span>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {jobTypes.map((t) => (
                    <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Level Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Level:</span>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {experienceLevels.map((l) => (
                    <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="text-sm text-muted-foreground shrink-0 mt-2 md:mt-0">
            Showing {filteredJobs.length} job(s)
          </div>
        </div>

        {/* Job Cards Grid */}
        {isLoading ? (
          <p>Loading jobs...</p>
        ) : filteredJobs.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No jobs found matching your criteria.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedJobs.map((job) => (
              <Card key={job.id} className="flex flex-col h-full hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline">{job.job_mode?.name || "Remote"}</Badge>
                    {job.job_type && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {job.job_type.name}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="line-clamp-1">{job.title}</CardTitle>
                  <CardDescription className="line-clamp-1">{job.company}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-4">{job.content}</p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 border-t pt-4">
                  <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-3 w-3" /> {job.experience_level?.name || "Mid Level"}
                    </span>
                  </div>
                  <Button className="w-full" onClick={() => handleApply(job.id)}>
                    Analyze Match
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredJobs.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredJobs.length)} of {filteredJobs.length} entries
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
          </div>
        )}

      </div>
    </BaseLayout>
  )
}
