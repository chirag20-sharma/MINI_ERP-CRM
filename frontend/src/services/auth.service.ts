import apiFetch from './api';
import { User } from '../types';

export async function login(email: string, password: string): Promise<{ token: string; user: User }> {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<{ user: User }> {
  return apiFetch('/auth/me');
}
