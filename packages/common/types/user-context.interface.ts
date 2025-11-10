export interface UserContext {
  userId: string;
  email: string;
  roles: string[];
  scopes?: string[];
  attributes?: Record<string, string>; // ABAC attributes: { department: 'engineering', level: 'senior' }
}

