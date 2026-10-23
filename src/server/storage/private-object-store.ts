import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

export class StorageConfigurationError extends Error {
  constructor(message = "Private object storage is not configured.") {
    super(message);
    this.name = "StorageConfigurationError";
  }
}

export type StoredObject = {
  key: string;
  sizeBytes: number;
  mimeType: string;
  checksum?: string;
};

export interface PrivateObjectStore {
  readonly provider: string;
  put(input: { key: string; bytes: Uint8Array; mimeType: string }): Promise<StoredObject>;
  get(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
  createDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
}

function safeRelativeKey(key: string) {
  const normalized = path.posix.normalize(key.replaceAll("\\", "/"));
  if (!normalized || normalized === "." || normalized === ".." || normalized.startsWith("../") || path.isAbsolute(normalized)) {
    throw new StorageConfigurationError("Invalid private storage key.");
  }
  return normalized;
}

class LocalPrivateObjectStore implements PrivateObjectStore {
  readonly provider = "LOCAL";

  constructor(private readonly root: string) {}

  private resolve(key: string) {
    const relative = safeRelativeKey(key);
    const root = path.resolve(this.root);
    const absolute = path.resolve(root, relative);
    if (!absolute.startsWith(`${root}${path.sep}`)) throw new StorageConfigurationError("Storage key escapes configured root.");
    return absolute;
  }

  async put(input: { key: string; bytes: Uint8Array; mimeType: string }): Promise<StoredObject> {
    const absolute = this.resolve(input.key);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, input.bytes);
    return { key: input.key, sizeBytes: input.bytes.byteLength, mimeType: input.mimeType };
  }

  async get(key: string): Promise<Uint8Array> {
    return readFile(this.resolve(key));
  }

  async delete(key: string): Promise<void> {
    await rm(this.resolve(key), { force: true });
  }

  async createDownloadUrl(): Promise<string> {
    throw new StorageConfigurationError("Local private storage must be streamed by RentFlow's authorized route.");
  }
}

class UnconfiguredPrivateObjectStore implements PrivateObjectStore {
  readonly provider = "UNCONFIGURED";

  private unavailable(): never {
    throw new StorageConfigurationError();
  }

  async put(): Promise<StoredObject> {
    return this.unavailable();
  }

  async get(): Promise<Uint8Array> {
    return this.unavailable();
  }

  async delete(): Promise<void> {
    return this.unavailable();
  }

  async createDownloadUrl(): Promise<string> {
    return this.unavailable();
  }
}

export function getPrivateObjectStore(): PrivateObjectStore {
  const driver = process.env.PRIVATE_STORAGE_DRIVER?.trim().toLowerCase();
  if (driver === "local") {
    if (process.env.NODE_ENV === "production") {
      throw new StorageConfigurationError("Local private storage is disabled in production.");
    }
    const root = process.env.PRIVATE_STORAGE_LOCAL_ROOT?.trim();
    if (!root) throw new StorageConfigurationError("PRIVATE_STORAGE_LOCAL_ROOT is required for local private storage.");
    return new LocalPrivateObjectStore(root);
  }

  // Intentionally fail closed until a production private provider is connected.
  // Do not derive public URLs from storage keys.
  return new UnconfiguredPrivateObjectStore();
}

export function hasPrivateObjectStorage() {
  const driver = process.env.PRIVATE_STORAGE_DRIVER?.trim().toLowerCase();
  return driver === "local" && process.env.NODE_ENV !== "production" && Boolean(process.env.PRIVATE_STORAGE_LOCAL_ROOT?.trim());
}
