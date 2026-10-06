import { ISettingDocument, UpdateSettingInput } from '../types/setting.types';
import { AuditService } from '../../audit/services/audit.service';
export declare class SettingService {
    private readonly audit;
    constructor(audit?: AuditService);
    getSettingByKey(key: string): Promise<ISettingDocument | null>;
    updateSetting(input: UpdateSettingInput, actor?: {
        id: string;
        role: string;
        requestId?: string;
        ipHash?: string;
    }): Promise<ISettingDocument>;
}
export declare const settingService: SettingService;
