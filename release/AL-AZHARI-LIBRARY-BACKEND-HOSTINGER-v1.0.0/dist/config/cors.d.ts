import { CorsOptions } from 'cors';
export declare function getAllowedOrigins(): string[];
export declare function isOriginAllowed(origin: string | undefined): boolean;
export declare const corsOptions: CorsOptions;
