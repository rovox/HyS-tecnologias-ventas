export interface RosterUser {
  id: string;
  email: string;
  name: string;
  role: string;
  sucursalId: string;
  monthlyGoalBs: number;
  phone: string;
  localOnly?: boolean;
}

export declare const USERS: RosterUser[];
export declare const ROLE_ACCOUNTS: { admin: string; ventas: string; tecnico: string };
export declare function findUser(email: string): RosterUser;
export declare function localPasswordFor(email: string): string | undefined;
export declare function passwordFor(email: string): string;
export declare function credentialsFor(email: string): { email: string; password: string };
