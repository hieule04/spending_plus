import { useState, useEffect } from "react"
import { api } from "./service/api"
import "./App.css"

interface BackendStatus {
  message: string
}

interface DbStatus {
  status: string
  message: string
  supabase_version?: string
}

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null)
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkConnection = async () => {
      try {
        setLoading(true)
        const response = await api.get("/")
        setBackendStatus(response.data)
        setError(null)
      } catch (err) {
        console.error("Backend connection failed:", err)
        setError("Không thể kết nối với Backend. Hãy chắc chắn rằng server đang chạy.")
      } finally {
        setLoading(false)
      }
    }

    checkConnection()
  }, [])

  const testDatabase = async () => {
    try {
      setDbStatus(null)
      const response = await api.get("/test-db")
      setDbStatus(response.data)
    } catch (err) {
      console.error("Database test failed:", err)
      setDbStatus({
        status: "error",
        message: "Lỗi kết nối tới cơ sở dữ liệu."
      })
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-2">
            Spending Plus
          </h1>
          <p className="text-slate-400">Hệ thống quản lý chi tiêu thông minh</p>
        </header>

        <main className="space-y-6">
          {/* Backend Status Section */}
          <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Trạng thái Backend
            </h2>
            
            {loading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="h-4 bg-slate-700 rounded w-3/4"></div>
              </div>
            ) : error ? (
              <p className="text-red-400 flex items-center gap-2">
                ⚠️ {error}
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-emerald-400 font-medium">
                  ✅ Đã kết nối: <span className="text-slate-300">{backendStatus?.message}</span>
                </p>
                <code className="text-xs text-slate-500 block bg-black/30 p-2 rounded">
                  API: http://127.0.0.1:8000
                </code>
              </div>
            )}
          </div>

          {/* Database Control Section */}
          <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700">
            <h2 className="text-xl font-semibold mb-4">Kiểm tra kết nối Database</h2>
            
            <button
              onClick={testDatabase}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 transition-colors rounded-lg font-semibold shadow-lg shadow-blue-500/20 active:transform active:scale-95"
            >
              Test Supabase Connection
            </button>

            {dbStatus && (
              <div className={`mt-6 p-4 rounded-lg border ${
                dbStatus.status === "success" 
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}>
                <p className="font-bold flex items-center gap-2 mb-2">
                  {dbStatus.status === "success" ? "🎉" : "❌"} {dbStatus.message}
                </p>
                {dbStatus.supabase_version && (
                  <p className="text-sm opacity-80 italic">
                    Version: {dbStatus.supabase_version}
                  </p>
                )}
              </div>
            )}
          </div>
        </main>

        <footer className="mt-12 pt-6 border-t border-slate-700 text-center text-slate-500 text-sm">
          Spending Plus &bull; Built with FastAPI, React, and Supabase
        </footer>
      </div>
    </div>
  )
}

export default App