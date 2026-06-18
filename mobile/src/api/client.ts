import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config';
import {
  AuthResponse,
  Family,
  FamilyRequest,
  RequestStatus,
  RequestType,
  Role,
  User,
} from '../types';

export const TOKEN_KEY = 'fr.token';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
});

// Attach the stored JWT to every request.
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Normalize backend errors into a readable message. */
export function getErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; details?: unknown } | undefined;
    if (data?.error) return data.error;
    if (err.code === 'ECONNABORTED') return 'Request timed out. Check your connection.';
    if (!err.response) return 'Cannot reach the server. Is the backend running?';
    return err.message;
  }
  return 'Something went wrong';
}

// ---- Auth ----

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  familyName?: string;
  inviteCode?: string;
}

export async function signup(input: SignupInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/signup', input);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/auth/me');
  return data.user;
}

// ---- Family ----

export async function fetchFamily(): Promise<Family> {
  const { data } = await api.get<Family>('/family/me');
  return data;
}

// ---- Requests ----

export async function fetchRequests(status?: RequestStatus): Promise<FamilyRequest[]> {
  const { data } = await api.get<FamilyRequest[]>('/requests', {
    params: status ? { status } : undefined,
  });
  return data;
}

export interface CreateRequestInput {
  type: RequestType;
  title?: string;
  note?: string;
}

export async function createRequest(input: CreateRequestInput): Promise<FamilyRequest> {
  const { data } = await api.post<FamilyRequest>('/requests', input);
  return data;
}

export async function acceptRequest(id: string): Promise<FamilyRequest> {
  const { data } = await api.post<FamilyRequest>(`/requests/${id}/accept`);
  return data;
}

export async function completeRequest(id: string, reply?: string): Promise<FamilyRequest> {
  const { data } = await api.post<FamilyRequest>(`/requests/${id}/complete`, { reply });
  return data;
}

export async function replyToRequest(id: string, reply: string): Promise<FamilyRequest> {
  const { data } = await api.post<FamilyRequest>(`/requests/${id}/reply`, { reply });
  return data;
}

// ---- Push ----

export async function savePushToken(pushToken: string | null): Promise<void> {
  await api.put('/users/push-token', { pushToken });
}
