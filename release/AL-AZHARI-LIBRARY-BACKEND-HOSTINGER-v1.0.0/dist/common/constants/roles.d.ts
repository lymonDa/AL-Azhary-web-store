export declare const UserRoles: {
    readonly CUSTOMER: "customer";
    readonly ADMIN: "admin";
    readonly OWNER: "owner";
};
export type UserRole = (typeof UserRoles)[keyof typeof UserRoles];
