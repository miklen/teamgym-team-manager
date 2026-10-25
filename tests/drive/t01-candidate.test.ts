import { describe, expect, it, vi } from 'vitest';
import { createProbeClient, probeDocument } from '../../tools/t01/candidate';
import type { BrowserFetch } from '@teamgym/drive';

const fileId = 'synthetic-test-file';
const oldEtag = '"opaque-old-etag"';
const oldVersion = '90071992547409939';
const document = {
  kind: 'teamgym-t01',
  schemaVersion: 1,
  operationId: 'synthetic-operation',
  label: 'initial',
};
const bytes = JSON.stringify(document);

function metadata(overrides = {}) {
  return {
    id: fileId,
    title: 'teamgym-t01-synthetic.json',
    mimeType: 'application/json',
    etag: oldEtag,
    version: oldVersion,
    editable: true,
    labels: { trashed: false },
    ...overrides,
  };
}

function network(
  options: { status?: number; metadata?: ReturnType<typeof metadata>[]; failUpload?: boolean } = {},
) {
  let readIndex = 0;
  return vi.fn<BrowserFetch>(async (input, init) => {
    if (init?.method === 'PUT') {
      if (options.failUpload) throw new TypeError('DO_NOT_LOG_credentials_or_server_body');
      return new Response(null, { status: options.status ?? 200 });
    }
    if (String(input).includes('alt=media')) return new Response(bytes);
    const value = options.metadata?.[readIndex++] ?? metadata();
    return new Response(JSON.stringify(value));
  });
}

describe('T01-kandidat med injiceret netværk — ikke faktisk Google-bevis', () => {
  it('bevarer opaque etag og store versionsstrenge i den konsistente basis', async () => {
    const fetcher = network();
    const basis = await createProbeClient('synthetic-token', fetcher).read(fileId);
    expect(basis.etag).toBe(oldEtag);
    expect(basis.version).toBe(oldVersion);
    expect(basis.bytes).toBe(bytes);
    expect(basis.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it('gentager læsningen ved filændring mellem metadata og indhold', async () => {
    const changed = metadata({ etag: '"new"', version: '90071992547409940' });
    const fetcher = network({ metadata: [metadata(), changed, changed, changed] });
    const basis = await createProbeClient('synthetic-token', fetcher).read(fileId);
    expect(basis.etag).toBe('"new"');
    expect(fetcher).toHaveBeenCalledTimes(6);
  });

  it('afgrænser gentagne læsekapløb og uploader aldrig under indlæsning', async () => {
    const fetcher = network({
      metadata: Array.from({ length: 6 }, (_, i) => metadata({ version: String(i) })),
    });
    await expect(createProbeClient('synthetic-token', fetcher).read(fileId)).rejects.toThrow(
      'alle tre læseforsøg',
    );
    expect(fetcher).toHaveBeenCalledTimes(9);
  });

  it('sender den gamle If-Match-basis trods ny forkontrol og bevarer 412 som råt udfald', async () => {
    const fetcher = network();
    const client = createProbeClient('synthetic-token', fetcher);
    const basis = await client.read(fileId);
    fetcher.mockImplementation(
      network({ status: 412, metadata: [metadata({ etag: '"new"' }), metadata({ etag: '"new"' })] }),
    );
    const result = await client.upload(basis, probeDocument('B'));
    expect(result).toEqual({ status: 412, accepted: false });
    const uploads = fetcher.mock.calls.filter(([, init]) => init?.method === 'PUT');
    expect(uploads).toHaveLength(1);
    expect(uploads[0]?.[0]).toBe(
      `https://www.googleapis.com/upload/drive/v2/files/${fileId}?uploadType=media`,
    );
    expect(uploads[0]?.[1]?.headers).toMatchObject({
      'If-Match': oldEtag,
      'Content-Type': 'application/json',
    });
    expect(basis.etag).toBe(oldEtag);
  });

  it('sender bevidst forkert etag og foretager aldrig ubetinget fallback', async () => {
    const fetcher = network({ status: 412 });
    const client = createProbeClient('synthetic-token', fetcher);
    const basis = await client.read(fileId);
    await client.upload(basis, probeDocument('A'), '"wrong"');
    const uploads = fetcher.mock.calls.filter(([, init]) => init?.method === 'PUT');
    expect(uploads).toHaveLength(1);
    expect(uploads[0]?.[1]?.headers).toMatchObject({ 'If-Match': '"wrong"' });
  });

  it.each([401, 403, 500])('viser HTTP %s uden gen-upload eller ny basis', async (status) => {
    const fetcher = network({ status });
    const client = createProbeClient('synthetic-token', fetcher);
    const basis = await client.read(fileId);
    expect(await client.upload(basis, probeDocument('A'))).toEqual({ status, accepted: false });
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(1);
  });

  it('gentager ikke en upload efter mistet svar og eksponerer ikke fejlens rå tekst', async () => {
    const fetcher = network({ failUpload: true });
    const client = createProbeClient('synthetic-token', fetcher);
    const basis = await client.read(fileId);
    await expect(client.upload(basis, probeDocument('A'))).rejects.toThrow('ukendt uploadudfald');
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(1);
  });

  it('afviser almindelige arbejdsfiler før nogen upload', async () => {
    const fetcher = network({ metadata: [metadata({ title: 'teamets-rigtige-data.json' })] });
    await expect(createProbeClient('synthetic-token', fetcher).read(fileId)).rejects.toThrow(
      'ikke en skrivbar T01',
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('afviser et tomt token og tom betingelse', async () => {
    expect(() => createProbeClient('')).toThrow('Google-adgang mangler');
    const fetcher = network();
    const client = createProbeClient('synthetic-token', fetcher);
    const basis = await client.read(fileId);
    await expect(client.upload(basis, probeDocument('A'), '')).rejects.toThrow('Betingelsen mangler');
    expect(fetcher.mock.calls.filter(([, init]) => init?.method === 'PUT')).toHaveLength(0);
  });

  it('starter ikke nye kald efter lokal afbrydelse', async () => {
    const fetcher = network();
    const controller = new AbortController();
    const client = createProbeClient('synthetic-token', fetcher, controller.signal);
    const basis = await client.read(fileId);
    controller.abort();
    await expect(client.upload(basis, probeDocument('A'))).rejects.toThrow('afbrudt');
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
