export class DriveError extends Error {
  constructor(
    public readonly code:
      | 'auth'
      | 'permission'
      | 'missing'
      | 'conflict'
      | 'network'
      | 'unstable'
      | 'format'
      | 'cancelled'
      | 'storage'
      | 'popup',
    message: string,
    public readonly status?: number,
  ) {
    super(message);
  }
}

export function responseError(status: number): DriveError {
  if (status === 401)
    return new DriveError(
      'auth',
      'Google-adgangen er udløbet. Fortsæt med Google; kladden er bevaret.',
      status,
    );
  if (status === 403)
    return new DriveError(
      'permission',
      'Google afviser adgangen. Kontrollér konto, filadgang og skriverettighed. Kladden er bevaret.',
      status,
    );
  if (status === 404 || status === 410)
    return new DriveError(
      'missing',
      'Filen findes ikke, eller denne konto har ikke adgang. Vælg filen gennem Google.',
      status,
    );
  if (status === 412)
    return new DriveError('conflict', 'En nyere fil findes på Drive. Din kladde er bevaret.', status);
  return new DriveError('network', `Google-kaldet mislykkedes (HTTP ${status}). Kladden er bevaret.`, status);
}
