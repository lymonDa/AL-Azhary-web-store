import { RolesRepository } from '../repositories/roles.repository';
import { IRoleDocument } from '../types/user.types';
import { AuditService } from '../../audit/services/audit.service';
export declare const SYSTEM_ROLE_DEFINITIONS: ({
    key: "customer";
    displayName: string;
    permissionKeys: never[];
    isSystem: boolean;
    active: boolean;
} | {
    key: "admin";
    displayName: string;
    permissionKeys: string[];
    isSystem: boolean;
    active: boolean;
} | {
    key: "owner";
    displayName: string;
    permissionKeys: string[];
    isSystem: boolean;
    active: boolean;
})[];
export declare class RolesService {
    private readonly repo;
    private readonly audit;
    constructor(repo?: RolesRepository, audit?: AuditService);
    getRoleByKey(key: string): Promise<IRoleDocument | null>;
    hasPermission(roleKey: string, requiredPermission: string): Promise<boolean>;
    updateRolePermissions(roleKey: string, permissionKeys: string[], actor?: {
        id: string;
        role: string;
        requestId?: string;
        ipHash?: string;
    }): Promise<IRoleDocument>;
    ensureSystemRoles(): Promise<void>;
}
export declare const rolesService: RolesService;
