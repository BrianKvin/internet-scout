import { request } from "@/services/api";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function signInRequest(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/sign-in", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ email, password }),
  });
}

export async function signUpRequest(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return request<AuthResponse>("/auth/sign-up", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ name, email, password }),
  });
}

export async function meRequest(): Promise<AuthUser> {
  return request<AuthUser>("/auth/me", { auth: true });
}
