import { DriveError } from './errors';

export interface DriveLink {
  id: string;
  kind: 'file' | 'folder' | 'unknown';
  resourceKey?: string;
}

/** Links bruges kun som referencer; netværkskald går altid til den faste Drive API-origin. */
export function parseDriveLink(input: string): DriveLink {
  const invalid = () =>
    new DriveError('format', 'Indsæt et gyldigt Google Drive-link til en fil eller mappe.');
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    throw invalid();
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    !['drive.google.com', 'docs.google.com'].includes(url.hostname)
  )
    throw invalid();
  const folder = /^\/(?:drive\/(?:u\/\d+\/)?)?folders\/([\w-]+)(?:\/|$)/.exec(url.pathname);
  const file = /^\/(?:file|document|spreadsheets|presentation)\/d\/([\w-]+)(?:\/|$)/.exec(url.pathname);
  const legacy =
    /^\/(?:open|uc)\/?$/.test(url.pathname) && url.searchParams.getAll('id').length === 1
      ? url.searchParams.get('id')
      : null;
  const id = folder?.[1] ?? file?.[1] ?? legacy;
  if (!id || !/^[\w-]{1,256}$/.test(id)) throw invalid();
  const resourceKey = url.searchParams.get('resourcekey') ?? url.searchParams.get('resourceKey');
  if (resourceKey !== null && !/^[\w-]{1,256}$/.test(resourceKey)) throw invalid();
  return {
    id,
    kind: folder ? 'folder' : file || url.pathname.startsWith('/uc') ? 'file' : 'unknown',
    ...(resourceKey ? { resourceKey } : {}),
  };
}
