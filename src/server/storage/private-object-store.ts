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
  delete(key: string): Promise<void>;
  createDownloadUrl(key: string, expiresInSeconds: number): Promise<string>;
}

class UnconfiguredPrivateObjectStore implements PrivateObjectStore {
  readonly provider = "UNCONFIGURED";

  private unavailable(): never {
    throw new StorageConfigurationError();
  }

  async put(): Promise<StoredObject> {
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
  // Intentionally fail closed until a concrete private provider is connected.
  // Do not derive public URLs from storage keys.
  return new UnconfiguredPrivateObjectStore();
}

export function hasPrivateObjectStorage() {
  return false;
}
