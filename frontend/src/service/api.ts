import axios from "axios"

const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000"

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000
})

if (!import.meta.env.VITE_API_URL) {
  console.warn("VITE_API_URL not set, using fallback:", API_URL)
}