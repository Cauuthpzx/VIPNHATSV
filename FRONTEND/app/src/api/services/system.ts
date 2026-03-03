import { api } from "../client";

// --- Types ---

export interface SystemUser {
  id: string;
  username: string;
  email: string | null;
  name: string;
  isActive: boolean;
  roleId: string;
  role: { id: string; name: string; type: string; level: number; permissions: string[] };
  createdAt: string;
  updatedAt: string;
}

export interface SystemRole {
  id: string;
  name: string;
  type: "ADMIN" | "MANAGER" | "VIEWER";
  level: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

interface ListResponse<T> {
  success: boolean;
  data: { users: T[]; total: number; page: number; limit: number };
}

interface SingleResponse<T> {
  success: boolean;
  data: T;
}

// --- Users ---

export function fetchUsers(params: { page?: number; limit?: number; search?: string }) {
  return api.get<ListResponse<SystemUser>>("/users", { params });
}

export function fetchUserById(id: string) {
  return api.get<SingleResponse<SystemUser>>(`/users/${id}`);
}

export function createUser(data: { username: string; email?: string; password: string; name: string; roleId: string }) {
  return api.post<SingleResponse<SystemUser>>("/users", data);
}

export function updateUser(id: string, data: { email?: string; name?: string; roleId?: string; isActive?: boolean }) {
  return api.put<SingleResponse<SystemUser>>(`/users/${id}`, data);
}

export function deleteUser(id: string) {
  return api.delete(`/users/${id}`);
}

// --- Roles ---

export function fetchRoles() {
  return api.get<SingleResponse<SystemRole[]>>("/roles");
}

export function fetchRoleById(id: string) {
  return api.get<SingleResponse<SystemRole>>(`/roles/${id}`);
}

export function createRole(data: { name: string; type: string; level?: number; permissions?: string[] }) {
  return api.post<SingleResponse<SystemRole>>("/roles", data);
}

export function updateRole(id: string, data: { name?: string; type?: string; level?: number; permissions?: string[] }) {
  return api.put<SingleResponse<SystemRole>>(`/roles/${id}`, data);
}

export function deleteRole(id: string) {
  return api.delete(`/roles/${id}`);
}
