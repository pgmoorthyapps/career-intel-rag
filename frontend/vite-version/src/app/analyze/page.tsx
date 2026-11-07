import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { BaseLayout } from "@/components/layouts/base-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { apiClient } from "@/lib/api"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertCircle, FileText, Briefcase, MapPin, Clock, GraduationCap, Send, MessageSquare, X, Bot, User } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface ChatMessage {
  role: "user" | "ai"
  content: string
}

export default function AnalyzePage() {
  const [searchParams] = useSearchParams()
  const jobId = searchParams.get("job_id")

  const [resumes, setResumes] = useState<any[]>([])
  const [job, setJob] = useState<any>(null)
  const [selectedResumeId, setSelectedResumeId] = useState<string>("")

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatQuestion, setChatQuestion] = useState("")
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)

  const chatEndRef = useRef<HTMLDivElement>(null)

  // 1. Fetch initial data
  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        const [resumesRes, jobRes] = await Promise.all([
          apiClient.resume.getAll(),
          apiClient.job.getById(Number(jobId))
        ])
        if (isMounted) {
          setResumes(resumesRes)
          setJob(jobRes)
          if (resumesRes.length > 0) {
            setSelectedResumeId(resumesRes[0].id.toString())
          }
        }
      } catch (err) {
        console.error(err)
        if (isMounted) setError("Failed to load job or resume data.")
      }
    }
    if (jobId) fetchData()
    return () => { isMounted = false }
  }, [jobId])

  // 2. Separate effect to handle analysis once data is ready
  useEffect(() => {
    if (selectedResumeId && jobId && !result && !loading) {
      runAnalysis(selectedResumeId)
    }
  }, [selectedResumeId, jobId])

  const runAnalysis = async (resumeId: string) => {
    if (!resumeId || !jobId) return
    setLoading(true)
    setError("")
    setResult(null)
    setChatHistory([])

    try {
      const res = await apiClient.analysis.match(Number(resumeId), Number(jobId))
      setResult(res)
    } catch (err: any) {
      setError(err.message || "Failed to analyze match")
    } finally {
      setLoading(false)
    }
  }

  const handleResumeChange = (newResumeId: string) => {
    if (newResumeId === selectedResumeId) return
    setSelectedResumeId(newResumeId)
    setResult(null)
  }

  const handleChat = async () => {
    if (!chatQuestion.trim() || !selectedResumeId || !jobId) return

    const userMsg: ChatMessage = { role: "user", content: chatQuestion }
    setChatHistory((prev) => [...prev, userMsg])
    setChatQuestion("")
    setChatLoading(true)

    try {
      const res = await apiClient.analysis.chat(Number(selectedResumeId), Number(jobId), userMsg.content)
      const aiMsg: ChatMessage = { role: "ai", content: res.answer }
      setChatHistory((prev) => [...prev, aiMsg])
    } catch (err) {
      const errorMsg: ChatMessage = { role: "ai", content: "Failed to get an answer. Please try again." }
      setChatHistory((prev) => [...prev, errorMsg])
    } finally {
      setChatLoading(false)
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory, chatLoading])

  return (
    <BaseLayout title="Match Analysis" description="AI-powered resume to job comparison">
      <div className="max-w-5xl mx-auto p-4 space-y-6 pb-24">

        {/* Job Details Header */}
        {job && (
          <Card className="bg-muted/30">
            <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Briefcase className="h-6 w-6 text-primary" /> {job.title}
                </CardTitle>
                <CardDescription className="text-base">{job.company}</CardDescription>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Badge variant="secondary" className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.job_mode?.name}</Badge>
                  <Badge variant="secondary" className="flex items-center gap-1"><Clock className="h-3 w-3" /> {job.job_type?.name}</Badge>
                  <Badge variant="secondary" className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {job.experience_level?.name}</Badge>
                </div>
              </div>

              <div className="w-full md:w-72 shrink-0 flex flex-col gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Resume</label>
                <Select
                  value={selectedResumeId}
                  onValueChange={handleResumeChange}
                  items={resumes.reduce((acc, r) => ({ ...acc, [r.id.toString()]: r.filename }), {})}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a resume" />
                  </SelectTrigger>
                  <SelectContent>
                    {resumes.map((r) => (
                      <SelectItem key={r.id} value={r.id.toString()}>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" /> {r.filename}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Analysis auto-updates on change.</p>
              </div>
            </CardHeader>
          </Card>
        )}

        {error && <p className="text-red-500 font-medium text-center bg-red-50 p-3 rounded-md">{error}</p>}

        {loading && (
          <div className="min-h-[400px] flex items-center justify-center">
            <p className="text-center text-muted-foreground animate-pulse text-lg">Analyzing your profile...</p>
          </div>
        )}

        {/* Match Analysis Results */}
        {result && !loading && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[400px]">
            <Card>
              <CardHeader>
                <CardTitle>Overall Match Score</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div className="text-6xl font-bold text-primary">{result.match_score}%</div>
                <Progress value={result.match_score} className="w-full h-3" />
                <p className="text-center text-muted-foreground mt-2 text-lg">{result.summary}</p>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 /> Matched Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {result.matched_skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1">{skill}</Badge>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertCircle /> Missing Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.missing_skills.map((skill: any, i: number) => (
                    <div key={i} className="bg-muted p-3 rounded-md border">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">{skill.missing_skill}</span>
                        <Badge variant="outline">{skill.importance}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{skill.recommendation}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recommended Interview Questions</CardTitle>
                <CardDescription>Prepare for these based on your gaps</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-decimal pl-5 space-y-2">
                  {result.interview_questions.map((q: string, i: number) => (
                    <li key={i} className="text-sm font-medium">{q}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Floating Chat Button & Window */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">

        {isChatOpen && (
          <Card className="w-[350px] sm:w-[450px] md:w-[650px] shadow-2xl mb-4 border-primary/20 animate-in slide-in-from-bottom-5 flex flex-col">
            <CardHeader className="bg-primary/5 pb-4 border-b shrink-0">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg text-primary">Career AI Assistant</CardTitle>
                  <CardDescription>Ask about your fit for this role.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {/* Chat History */}
            <CardContent className="p-4 space-y-4 h-[500px] overflow-y-auto">
              {chatHistory.length === 0 && !chatLoading && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Ask questions like:<br/>
                  "What skills am I missing?"<br/>
                  "How can I improve my match score?"
                </p>
              )}

              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'ai' && (
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="h-3 w-3 text-primary" />
                    </div>
                  )}

                  {/* Chat Bubble with Markdown Support */}
                  <div className={`p-3 rounded-lg text-sm max-w-[90%] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-none whitespace-pre-wrap'
                      : 'bg-muted rounded-tl-none'
                  }`}>
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <div className="overflow-x-auto w-full">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            table: ({node, ...props}) => <table className="w-full text-left border-collapse my-2" {...props} />,
                            th: ({node, ...props}) => <th className="border-b border-primary/20 p-2 font-semibold bg-primary/5" {...props} />,
                            td: ({node, ...props}) => <td className="border-b border-muted-foreground/20 p-2" {...props} />,
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            br: () => <br className="my-1" />
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <div className="p-3 rounded-lg bg-muted rounded-tl-none text-sm text-muted-foreground animate-pulse">
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </CardContent>

            {/* Input */}
            <div className="p-3 border-t bg-background shrink-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Type your question..."
                  value={chatQuestion}
                  onChange={(e) => setChatQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                  className="bg-muted/50"
                />
                <Button onClick={handleChat} disabled={chatLoading || !chatQuestion.trim()} size="icon">
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        <Button
          size="lg"
          className="rounded-full shadow-lg h-14 w-14"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          {isChatOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        </Button>
      </div>

    </BaseLayout>
  )
}
