import { readFile } from "node:fs/promises";
import path from "node:path";

export type StoredObject = {
  body: Uint8Array;
  contentType?: string;
};

export interface PrivateObjectStorage {
  getObject(key: string): Promise<StoredObject>;
}

class DisabledPrivateStorage implements PrivateObjectStorage {
  async getObject(): Promise<StoredObject> {
    throw new Error("Private object storage is not configured.");
  }
}

class LocalPrivateStorage implements PrivateObjectStorage {
  constructor(private readonly root: string) {}

  async getObject(key: string): Promise<StoredObject> {
    const normalized = path.posix.normalize(key.replaceAll("\\", "/"));
    if (normalized.startsWith("../") || normalized === ".." || path.isAbsolute(normalized)) {
      throw new Error("Invalid storage key.");
    }

    const absoluteRoot = path.resolve(this.root);
    const absolutePath = path.resolve(absoluteRoot, normalized);
    if (absolutePath !== absoluteRoot && !absolutePath.startsWith(`${absoluteRoot}${path.sep}`)) {
      throw new Error("Storage key escapes configured root.");
    }

    const body = await readFile(absolutePath);
    return { body };
  }
}

export function privateStorage(): PrivateObjectStorage {
  const driver = process.env.PRIVATE_STORAGE_DRIVER?.trim().toLowerCase();

  if (driver === "local") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Local private storage is disabled in production.");
    }
    const root = process.env.PRIVATE_STORAGE_LOCAL_ROOT?.trim();
    if (!root) throw new Error("PRIVATE_STORAGE_LOCAL_ROOT is required for the local storage driver.");
    return new LocalPrivateStorage(root);
  }

  return new DisabledPrivateStorage();
}

export function isPrivateStorageConfigured() {
  const driver = process.env.PRIVATE_STORAGE_DRIVER?.trim().toLowerCase();
  if (driver === "local") return process.env.NODE_ENV !== "production" && Boolean(process.env.PRIVATE_STORAGE_LOCAL_ROOT?.trim());
  return false;
}
