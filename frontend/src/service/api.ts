import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
});

// Interceptor: tự động gắn Bearer token vào mỗi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

if (!import.meta.env.VITE_API_URL) {
  console.warn("VITE_API_URL not set, using fallback:", API_URL);
}

// Hàm hỗ trợ xử lý lỗi từ FastAPI
const handleApiError = (error: unknown, defaultMessage: string): never => {
  if (error instanceof AxiosError && error.response?.data?.detail) {
    const detail = error.response.data.detail;
    if (typeof detail === "string") {
      throw new Error(detail);
    } else if (Array.isArray(detail)) {
      throw new Error(detail.map((err: any) => err.msg).join(", "));
    }
  }
  throw new Error(defaultMessage);
};

// ==========================================
// 1. Auth (Users)
// ==========================================

export const registerUser = async (data: { email: string; password: string }) => {
  try {
    const response = await api.post("/register", data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Đăng ký thất bại. Vui lòng thử lại sau.");
  }
};

export const loginUser = async (data: { email: string; password: string }) => {
  try {
    const response = await api.post("/login", data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
  }
};

// ==========================================
// 2. Accounts
// ==========================================

export const listAccounts = async () => {
  try {
    const response = await api.get("/accounts/");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải danh sách tài khoản.");
  }
};

export const createAccount = async (data: { name: string; type: string; balance?: number }) => {
  try {
    const response = await api.post("/accounts/", data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Tạo tài khoản thất bại.");
  }
};

export const updateAccount = async (id: string, data: { name?: string; type?: string; balance?: number }) => {
  try {
    const response = await api.put(`/accounts/${id}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Cập nhật tài khoản thất bại.");
  }
};

export const deleteAccount = async (id: string) => {
  try {
    const response = await api.delete(`/accounts/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Xoá tài khoản thất bại.");
  }
};

// ==========================================
// 3. Categories
// ==========================================

export const listCategories = async () => {
  try {
    const response = await api.get("/categories/");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải danh sách danh mục.");
  }
};

export const createCategory = async (data: { name: string; type: string; icon?: string; color?: string }) => {
  try {
    const response = await api.post("/categories/", data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Tạo danh mục thất bại.");
  }
};

export const updateCategory = async (id: string, data: { name?: string; type?: string; icon?: string; color?: string }) => {
  try {
    const response = await api.put(`/categories/${id}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Cập nhật danh mục thất bại.");
  }
};

export const deleteCategory = async (id: string) => {
  try {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Xoá danh mục thất bại.");
  }
};

// ==========================================
// 4. Transactions
// ==========================================

export const listTransactions = async () => {
  try {
    const response = await api.get("/transactions/");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải danh sách giao dịch.");
  }
};

export const createTransaction = async (data: {
  amount: number;
  type: string;
  date: string;
  note?: string;
  account_id: string;
  category_id?: string;
}) => {
  try {
    const response = await api.post("/transactions/", data);
    window.dispatchEvent(new Event("refresh_transactions"));
    return response.data;
  } catch (error) {
    handleApiError(error, "Tạo giao dịch thất bại.");
  }
};

export const updateTransaction = async (id: string, data: {
  amount?: number;
  type?: string;
  date?: string;
  note?: string;
  account_id?: string;
  category_id?: string;
}) => {
  try {
    const response = await api.put(`/transactions/${id}`, data);
    window.dispatchEvent(new Event("refresh_transactions"));
    return response.data;
  } catch (error) {
    handleApiError(error, "Cập nhật giao dịch thất bại.");
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    const response = await api.delete(`/transactions/${id}`);
    window.dispatchEvent(new Event("refresh_transactions"));
    return response.data;
  } catch (error) {
    handleApiError(error, "Xoá giao dịch thất bại.");
  }
};

// ==========================================
// 5. Thống Kê (Stats)
// ==========================================

export const getSummaryStats = async (period: string = "month") => {
  try {
    const response = await api.get(`/stats/summary?period=${period}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải dữ liệu thống kê.");
  }
};

// ==========================================
// 6. Users (Profile)
// ==========================================

export const getProfile = async () => {
  try {
    const response = await api.get("/users/me");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải thông tin hồ sơ.");
  }
};

export const updateProfile = async (data: { full_name?: string; email?: string; password?: string; avatar_url?: string }) => {
  try {
    const response = await api.put("/users/me", data);
    window.dispatchEvent(new Event("profile_updated"));
    return response.data;
  } catch (error) {
    handleApiError(error, "Cập nhật hồ sơ thất bại.");
  }
};