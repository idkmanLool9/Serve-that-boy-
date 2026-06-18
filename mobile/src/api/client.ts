import { supabase } from '../lib/supabase';
import {
  AuthResponse,
  Family,
  FamilyRequest,
  RequestStatus,
  RequestType,
  Role,
  User,
} from '../types';

/** Turn any Supabase/PostgREST error into a readable message. */
export function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    return String((err as { message: unknown }).message);
  }
  return 'Something went wrong';
}

// The columns we always select for a request, including the customer/server
// names via the foreign-key relationships.
const REQUEST_SELECT =
  '*, customer:profiles!requests_customer_id_fkey(id,name), server:profiles!requests_server_id_fkey(id,name)';

// Raw row shape returned by Supabase (snake_case).
interface RequestRow {
  id: string;
  type: RequestType;
  title: string;
  note: string | null;
  status: RequestStatus;
  reply: string | null;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  customer: { id: string; name: string } | null;
  server: { id: string; name: string } | null;
}

/** Map a database row to the camelCase shape used throughout the UI. */
export function mapRequest(row: RequestRow): FamilyRequest {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    note: row.note,
    status: row.status,
    reply: row.reply,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
    completedAt: row.completed_at,
    customer: row.customer,
    server: row.server,
  };
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

/**
 * Creates the account. A database trigger reads this metadata and creates (or
 * joins) the family + profile atomically.
 *
 * Returns `{ needsConfirmation: true }` when the project still requires email
 * confirmation (no session yet); otherwise the user is signed in immediately.
 */
export async function signup(
  input: SignupInput,
): Promise<{ needsConfirmation: boolean }> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        role: input.role,
        family_name: input.familyName?.trim() || null,
        invite_code: input.inviteCode?.trim().toUpperCase() || null,
      },
    },
  });
  if (error) throw error;
  return { needsConfirmation: !data.session };
}

export async function login(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/** Load the signed-in user's profile, or null if not set up yet. */
export async function fetchMe(): Promise<User | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('id,name,role,family_id')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    email: auth.user.email ?? '',
    role: data.role as Role,
    familyId: data.family_id,
  };
}

// ---- Family ----

export async function fetchFamily(): Promise<Family> {
  const [{ data: fam, error: famErr }, { data: members, error: memErr }] = await Promise.all([
    supabase.from('families').select('id,name,invite_code').single(),
    supabase.from('profiles').select('id,name,role').order('created_at', { ascending: true }),
  ]);
  if (famErr) throw famErr;
  if (memErr) throw memErr;
  if (!fam) throw new Error('Family not found');

  return {
    id: fam.id,
    name: fam.name,
    inviteCode: fam.invite_code,
    members: (members ?? []).map((m) => ({ id: m.id, name: m.name, role: m.role as Role })),
  };
}

// ---- Requests ----

export async function fetchRequests(status?: RequestStatus): Promise<FamilyRequest[]> {
  let query = supabase
    .from('requests')
    .select(REQUEST_SELECT)
    .order('created_at', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  return (data as RequestRow[]).map(mapRequest);
}

export interface CreateRequestInput {
  type: RequestType;
  title?: string;
  note?: string;
}

export async function createRequest(input: CreateRequestInput): Promise<void> {
  const { error } = await supabase.rpc('create_request', {
    p_type: input.type,
    p_title: input.title ?? null,
    p_note: input.note ?? null,
  });
  if (error) throw error;
}

export async function acceptRequest(id: string): Promise<void> {
  const { error } = await supabase.rpc('accept_request', { p_id: id });
  if (error) throw error;
}

export async function completeRequest(id: string, reply?: string): Promise<void> {
  const { error } = await supabase.rpc('complete_request', { p_id: id, p_reply: reply ?? null });
  if (error) throw error;
}

export async function replyToRequest(id: string, reply: string): Promise<void> {
  const { error } = await supabase.rpc('reply_request', { p_id: id, p_reply: reply });
  if (error) throw error;
}

// Kept for API compatibility with the auth flow.
export type { AuthResponse };
