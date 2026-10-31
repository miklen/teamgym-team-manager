import {
  mergeWorkspace,
  reconcileInheritance,
  serializeWorkspace,
  validateWorkspace,
  workspacePayload,
} from '@teamgym/domain';
import type { MergeChoices, MergeContext, MergeResult, Workspace } from '@teamgym/domain';
import { sha256 } from './client';
import type { LoadedWorkspace, WorkspaceClient } from './client';
import { DriveError } from './errors';

export type SaveState = 'loading' | 'unchanged' | 'changed' | 'saving' | 'saved' | 'conflict' | 'error';
export interface WorkspaceView {
  migration: LoadedWorkspace | null;
  loaded: LoadedWorkspace | null;
  draft: Workspace | null;
  state: SaveState;
  message: string;
  newer: boolean;
  operationCompleted: boolean;
  review: {
    status: 'loading' | 'ready' | 'stale' | 'error' | 'applying';
    result: MergeResult | null;
    choices: MergeChoices;
    message: string;
  } | null;
}
interface PendingOperation {
  id: string;
  payloadHash: string;
  snapshot: Workspace;
  payload: string;
}

/** Basis, afsendt snapshot og levende kladde har hver sin levetid. Ingen automatisk merge/rebase. */
export class WorkspaceSession {
  private view: WorkspaceView = {
    migration: null,
    loaded: null,
    draft: null,
    state: 'loading',
    message: '',
    newer: false,
    operationCompleted: false,
    review: null,
  };
  private pending: PendingOperation | null = null;
  private inFlight: Promise<void> | null = null;
  private generation = 0;
  private reviewGeneration = 0;
  private confirmedBase: Workspace | null = null;
  private comparison: {
    base: Workspace;
    local: Workspace;
    remote: LoadedWorkspace;
    binding: string;
    context: MergeContext;
  } | null = null;
  private contentGeneration = 0;
  private listeners = new Set<() => void>();
  constructor(
    private readonly client: WorkspaceClient,
    private readonly now = () => new Date().toISOString(),
    private readonly id = () => crypto.randomUUID(),
    private readonly prepareDraft: (workspace: Workspace) => Workspace = validateWorkspace,
    private readonly mergeContext: () => MergeContext = () => ({
      fingerprint: 'domain-default',
      reconcile: (workspace) => {
        reconcileInheritance(workspace, undefined, workspace.updatedAt);
        return validateWorkspace(workspace);
      },
    }),
    private readonly connectionContext: () => string = () => 'session-local',
  ) {}
  snapshot = () => this.view;
  subscribe = (callback: () => void) => {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  };
  private publish(change: Partial<WorkspaceView>) {
    this.view = { ...this.view, ...change };
    for (const listener of this.listeners) listener();
  }
  adopt(loaded: LoadedWorkspace) {
    if (loaded.originalBytes !== undefined) {
      this.releaseReview();
      this.publish({
        migration: structuredClone(loaded),
        review: null,
        state: this.dirty() ? 'changed' : 'unchanged',
      });
      return;
    }
    this.adoptAccepted(loaded);
  }
  private adoptAccepted(loaded: LoadedWorkspace) {
    const draft = this.prepareDraft(structuredClone(loaded.workspace));
    this.generation++;
    this.pending = null;
    this.confirmedBase = null;
    this.releaseReview();
    this.contentGeneration++;
    this.publish({
      migration: null,
      loaded: structuredClone(loaded),
      draft,
      state:
        loaded.originalBytes !== undefined || workspacePayload(draft) !== workspacePayload(loaded.workspace)
          ? 'changed'
          : 'unchanged',
      message: '',
      newer: false,
      operationCompleted: false,
      review: null,
    });
  }
  acceptMigration(discard = false) {
    if (!this.view.migration) return;
    if (this.dirty() && !discard)
      throw new DriveError('cancelled', 'Bekræft kassation af kladden, eller eksportér den først.');
    this.adoptAccepted(this.view.migration);
  }
  cancelMigration() {
    this.publish({
      migration: null,
      state: this.dirty() ? 'changed' : this.view.loaded ? 'unchanged' : 'loading',
    });
  }
  exportOriginal() {
    const bytes = this.view.migration?.originalBytes ?? this.view.loaded?.originalBytes;
    if (bytes === undefined)
      throw new DriveError('format', 'Ingen original i et ældre format er indlæst.');
    return bytes;
  }
  clear() {
    this.generation++;
    this.pending = null;
    this.confirmedBase = null;
    this.releaseReview();
    this.publish({
      loaded: null,
      migration: null,
      draft: null,
      state: 'loading',
      message: '',
      newer: false,
      operationCompleted: false,
      review: null,
    });
  }
  dirty() {
    return (
      !!this.view.draft &&
      !!this.view.loaded &&
      (this.view.loaded.originalBytes !== undefined ||
        workspacePayload(this.view.draft) !== workspacePayload(this.view.loaded.workspace))
    );
  }
  edit(workspace: Workspace) {
    if (!this.view.loaded?.metadata.writable)
      throw new DriveError('permission', 'Arbejdsrummet er åbent med læseadgang.');
    validateWorkspace(workspace);
    if (workspace.workspaceId !== this.view.loaded.workspace.workspaceId)
      throw new DriveError('format', 'Kladden tilhører et andet arbejdsrum.');
    this.contentGeneration++;
    this.publish({
      review: this.view.review
        ? {
            ...this.view.review,
            status: 'stale',
            message: 'Kladden er ændret. Gennemgå den nyeste fil igen.',
          }
        : null,
      draft: structuredClone(workspace),
      state: this.inFlight
        ? 'saving'
        : this.view.state === 'conflict'
          ? 'conflict'
          : this.view.loaded.originalBytes === undefined &&
              workspacePayload(workspace) === workspacePayload(this.view.loaded.workspace)
            ? 'unchanged'
            : 'changed',
    });
  }
  exportDraft() {
    if (!this.view.draft) throw new DriveError('format', 'Intet arbejdsrum er åbent.');
    return serializeWorkspace(this.view.draft);
  }
  async open(fileId: string, discard = false) {
    if (this.inFlight) throw new DriveError('cancelled', 'Vent på gemningen, før du skifter fil.');
    if (this.dirty() && !discard)
      throw new DriveError('cancelled', 'Bekræft kassation af kladden, eller eksportér den først.');
    const generation = ++this.generation;
    this.releaseReview();
    this.publish({ state: 'loading', review: null });
    try {
      const loaded = await this.client.read(fileId);
      if (generation === this.generation) this.adopt(loaded);
    } catch (error) {
      if (generation === this.generation) this.fail(error);
    }
  }
  private fail(error: unknown) {
    this.publish({
      state: error instanceof DriveError && error.code === 'conflict' ? 'conflict' : 'error',
      message: error instanceof Error ? error.message : 'Gemningen kunne ikke bekræftes. Kladden er bevaret.',
      newer: this.view.newer || (error instanceof DriveError && error.code === 'conflict'),
    });
  }
  save(): Promise<void> {
    if (this.view.review) return Promise.resolve();
    if (this.inFlight) return this.inFlight;
    if (!this.view.loaded || !this.view.draft || (!this.dirty() && !this.pending)) return Promise.resolve();
    if (!this.view.loaded.metadata.writable) {
      this.fail(new DriveError('permission', 'Filen er åbnet med læseadgang.'));
      return Promise.resolve();
    }
    if (this.view.newer || this.view.state === 'conflict') {
      this.fail(
        new DriveError(
          'conflict',
          'Der findes en nyere fil. Gennemgå ændringerne, eller eksportér din kladde før genindlæsning.',
        ),
      );
      return Promise.resolve();
    }
    const generation = this.generation;
    const loaded = structuredClone(this.view.loaded);
    const draft = structuredClone(this.view.draft);
    this.publish({ state: 'saving', message: '' });
    const work = async () => {
      // Et uklart tidligere svar afstemmes, før en ny operation overhovedet kan oprettes.
      if (this.pending) {
        const current = await this.client.read(loaded.basis.fileId);
        if (generation !== this.generation) return;
        if (this.recognize(current, this.pending)) return;
        if (current.basis.etag !== loaded.basis.etag || current.basis.version !== loaded.basis.version) {
          this.publish({ newer: true });
          throw new DriveError('conflict', 'En anden session har ændret filen. Kladden er bevaret.');
        }
      }
      const payload = workspacePayload(draft);
      let operation = this.pending;
      if (!operation || operation.payload !== payload) {
        const payloadHash = await sha256(payload);
        const revision = loaded.workspace.revision + 1;
        const savedAt = this.now();
        const id = this.id();
        const snapshot = validateWorkspace({
          ...draft,
          revision,
          updatedAt: savedAt,
          recentOperations: [
            ...loaded.workspace.recentOperations,
            { id, payloadHash, revision, savedAt },
          ].slice(-30),
        });
        operation = { id, payloadHash, snapshot, payload };
      }
      if (generation !== this.generation) return;
      this.pending = operation;
      try {
        await this.client.upload(loaded.basis, operation.snapshot);
      } catch (error) {
        if (error instanceof DriveError && error.code === 'conflict') this.pending = null;
        throw error;
      }
      if (generation !== this.generation) return;
      const current = await this.client.read(loaded.basis.fileId);
      if (generation !== this.generation) return;
      if (!this.recognize(current, operation)) {
        this.publish({ newer: true });
        throw new DriveError(
          'conflict',
          'Uploaden svarede, men den aktuelle fil kan ikke bekræfte operationen. Kladden er bevaret.',
        );
      }
    };
    this.inFlight = work()
      .catch((error: unknown) => {
        if (generation === this.generation) this.fail(error);
      })
      .finally(() => {
        this.inFlight = null;
      });
    return this.inFlight;
  }
  private recognize(current: LoadedWorkspace, operation: PendingOperation) {
    const entry = current.workspace.recentOperations.find(
      (item) => item.id === operation.id && item.payloadHash === operation.payloadHash,
    );
    if (!entry) return false;
    this.pending = null;
    this.confirmedBase = structuredClone(operation.snapshot);
    if (
      current.workspace.revision !== entry.revision ||
      workspacePayload(current.workspace) !== operation.payload
    ) {
      this.publish({
        operationCompleted: true,
        newer: true,
        state: 'conflict',
        message:
          'Din gemning blev gennemført. En anden session har siden gemt en nyere fil. Kladden er bevaret; indlæs den nye fil bevidst.',
      });
      return true;
    }
    const draft = this.view.draft!;
    const changedSince = workspacePayload(draft) !== operation.payload;
    // Kun revisionsfelter fra vores egen bekræftede snapshot overføres til en fortsat kladde.
    const nextDraft = changedSince
      ? {
          ...draft,
          revision: current.workspace.revision,
          recentOperations: current.workspace.recentOperations,
        }
      : structuredClone(current.workspace);
    this.publish({
      loaded: current,
      draft: nextDraft,
      state: changedSince ? 'changed' : 'saved',
      message: changedSince ? 'Den afsendte kladde er gemt. Du har nyere lokale ændringer.' : '',
      operationCompleted: true,
      newer: false,
    });
    return true;
  }
  async checkRemote() {
    if (!this.view.loaded || this.inFlight) return;
    const generation = this.generation;
    try {
      const current = await this.client.read(this.view.loaded.basis.fileId);
      if (generation !== this.generation || this.inFlight) return;
      if (this.pending && this.recognize(current, this.pending)) return;
      if (
        current.basis.etag !== this.view.loaded!.basis.etag ||
        current.basis.version !== this.view.loaded!.basis.version
      )
        this.publish({
          loaded: { ...this.view.loaded!, metadata: current.metadata },
          newer: true,
          state: 'conflict',
          message:
            'Der findes en nyere fil på Drive. Din lokale visning er bevaret. Indlæs den nye fil bevidst.',
          review:
            this.view.review &&
            this.comparison &&
            (JSON.stringify(current.basis) !== JSON.stringify(this.comparison.remote.basis) ||
              !current.metadata.writable ||
              this.binding() !== this.comparison.binding)
              ? {
                  ...this.view.review,
                  status: 'stale',
                  message: 'Filen er ændret. Gennemgå den nyeste fil igen.',
                }
              : this.view.review,
        });
      else if (current.metadata.writable !== this.view.loaded!.metadata.writable)
        this.publish({
          loaded: { ...this.view.loaded!, metadata: current.metadata },
          message: current.metadata.writable
            ? ''
            : 'Skriveadgangen er fjernet. Kladden er bevaret til eksport.',
        });
    } catch (error) {
      if (generation === this.generation) this.fail(error);
    }
  }

  private releaseReview() {
    this.reviewGeneration++;
    this.comparison = null;
  }
  cancelReview() {
    this.releaseReview();
    this.publish({ review: null });
  }
  private binding() {
    return JSON.stringify([
      this.generation,
      this.contentGeneration,
      this.view.loaded?.basis,
      this.view.loaded?.metadata.writable,
      this.view.loaded && workspacePayload(this.view.loaded.workspace),
      this.view.draft && workspacePayload(this.view.draft),
      this.connectionContext(),
      this.mergeContext().fingerprint,
    ]);
  }
  async beginReview() {
    if (this.inFlight || !this.view.loaded || !this.view.draft) return;
    this.releaseReview();
    const request = this.reviewGeneration;
    const generation = this.generation;
    const binding = this.binding();
    const loaded = this.view.loaded;
    this.publish({
      review: {
        status: 'loading',
        result: null,
        choices: {},
        message: 'Henter den nyeste fil til sammenligning…',
      },
    });
    try {
      const current = await this.client.read(loaded.basis.fileId);
      if (request !== this.reviewGeneration || generation !== this.generation) return;
      if (binding !== this.binding())
        throw new DriveError(
          'cancelled',
          'Kladden eller forbindelsen er ændret under hentning. Gennemgå igen.',
        );
      // Format 3 og 4 migreres deterministisk uden nye id'er og kan derfor flettes; format 1 og 2 kan ikke.
      if (current.originalBytes !== undefined && current.sourceSchemaVersion !== 3 && current.sourceSchemaVersion !== 4)
        throw new DriveError('format', 'Den nyeste fil kræver migration og kan ikke flettes.');
      if (this.pending) {
        const operation = this.pending;
        if (!this.recognize(current, operation)) {
          if (current.basis.etag !== loaded.basis.etag || current.basis.version !== loaded.basis.version)
            throw new DriveError(
              'conflict',
              'Den tidligere gemnings udfald kan ikke afklares sikkert. Kladden er bevaret til eksport; ingen ny upload er startet.',
            );
          this.pending = null;
        }
      }
      const base = structuredClone(this.confirmedBase ?? this.view.loaded!.workspace);
      const local = structuredClone(this.view.draft!);
      const context = this.mergeContext();
      const result = mergeWorkspace(base, local, current.workspace, context);
      this.comparison = { base, local, remote: structuredClone(current), binding: this.binding(), context };
      this.publish({ review: { status: 'ready', result, choices: {}, message: '' } });
    } catch (error) {
      if (request !== this.reviewGeneration || generation !== this.generation) return;
      this.comparison = null;
      this.publish({
        review: {
          status: binding !== this.binding() ? 'stale' : 'error',
          result: null,
          choices: {},
          message: error instanceof Error ? error.message : 'Filen kunne ikke hentes. Kladden er bevaret.',
        },
      });
    }
  }
  chooseReview(choices: MergeChoices) {
    const comparison = this.comparison;
    if (!comparison || !this.view.review || this.view.review.status !== 'ready') return;
    if (comparison.binding !== this.binding()) {
      this.publish({
        review: { ...this.view.review, status: 'stale', message: 'Grundlaget er ændret. Gennemgå igen.' },
      });
      return;
    }
    const result = mergeWorkspace(
      comparison.base,
      comparison.local,
      comparison.remote.workspace,
      comparison.context,
      choices,
    );
    this.publish({ review: { status: 'ready', result, choices: { ...choices }, message: '' } });
  }
  async applyReview(): Promise<boolean> {
    const comparison = this.comparison,
      review = this.view.review;
    if (
      !comparison ||
      !review ||
      review.status !== 'ready' ||
      review.result?.status !== 'valid' ||
      this.inFlight
    )
      return false;
    const request = this.reviewGeneration,
      generation = this.generation;
    this.publish({
      review: { ...review, status: 'applying', message: 'Kontrollerer filversion og skriveadgang…' },
    });
    try {
      if (comparison.binding !== this.binding())
        throw new DriveError('cancelled', 'Grundlaget er ændret. Gennemgå igen.');
      const current = await this.client.read(comparison.remote.basis.fileId);
      if (request !== this.reviewGeneration || generation !== this.generation) return false;
      if (comparison.binding !== this.binding())
        throw new DriveError('cancelled', 'Kladden eller forbindelsen er ændret. Gennemgå igen.');
      if (!current.metadata.writable) {
        this.publish({ loaded: { ...this.view.loaded!, metadata: current.metadata } });
        throw new DriveError('permission', 'Skriveadgangen er fjernet. Kladden kan eksporteres.');
      }
      if (JSON.stringify(current.basis) !== JSON.stringify(comparison.remote.basis))
        throw new DriveError('conflict', 'Filen er ændret siden gennemgangen. Gennemgå den nyeste fil igen.');
      const result = mergeWorkspace(
        comparison.base,
        comparison.local,
        comparison.remote.workspace,
        this.mergeContext(),
        review.choices,
      );
      if (result.status !== 'valid') throw new DriveError('format', result.diagnostics.join(' '));
      const draft = validateWorkspace({
        ...result.candidate,
        revision: current.workspace.revision,
        updatedAt: current.workspace.updatedAt,
        recentOperations: current.workspace.recentOperations,
      });
      this.pending = null;
      this.confirmedBase = null;
      this.releaseReview();
      this.contentGeneration++;
      this.publish({
        loaded: current,
        draft,
        review: null,
        newer: false,
        operationCompleted: false,
        state:
          current.originalBytes === undefined && workspacePayload(draft) === workspacePayload(current.workspace)
            ? 'unchanged'
            : 'changed',
        message: 'Dine ændringer er samlet. Vælg Gem på Drive, når du vil gemme dem.',
      });
      return true;
    } catch (error) {
      if (request === this.reviewGeneration && generation === this.generation)
        this.publish({
          review: {
            ...review,
            status: 'stale',
            message: error instanceof Error ? error.message : 'Gennemgå igen. Kladden er bevaret.',
          },
        });
      return false;
    }
  }
}
