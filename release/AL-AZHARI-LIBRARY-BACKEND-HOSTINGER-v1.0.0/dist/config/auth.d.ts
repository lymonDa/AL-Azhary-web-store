export declare const authConfig: {
    jwt: {
        accessSecret: string;
        accessTtl: string;
        refreshSecret: string;
        refreshTtl: string;
        issuer: string;
        audience: string;
    };
    cookie: {
        name: string;
        secure: boolean;
        sameSite: "lax" | "strict" | "none";
        httpOnly: boolean;
        path: string;
    };
    argon2: {
        memoryCost: number;
        timeCost: number;
        parallelism: number;
    };
};
