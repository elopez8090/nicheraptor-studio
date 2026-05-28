/**
 * Future-ready sync layer stub.
 * Wire offline queue + multi-device sync here without changing UI call sites.
 */

export type SyncQueueItem = {
  id: string;
  table: string;
  operation: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  createdAt: number;
  retries: number;
};

export type SyncEngineStatus = "idle" | "syncing" | "offline" | "error";

export interface WorkspaceSyncEngine {
  status: SyncEngineStatus;
  enqueue(item: Omit<SyncQueueItem, "id" | "createdAt" | "retries">): void;
  flush(): Promise<void>;
  getPendingCount(): number;
}

/** No-op implementation until offline/desktop sync ships. */
export const workspaceSyncEngineStub: WorkspaceSyncEngine = {
  status: "idle",
  enqueue() {
    // local cache + sync engine will persist here
  },
  async flush() {},
  getPendingCount() {
    return 0;
  },
};
