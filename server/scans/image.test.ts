import QRCode from "qrcode";
import { describe, expect, it } from "vitest";
import { decodeQRCodeImage } from "@/server/scans/image";
import { ScanImageValidationError } from "@/server/scans/errors";

describe("decodeQRCodeImage", () => {
  it("decodes uploaded QR images and includes link verification for URLs", async () => {
    const file = await getQRCodeFile("https://example.com/path");
    const result = await decodeQRCodeImage({ file });

    expect(result.text).toBe("https://example.com/path");
    expect(result.contentType).toBe("url");
    expect(result.normalizedUrl).toBe("https://example.com/path");
    expect(result.linkVerification?.verdict).toBe("safe");
    expect(result.image.width).toBeGreaterThan(0);
  });

  it("decodes uploaded QR images with plain text", async () => {
    const file = await getQRCodeFile("Decode Platform");
    const result = await decodeQRCodeImage({ file });

    expect(result.text).toBe("Decode Platform");
    expect(result.contentType).toBe("text");
    expect(result.normalizedUrl).toBeNull();
    expect(result.linkVerification).toBeNull();
  });

  it("rejects unsupported file types before decoding", async () => {
    const file = new File(["not an image"], "note.txt", { type: "text/plain" });

    await expect(decodeQRCodeImage({ file })).rejects.toBeInstanceOf(
      ScanImageValidationError
    );
  });
});

async function getQRCodeFile(value: string): Promise<File> {
  const buffer = await QRCode.toBuffer(value, { type: "png", width: 320 });
  const body = new Uint8Array(buffer);

  return new File([body], "qr.png", { type: "image/png" });
}
