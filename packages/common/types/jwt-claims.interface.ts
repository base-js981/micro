export interface JwtClaims {
  userId: string;
  email: string;
  roles?: string[];
  scopes?: string[];
  iat?: number;
  exp?: number;
}

