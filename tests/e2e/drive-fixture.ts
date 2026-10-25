import type { Page } from '@playwright/test';
import {
  createAthlete,
  createWorkspace,
  registerAthleteSkill,
  serializeWorkspace,
  updateAssessment,
} from '@teamgym/domain';
import type { Workspace } from '@teamgym/domain';
import { rhythmSkill, syntheticWorkspace, tumblingSkill } from '../fixtures/synthetic-workspace';

export function fourOfSix() {
  const fixture = syntheticWorkspace();
  let workspace = fixture.workspace;
  if (tumblingSkill.discipline !== 'tumbling') throw Error('fixture');
  const definition = {
    ...tumblingSkill,
    id: 'synthetic-no-twist',
    name: 'Syntetisk uden skrue',
    elements: tumblingSkill.elements.map((element) => ({
      ...element,
      twistsHalfTurns: 0,
      twistDistribution: [],
    })),
  };
  for (const athlete of workspace.athletes.slice(4, 6)) {
    const added = registerAthleteSkill(workspace, athlete.id, definition);
    workspace = updateAssessment(added.workspace, added.athleteSkillId, {
      stability: 1,
      assessedAt: '2026-10-25',
      note: 'Syntetisk',
    });
    for (const round of workspace.plans[0]!.tumbling)
      round.entries.find((entry) => entry.athleteId === athlete.id)!.athleteSkillId = added.athleteSkillId;
  }
  return workspace;
}

export function twentyAthletes() {
  const fixture = syntheticWorkspace();
  let workspace = fixture.workspace;
  for (let index = 9; index <= 20; index++) {
    workspace = createAthlete(workspace, {
      name: `Syntetisk Alexandra-Christine Langt-Testnavn ${index}`,
      teamId: fixture.teamA.id,
    });
    if (index <= 18) {
      const registered = registerAthleteSkill(workspace, workspace.athletes.at(-1)!.id, rhythmSkill);
      workspace = updateAssessment(registered.workspace, registered.athleteSkillId, {
        stability: 5,
        assessedAt: '2026-10-25',
        note: '',
      });
    }
  }
  return workspace;
}
export async function openWorkspace(
  page: Page,
  input: Workspace = syntheticWorkspace().workspace,
  writable = true,
) {
  let bytes = serializeWorkspace(input);
  let version = 1;
  let puts = 0;
  let denied = 0;
  let drop = false;
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await page.route('https://www.googleapis.com/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (denied) {
      await route.fulfill({ status: denied, body: '' });
      return;
    }
    if (url.pathname.endsWith('/about')) {
      await route.fulfill({
        json: {
          user: {
            permissionId: 'synthetic-coach',
            displayName: 'Syntetisk træner',
            emailAddress: 'coach@example.invalid',
          },
        },
      });
      return;
    }
    if (request.method() === 'PUT') {
      puts++;
      if (request.headers()['if-match'] !== `"${version}"`) {
        await route.fulfill({ status: 412 });
        return;
      }
      bytes = request.postData()!;
      version++;
      if (drop) {
        drop = false;
        await route.abort('failed');
        return;
      }
      await route.fulfill({ json: { id: 'synthetic-file' } });
      return;
    }
    if (url.searchParams.get('alt') === 'media') {
      await route.fulfill({ body: bytes, contentType: 'application/json' });
      return;
    }
    await route.fulfill({
      json: {
        id: 'synthetic-file',
        title: 'Syntetisk arbejdsrum.json',
        mimeType: 'application/json',
        etag: `"${version}"`,
        version: String(version),
        editable: writable,
        labels: { trashed: false },
        parents: [{ id: 'synthetic-folder' }],
      },
    });
  });
  await page.goto('./');
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('teamgym-team-manager.connection.v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('connection');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(Error('test setup'));
    });
    await new Promise<void>((resolve) => {
      const transaction = db.transaction('connection', 'readwrite');
      transaction.objectStore('connection').put(
        {
          epoch: 'synthetic-epoch',
          connection: {
            schemaVersion: 1,
            token: 'synthetic-browser-access',
            receivedAt: Date.now(),
            expiresAt: Date.now() + 3600_000,
            scopes: ['https://www.googleapis.com/auth/drive.file'],
            account: {
              permissionId: 'synthetic-coach',
              email: 'coach@example.invalid',
              name: 'Syntetisk træner',
            },
            file: {
              id: 'synthetic-file',
              name: 'Syntetisk arbejdsrum.json',
              folderIds: ['synthetic-folder'],
            },
          },
        },
        'active',
      );
      transaction.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.goto('./#/arbejdsrum/synthetic-file');
  await page.reload();
  return {
    failures,
    get puts() {
      return puts;
    },
    get workspace() {
      return JSON.parse(bytes) as Workspace;
    },
    external(workspace: Workspace) {
      bytes = serializeWorkspace(workspace);
      version++;
    },
    deny(status: number) {
      denied = status;
    },
    dropResponse() {
      drop = true;
    },
    empty: createWorkspace,
  };
}
