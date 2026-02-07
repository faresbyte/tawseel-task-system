import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Role {
    id: string;
    name: string;
    created_at: string;
}

export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    role_id?: string;
    user_type: 'admin' | 'user';
    disabled: boolean;
    created_at: string;
    role?: Role;
}

export interface TaskDefinition {
    id: string;
    title: string;
    description?: string;
    subtasks: SubTask[];
    created_by: string;
    created_at: string;
}

export interface SubTask {
    id: string;
    title: string;
    description?: string;
}

export interface Assignment {
    id: string;
    task_id: string;
    user_id: string;
    assigned_by: string;
    assigned_at: string;
    due_date?: string;
    status: 'pending' | 'done' | 'rejected' | 'deficient';
    employee_notes?: string;
    admin_notes?: string;
    submitted: boolean;
    completed_at?: string;
    task?: TaskDefinition;
    user?: User;
}

export interface Routine {
    id: string;
    task_id: string;
    user_id: string;
    created_by: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    created_at: string;
    task?: TaskDefinition;
    user?: User;
}

// Helper Functions
export async function hashPassword(password: string): Promise<string> {
    // Simple hash for demo - في الإنتاج يجب استخدام bcrypt
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}
