import { createBrowserConnection, WorkspaceSession } from '@teamgym/drive';
import type { GoogleConfiguration } from '@teamgym/drive';
import { reconcileWorkspace } from './inheritance-context';
import { registry } from './rules';
export const googleConfig: GoogleConfiguration = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
  projectNumber: import.meta.env.VITE_GOOGLE_PROJECT_NUMBER ?? '',
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY ?? '',
};
export const configured = Object.values(googleConfig).every(Boolean);
export const connection = createBrowserConnection(googleConfig);
export const workspaceSession = new WorkspaceSession(
  connection.client(),
  undefined,
  undefined,
  reconcileWorkspace,
  () => ({
    fingerprint: JSON.stringify(registry.list(false).map((pkg) => pkg.manifest)),
    reconcile: (workspace) => reconcileWorkspace(workspace, workspace.updatedAt),
  }),
  () =>
    JSON.stringify([
      connection.snapshot().generation,
      connection.snapshot().status,
      connection.snapshot().account?.permissionId,
    ]),
);
let restoration: Promise<void> | undefined;
export function restoreConnection() {
  return (restoration ??= connection.restore());
}
export function downloadDraft() {
  downloadCopy(workspaceSession.exportDraft());
}
export function downloadCopy(bytes: string) {
  const blob = new Blob([bytes], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'teamgym-kladde.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
