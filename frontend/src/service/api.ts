import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "../config/env";

export const api = axios.create({
  baseURL: API_BASE_URL,
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
    const response = await api.post("/api/auth/register", data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Đăng ký thất bại. Vui lòng thử lại sau.");
  }
};

export const loginUser = async (data: { email: string; password: string }) => {
  try {
    const response = await api.post("/api/auth/login", data);
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
    const response = await api.get("/api/accounts/");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải danh sách tài khoản.");
  }
};

export const createAccount = async (data: { name: string; type: string; balance?: number }) => {
  try {
    const response = await api.post("/api/accounts/", data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Tạo tài khoản thất bại.");
  }
};

export const updateAccount = async (id: string, data: { name?: string; type?: string; balance?: number }) => {
  try {
    const response = await api.put(`/api/accounts/${id}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Cập nhật tài khoản thất bại.");
  }
};

export const deleteAccount = async (id: string) => {
  try {
    const response = await api.delete(`/api/accounts/${id}`);
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
    const response = await api.get("/api/categories/");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải danh sách danh mục.");
  }
};

export const createCategory = async (data: { name: string; type: string; icon?: string; color?: string }) => {
  try {
    const response = await api.post("/api/categories/", data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Tạo danh mục thất bại.");
  }
};

export const updateCategory = async (id: string, data: { name?: string; type?: string; icon?: string; color?: string }) => {
  try {
    const response = await api.put(`/api/categories/${id}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Cập nhật danh mục thất bại.");
  }
};

export const deleteCategory = async (id: string) => {
  try {
    const response = await api.delete(`/api/categories/${id}`);
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
    const response = await api.get("/api/transactions/");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải danh sách giao dịch.");
  }
};

export interface Transaction {
  amount: number;
  type: string;
  date: string;
  note?: string;
  account_id: string;
  category_id?: string;
  savings_goal_id?: string;
  debt_id?: string;
}

export const createTransaction = async (data: Transaction) => {
  try {
    const response = await api.post("/api/transactions/", data);
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
    const response = await api.put(`/api/transactions/${id}`, data);
    window.dispatchEvent(new Event("refresh_transactions"));
    return response.data;
  } catch (error) {
    handleApiError(error, "Cập nhật giao dịch thất bại.");
  }
};

export const deleteTransaction = async (id: string) => {
  try {
    const response = await api.delete(`/api/transactions/${id}`);
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
    const response = await api.get(`/api/stats/summary?period=${period}`);
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
    const response = await api.get("/api/users/me");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải thông tin hồ sơ.");
  }
};

export const updateProfile = async (data: { full_name?: string; email?: string; password?: string; avatar_url?: string }) => {
  try {
    const response = await api.put("/api/users/me", data);
    window.dispatchEvent(new Event("profile_updated"));
    return response.data;
  } catch (error) {
    handleApiError(error, "Cập nhật hồ sơ thất bại.");
  }
};

// ==========================================
// 7. Ngân Sách (Budgets)
// ==========================================

export const getBudgetReport = async (month: number, year: number) => {
  try {
    const response = await api.get(`/api/budgets/report?month=${month}&year=${year}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải báo cáo ngân sách.");
  }
};

export const upsertBudget = async (data: { amount_limit: number; month: number; year: number; category_id: string }) => {
  try {
    const response = await api.post("/api/budgets/", data);
    window.dispatchEvent(new Event("refresh_budgets"));
    return response.data;
  } catch (error) {
    handleApiError(error, "Cập nhật ngân sách thất bại.");
  }
};

// ==========================================
// 8. Notifications
// ==========================================

export const getUnreadCount = async () => {
  try {
    const response = await api.get("/api/notifications/unread-count");
    return response.data.unread_count;
  } catch (error) {
    handleApiError(error, "Không thể tải số lượng thông báo.");
  }
};

export const getNotifications = async () => {
  try {
    const response = await api.get("/api/notifications");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải danh sách thông báo.");
  }
};

export const markNotificationsAsRead = async () => {
  try {
    const response = await api.put("/api/notifications/mark-as-read");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể đánh dấu thông báo đã đọc.");
  }
};

export const deleteNotification = async (id: string) => {
  try {
    const response = await api.delete(`/api/notifications/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể xóa thông báo.");
  }
};

export const clearNotifications = async () => {
  try {
    const response = await api.delete("/api/notifications");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể xóa toàn bộ thông báo.");
  }
};

// ==========================================
// Savings Goal API
// ==========================================

export const getSavings = async () => {
  try {
    const response = await api.get("/api/savings");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải danh sách tiết kiệm.");
  }
};

export const createSaving = async (data: any) => {
  try {
    const response = await api.post("/api/savings", data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Tạo sổ tiết kiệm thất bại.");
  }
};

export const updateSaving = async (id: string, data: any) => {
  try {
    const response = await api.put(`/api/savings/${id}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Cập nhật sổ tiết kiệm thất bại.");
  }
};

export const deleteSaving = async (id: string) => {
  try {
    const response = await api.delete(`/api/savings/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Xóa sổ tiết kiệm thất bại.");
  }
};

export const deleteBudget = async (id: string) => {
  try {
    const response = await api.delete(`/api/budgets/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Xóa ngân sách thất bại.");
  }
};

// ==========================================
// 10. Debts (Khoản Nợ)
// ==========================================

export const listDebts = async () => {
  try {
    const response = await api.get("/api/debts");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải danh sách khoản nợ.");
  }
};

export const createDebt = async (data: {
  creditor_name: string;
  total_amount: number;
  monthly_payment: number;
  due_date: number;
}) => {
  try {
    const response = await api.post("/api/debts", data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Tạo khoản nợ thất bại.");
  }
};

export const updateDebt = async (id: string, data: {
  creditor_name?: string;
  total_amount?: number;
  remaining_amount?: number;
  monthly_payment?: number;
  due_date?: number;
}) => {
  try {
    const response = await api.put(`/api/debts/${id}`, data);
    return response.data;
  } catch (error) {
    handleApiError(error, "Cập nhật khoản nợ thất bại.");
  }
};

export const deleteDebt = async (id: string) => {
  try {
    const response = await api.delete(`/api/debts/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, "Xóa khoản nợ thất bại.");
  }
};

// ==========================================
// 11. Chat AI
// ==========================================

export const sendChatMessage = async (message: string): Promise<{ reply: string; transaction_created: boolean }> => {
  try {
    const response = await api.post("/api/chat", { message });
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể gửi tin nhắn đến trợ lý AI.");
  }
  return { reply: "", transaction_created: false };
};

export const getChatHistory = async (): Promise<{ id: string, role: string, content: string, created_at: string }[]> => {
  try {
    const response = await api.get("/api/chat/history");
    return response.data;
  } catch (error) {
    handleApiError(error, "Không thể tải lịch sử chat.");
  }
  return [];
};
