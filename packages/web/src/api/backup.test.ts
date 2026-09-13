import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBackup } from './backup';

describe('downloadBackup', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('fetches with the PIN and hands the browser a named file', async () => {
    const fetchFn = vi.fn(() =>
      Promise.resolve({ ok: true, status: 200, headers: new Headers({ 'content-disposition': 'attachment; filename="msa-feud-backup-1.json"' }), blob: () => Promise.resolve(new Blob(['{}'])) } as unknown as Response),
    );
    vi.stubGlobal('fetch', fetchFn);
    const createObjectURL = vi.fn(() => 'blob:x');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    await expect(downloadBackup('pin')).resolves.toBe('msa-feud-backup-1.json');
    expect(fetchFn).toHaveBeenCalledWith('/api/backup', { headers: { 'x-host-pin': 'pin' } });
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });

  it('reports a refused download', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 401, headers: new Headers() } as unknown as Response)));
    await expect(downloadBackup('bad')).rejects.toThrow(/401/u);
  });
});
