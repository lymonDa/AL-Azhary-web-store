import { ClientSession } from 'mongoose';
import { RoleModel } from '../models/role.model';
import { IRoleDocument } from '../types/user.types';

export class RolesRepository {
  async findByKey(
    key: string,
    options?: { session?: ClientSession },
  ): Promise<IRoleDocument | null> {
    return RoleModel.findOne({ key }).session(options?.session || null).exec();
  }

  async upsertRole(
    data: {
      key: string;
      displayName: string;
      permissionKeys?: string[];
      isSystem?: boolean;
      active?: boolean;
    },
    options?: { session?: ClientSession },
  ): Promise<IRoleDocument> {
    return RoleModel.findOneAndUpdate(
      { key: data.key },
      {
        $setOnInsert: {
          key: data.key,
          displayName: data.displayName,
          permissionKeys: data.permissionKeys ?? [],
          isSystem: data.isSystem ?? true,
          active: data.active ?? true,
        },
      },
      {
        upsert: true,
        new: true,
        session: options?.session,
      },
    ).exec() as Promise<IRoleDocument>;
  }

  async listAll(options?: { session?: ClientSession }): Promise<IRoleDocument[]> {
    return RoleModel.find({ active: true }).session(options?.session || null).exec();
  }
}

export const rolesRepository = new RolesRepository();
