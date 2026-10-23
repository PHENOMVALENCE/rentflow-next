import { describe, expect, it } from "vitest";
import { getPrivateObjectStore, hasPrivateObjectStorage, StorageConfigurationError } from "./private-object-store";

describe("private object storage", () => {
  it("reports storage as unavailable until a provider is configured", () => {
    expect(hasPrivateObjectStorage()).toBe(false);
    expect(getPrivateObjectStore().provider).toBe("UNCONFIGURED");
  });

  it("never fabricates download URLs", async () => {
    await expect(getPrivateObjectStore().createDownloadUrl("leases/test.pdf", 60)).rejects.toBeInstanceOf(StorageConfigurationError);
  });

  it("rejects writes while unconfigured", async () => {
    await expect(getPrivateObjectStore().put({ key: "leases/test.pdf", bytes: new Uint8Array([1, 2, 3]), mimeType: "application/pdf" })).rejects.toBeInstanceOf(StorageConfigurationError);
  });
});
