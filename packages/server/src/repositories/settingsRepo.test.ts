import { describe, expect, it } from 'vitest';
import { createSettingsRepo } from './settingsRepo';
import { createTestDb } from '../test/helpers';

describe('settingsRepo', () => {
  it('gets, sets, overwrites and lists', () => {
    const repo = createSettingsRepo(createTestDb());
    expect(repo.get('public_url')).toBeNull();
    repo.set('public_url', 'https://a.example', 1);
    repo.set('public_url', 'https://b.example', 2);
    repo.set('buzzer_code_A', 'ABCD', 3);
    expect(repo.get('public_url')).toBe('https://b.example');
    expect(repo.getAll()).toEqual({ public_url: 'https://b.example', buzzer_code_A: 'ABCD' });
    repo.remove('public_url');
    expect(repo.get('public_url')).toBeNull();
  });
});
