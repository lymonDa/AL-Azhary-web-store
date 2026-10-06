import { UsersRepository } from '../repositories/users.repository';
import { SafeUser, UpdateProfileInput } from '../types/user.types';
export declare class UsersService {
    private readonly repo;
    constructor(repo?: UsersRepository);
    getUserById(id: string): Promise<SafeUser>;
    getUserByEmail(email: string): Promise<SafeUser | null>;
    getUserByPhone(phone: string): Promise<SafeUser | null>;
    updateProfile(userId: string, input: UpdateProfileInput): Promise<SafeUser>;
}
export declare const usersService: UsersService;
