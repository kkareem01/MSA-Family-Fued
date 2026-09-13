import { HOST_PIN_HEADER } from '@feud/shared';
import { ApiError } from './client';

const BACKUP_URL = '/api/backup';
const FALLBACK_NAME = 'msa-feud-backup.json';

function filenameFrom(disposition: string | null): string {
  const match = disposition?.match(/filename="([^"]+)"/u);
  return match?.[1] ?? FALLBACK_NAME;
}

/** Saves the whole database as a JSON file on this device. Throws ApiError when the server refuses. */
export async function downloadBackup(pin: string): Promise<string> {
  const response = await fetch(BACKUP_URL, { headers: { [HOST_PIN_HEADER]: pin } }).catch(() => {
    throw new ApiError(0, 'network', 'Could not reach the server');
  });
  if (!response.ok) throw new ApiError(response.status, 'http_error', `Backup failed (${response.status})`);
  const name = filenameFrom(response.headers.get('content-disposition'));
  const url = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
  return name;
}
