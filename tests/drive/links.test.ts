import { describe, expect, it } from 'vitest';
import { createWorkspace, serializeWorkspace } from '@teamgym/domain';
import {
  DRIVE_SCOPE,
  DriveClient,
  GoogleConnection,
  MemoryConnectionStore,
  parseDriveLink,
} from '@teamgym/drive';
import type { BrowserFetch, OAuthBridge } from '@teamgym/drive';

describe('Google Drive-links', () => {
  it.each([
    ['https://drive.google.com/file/d/synthetic-file/view?usp=sharing', 'file'],
    ['https://drive.google.com/drive/folders/synthetic-file', 'folder'],
    ['https://drive.google.com/drive/u/0/folders/synthetic-file?usp=sharing', 'folder'],
    ['https://drive.google.com/folders/synthetic-file', 'folder'],
    ['https://drive.google.com/open?id=synthetic-file', 'unknown'],
    ['https://drive.google.com/uc?id=synthetic-file&export=download', 'file'],
    ['https://docs.google.com/document/d/synthetic-file/edit', 'file'],
  ])('udleder id og type fra %s', (url, kind) => {
    expect(parseDriveLink(` ${url} `)).toEqual({ id: 'synthetic-file', kind });
  });
  it('bevarer kun den validerede resource key sammen med filreferencen', () => {
    expect(
      parseDriveLink(
        'https://drive.google.com/file/d/synthetic-file/view?resourcekey=0-synthetic&usp=sharing',
      ),
    ).toEqual({ id: 'synthetic-file', kind: 'file', resourceKey: '0-synthetic' });
  });
  it.each([
    '',
    'synthetic-file',
    'javascript:alert(1)',
    'http://drive.google.com/file/d/synthetic-file/view',
    'https://drive.google.com.evil.invalid/file/d/synthetic-file/view',
    'https://drive.google.com@evil.invalid/file/d/synthetic-file/view',
    'https://user@drive.google.com/file/d/synthetic-file/view',
    'https://drive.google.com:444/file/d/synthetic-file/view',
    'https://drive.google.com/drive/my-drive',
    'https://drive.google.com/open?id=one&id=two',
    'https://drive.google.com/file/d/synthetic-file/view?resourcekey=bad%0Aheader',
  ])('afviser ugyldigt eller fremmed link før netværk: %s', (url) => {
    expect(() => parseDriveLink(url)).toThrow('gyldigt Google Drive-link');
  });
});

function metadata(id = 'synthetic-file') {
  return {
    id,
    title: 'Syntetisk arbejdsrum.json',
    mimeType: 'application/json',
    etag: '"1"',
    version: '1',
    editable: true,
    labels: { trashed: false },
    parents: [{ id: 'synthetic-folder' }],
  };
}

it('sender resource key ved læsning og betinget gemning, uden nøgle i arbejdsrummets JSON', async () => {
  const workspace = createWorkspace();
  const requests: { url: string; headers: Headers; body: unknown }[] = [];
  const fetcher: BrowserFetch = async (input, init) => {
    const url = String(input);
    requests.push({ url, headers: new Headers(init?.headers), body: init?.body });
    return new URL(url).searchParams.get('alt') === 'media'
      ? new Response(serializeWorkspace(workspace))
      : Response.json(metadata());
  };
  const client = new DriveClient(() => 'synthetic-token', fetcher);
  client.rememberResourceKey('synthetic-file', '0-synthetic');
  const loaded = await client.read('synthetic-file');
  expect(loaded.metadata.resourceKey).toBe('0-synthetic');
  await client.upload(loaded.basis, { ...workspace, revision: workspace.revision + 1 });
  expect(
    requests.every(
      (request) => request.headers.get('X-Goog-Drive-Resource-Keys') === 'synthetic-file/0-synthetic',
    ),
  ).toBe(true);
  expect(requests.at(-1)?.headers.get('If-Match')).toBe('"1"');
  expect(String(requests.at(-1)?.body)).not.toContain('0-synthetic');
  expect(() => client.rememberResourceKey('synthetic-file', 'bad\r\nheader')).toThrow();
});

it('sender mappens resource key ved oprettelse, men ikke til den nye fils kald', async () => {
  const seen: { url: string; key: string | null }[] = [];
  const workspace = createWorkspace();
  const fetcher: BrowserFetch = async (input, init) => {
    const url = String(input);
    seen.push({ url, key: new Headers(init?.headers).get('X-Goog-Drive-Resource-Keys') });
    if (init?.method === 'POST') return Response.json({ id: 'synthetic-new' });
    if (url.includes('/synthetic-folder?'))
      return Response.json({
        ...metadata('synthetic-folder'),
        mimeType: 'application/vnd.google-apps.folder',
        capabilities: { canAddChildren: true },
      });
    if (new URL(url).searchParams.get('alt') === 'media') return new Response(serializeWorkspace(workspace));
    return Response.json(metadata('synthetic-new'));
  };
  const client = new DriveClient(() => 'synthetic-token', fetcher);
  client.rememberResourceKey('synthetic-folder', '0-folder');
  await client.create('synthetic-folder', 'Test', workspace);
  expect(seen[0]?.key).toBe('synthetic-folder/0-folder');
  expect(seen[1]?.key).toBe('synthetic-folder/0-folder');
  expect(seen.slice(2).every((request) => request.key === null)).toBe(true);
});

it('genbruger husket filnøgle efter genåbning og rydder den ved kontoskift', async () => {
  const store = new MemoryConnectionStore();
  let account = 'A';
  const keys: (string | null)[] = [];
  const fetcher: BrowserFetch = async (input, init) => {
    if (String(input).includes('/about?'))
      return Response.json({
        user: {
          permissionId: account,
          emailAddress: `${account}@example.invalid`,
          displayName: `Syntetisk ${account}`,
        },
      });
    keys.push(new Headers(init?.headers).get('X-Goog-Drive-Resource-Keys'));
    return Response.json(metadata());
  };
  const oauth: OAuthBridge = {
    request(_hint, success) {
      success({ token: 'synthetic-token', expiresIn: 3600, scopes: [DRIVE_SCOPE] });
    },
    async revoke() {},
  };
  const first = new GoogleConnection(store, oauth, fetcher);
  await first.connect(true);
  first.client().rememberResourceKey('synthetic-file', '0-synthetic');
  await first.rememberFile(await first.client().metadata('synthetic-file'));
  const next = new GoogleConnection(store, oauth, fetcher);
  await next.restore();
  await next.client().metadata('synthetic-file');
  expect(keys.at(-1)).toBe('synthetic-file/0-synthetic');
  account = 'B';
  await next.connect(true);
  await next.client().metadata('synthetic-file');
  expect(keys.at(-1)).toBeNull();
  expect(next.snapshot().file).toBeNull();
});
