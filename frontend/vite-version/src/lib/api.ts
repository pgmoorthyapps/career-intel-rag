const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

// Generic HTTP Client Wrapper
const request = async (endpoint: string, options: RequestInit = {}) => {
  // Get token from local storage if it exists
  const token = localStorage.getItem("token");

  // Setup headers
  const headers = new Headers(options.headers);

  // If body is not FormData, set JSON content type
  if (options.body && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams)) {
    headers.set("Content-Type", "application/json");
  }

  // Attach Bearer token if available
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle errors globally
  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - token might be expired
      localStorage.removeItem("token");
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
};

// API Service Methods
export const apiClient = {
  get: (endpoint: string) => request(endpoint, { method: "GET" }),

  post: (endpoint: string, body?: any) => request(endpoint, {
    method: "POST",
    body: body instanceof URLSearchParams ? body : JSON.stringify(body)
  }),

  put: (endpoint: string, body?: any) => request(endpoint, {
    method: "PUT",
    body: JSON.stringify(body)
  }),

  delete: (endpoint: string) => request(endpoint, { method: "DELETE" }),

  // ==========================================
  // Specific API Endpoints
  // ==========================================

  auth: {
    login: (email: string, password: string) => {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      // We use standard request because it requires 'application/x-www-form-urlencoded'
      return fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      }).then(async (res) => {
        if (!res.ok) throw new Error("Invalid email or password");
        return res.json();
      });
    },
    register: (data: any) => apiClient.post("/auth/register", data),
    getMe: () => apiClient.get("/auth/me"),
  },

  resume: {
    uploadFile: async (file: File) => {
      const formData = new FormData()
      formData.append("file", file)

      // Note: We are not using the generic 'post' here because
      // we need to send FormData (no JSON.stringify)
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/resumes/upload`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          // Let browser set Content-Type for FormData automatically
        },
        body: formData
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.detail || "Upload failed")
      }
      return res.json()
    },
        getAll: () => apiClient.get("/resumes/"),
  delete: (id: number) => apiClient.delete(`/resumes/${id}`),

  },

  job: {
    upload: (title: string, company: string, content: string, job_mode_id?: number, job_type_id?: number, experience_level_id?: number) =>
      apiClient.post("/jobs/upload", {
        title,
        company,
        content,
        job_mode_id,
        job_type_id,
        experience_level_id
      }),
          getAll: () => apiClient.get("/jobs/"),
           getById: (id: number) => apiClient.get(`/jobs/${id}`),
 delete: (id: number) => apiClient.delete(`/jobs/${id}`),
  },

  analysis: {
    match: (resume_id: number, job_id: number) =>
      apiClient.post("/analysis/match", { resume_id, job_id }),
    chat: (resume_id: number, job_id: number, question: string) =>
      apiClient.post("/analysis/chat", { resume_id, job_id, question }),
  }
};
