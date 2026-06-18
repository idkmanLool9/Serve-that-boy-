export type Role = 'CUSTOMER' | 'SERVER';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED';

export type RequestType = 'item' | 'ice_cream' | 'clothes' | 'help' | 'custom';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  familyId: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  role: Role;
}

export interface Family {
  id: string;
  name: string;
  inviteCode: string;
  members: FamilyMember[];
}

export interface FamilyRequest {
  id: string;
  type: RequestType;
  title: string;
  note: string | null;
  status: RequestStatus;
  reply: string | null;
  createdAt: string;
  acceptedAt: string | null;
  completedAt: string | null;
  customer: { id: string; name: string } | null;
  server: { id: string; name: string } | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}
