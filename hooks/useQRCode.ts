"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface QROptions {
  data: string;
  width?: number;
  height?: number;
  margin?: number;
  dotsColor?: string;
  backgroundColor?: string;
  dotsType?:
    | "rounded"
    | "dots"
    | "classy"
    | "classy-rounded"
    | "square"
    | "extra-rounded";
  cornersSquareType?: "dot" | "square" | "extra-rounded";
  cornersDotType?: "dot" | "square";
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  logoUrl?: string;
  logoSize?: number;
  containerKey?: string;
}

export function useQRCode(options: QROptions) {
  const ref = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<InstanceType<
    typeof import("qr-code-styling").default
  > | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isActive = true;

    const initQR = async () => {
      if (typeof window === "undefined") return;

      setIsReady(false);

      const [{ default: QRCodeStyling }] = await Promise.all([
        import("qr-code-styling"),
        options.logoUrl ? preloadLogoImage(options.logoUrl) : Promise.resolve(),
      ]);

      if (!isActive) return;

      const qrCode = new QRCodeStyling({
        width: options.width || 280,
        height: options.height || 280,
        type: "canvas",
        data: options.data || "https://github.com",
        margin: options.margin ?? 4,
        qrOptions: {
          errorCorrectionLevel: options.errorCorrectionLevel || "Q",
        },
        dotsOptions: {
          color: options.dotsColor || "#ffffff",
          type: options.dotsType || "rounded",
        },
        cornersSquareOptions: {
          type: options.cornersSquareType || "extra-rounded",
          color: options.dotsColor || "#ffffff",
        },
        cornersDotOptions: {
          type: options.cornersDotType || "dot",
          color: options.dotsColor || "#ffffff",
        },
        backgroundOptions: {
          color: options.backgroundColor || "#0a0a0a",
        },
        imageOptions: {
          crossOrigin: "anonymous",
          margin: 10,
          imageSize: options.logoSize || 0.4,
        },
        image: options.logoUrl || undefined,
      });

      qrCodeRef.current = qrCode;

      if (ref.current) {
        ref.current.innerHTML = "";
        qrCode.append(ref.current);
      }

      if (isActive) {
        setIsReady(true);
      }
    };

    initQR().catch(() => {
      if (isActive) {
        setIsReady(false);
      }
    });

    return () => {
      isActive = false;
    };
  }, [
    options.data,
    options.dotsColor,
    options.backgroundColor,
    options.dotsType,
    options.cornersSquareType,
    options.cornersDotType,
    options.errorCorrectionLevel,
    options.margin,
    options.logoUrl,
    options.width,
    options.height,
    options.logoSize,
    options.containerKey,
  ]);

  const download = useCallback(
    async (extension: "png" | "jpeg" | "webp" | "svg" = "png") => {
      if (qrCodeRef.current) {
        await qrCodeRef.current.download({
          name: `decode-qr-${Date.now()}`,
          extension,
        });
      }
    },
    []
  );

  const downloadPdf = useCallback(async (title = "Decode QR Code") => {
    if (!qrCodeRef.current) return;

    const rawData = await qrCodeRef.current.getRawData("jpeg");
    if (!rawData) return;

    const bytes =
      rawData instanceof Blob
        ? new Uint8Array(await rawData.arrayBuffer())
        : new Uint8Array(rawData);
    const pdfBlob = createSingleImagePdf({
      imageBytes: bytes,
      imageSize: options.width || 1024,
      title,
    });
    triggerDownload({
      blob: pdfBlob,
      fileName: `decode-qr-${Date.now()}.pdf`,
    });
  }, [options.width]);

  return { ref, download, downloadPdf, isReady };
}

function preloadLogoImage(source: string): Promise<void> {
  return new Promise((resolve) => {
    const image = new Image();

    image.decoding = "async";
    if (!source.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = source;

    if (image.complete) {
      resolve();
    }
  });
}

function createSingleImagePdf({
  imageBytes,
  imageSize,
  title,
}: {
  readonly imageBytes: Uint8Array;
  readonly imageSize: number;
  readonly title: string;
}): Blob {
  const pageWidth = 612;
  const pageHeight = 792;
  const displaySize = 300;
  const imageX = (pageWidth - displaySize) / 2;
  const imageY = 250;
  const safeTitle = escapePdfText(title.slice(0, 80));
  const content = [
    "BT",
    "/F1 18 Tf",
    `72 720 Td (${safeTitle}) Tj`,
    "ET",
    "q",
    `${displaySize} 0 0 ${displaySize} ${imageX} ${imageY} cm`,
    "/Im0 Do",
    "Q",
  ].join("\n");
  const objects: (string | Uint8Array)[][] = [
    ["<< /Type /Catalog /Pages 2 0 R >>"],
    ["<< /Type /Pages /Kids [3 0 R] /Count 1 >>"],
    [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 4 0 R >> /Font << /F1 5 0 R >> >> /Contents 6 0 R >>`,
    ],
    [
      `<< /Type /XObject /Subtype /Image /Width ${imageSize} /Height ${imageSize} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.byteLength} >>\nstream\n`,
      imageBytes,
      "\nendstream",
    ],
    ["<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"],
    [`<< /Length ${content.length} >>\nstream\n${content}\nendstream`],
  ];
  const chunks: (string | Uint8Array)[] = ["%PDF-1.4\n"];
  const offsets = [0];
  let offset = byteLength(chunks[0]);

  objects.forEach((objectParts, index) => {
    offsets.push(offset);
    const prefix = `${index + 1} 0 obj\n`;
    chunks.push(prefix, ...objectParts, "\nendobj\n");
    offset += byteLength(prefix);
    objectParts.forEach((part) => {
      offset += byteLength(part);
    });
    offset += byteLength("\nendobj\n");
  });

  const xrefOffset = offset;
  const xrefRows = offsets
    .map((itemOffset, index) =>
      index === 0
        ? "0000000000 65535 f "
        : `${String(itemOffset).padStart(10, "0")} 00000 n `
    )
    .join("\n");
  chunks.push(
    `xref\n0 ${objects.length + 1}\n${xrefRows}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return new Blob(chunks.map(toBlobPart), { type: "application/pdf" });
}

function byteLength(value: string | Uint8Array): number {
  if (typeof value !== "string") return value.byteLength;

  return new TextEncoder().encode(value).byteLength;
}

function toBlobPart(value: string | Uint8Array): BlobPart {
  if (typeof value === "string") return value;

  const copy = new Uint8Array(value.byteLength);
  copy.set(value);

  return copy.buffer;
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function triggerDownload({
  blob,
  fileName,
}: {
  readonly blob: Blob;
  readonly fileName: string;
}) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
