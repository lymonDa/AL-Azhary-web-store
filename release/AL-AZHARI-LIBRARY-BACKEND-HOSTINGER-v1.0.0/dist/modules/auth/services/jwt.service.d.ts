import { AccessClaims } from '../types/auth.types';
export declare class JwtService {
    /**
     * Issues a short-lived access JWT containing only minimal architectural claims.
     */
    issueAccessToken(claims: AccessClaims): string;
    /**
     * Verifies access token signature, algorithm, issuer, audience, and expiration.
     */
    verifyAccessToken(token: string): AccessClaims;
}
export declare const jwtService: JwtService;
