import mongoose from 'mongoose';
import { runSeeds, Seeder } from '../../src/database/seed';

describe('Database Seed Infrastructure', () => {
  it('executes registered seeders in sorted order', async () => {
    const executed: string[] = [];

    const seeder1: Seeder = {
      id: '001_initial_settings',
      description: 'Seed initial settings',
      run: async () => {
        executed.push('001_initial_settings');
      },
    };

    const seeder2: Seeder = {
      id: '002_initial_roles',
      description: 'Seed initial roles',
      run: async () => {
        executed.push('002_initial_roles');
      },
    };

    const result = await runSeeds({
      connection: mongoose.connection,
      seeders: [seeder2, seeder1], // Pass in reverse order
    });

    expect(result.success).toBe(true);
    expect(result.executed).toEqual(['001_initial_settings', '002_initial_roles']);
    expect(executed).toEqual(['001_initial_settings', '002_initial_roles']);
  });

  it('filters execution when specific seedIds are provided', async () => {
    const executed: string[] = [];

    const seeder1: Seeder = {
      id: '001_test',
      description: 'Seeder 1',
      run: async () => {
        executed.push('001_test');
      },
    };

    const seeder2: Seeder = {
      id: '002_test',
      description: 'Seeder 2',
      run: async () => {
        executed.push('002_test');
      },
    };

    const result = await runSeeds({
      connection: mongoose.connection,
      seeders: [seeder1, seeder2],
      seedIds: ['002_test'],
    });

    expect(result.success).toBe(true);
    expect(result.executed).toEqual(['002_test']);
    expect(executed).toEqual(['002_test']);
  });
});
