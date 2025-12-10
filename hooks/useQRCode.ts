"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface QROptions {
  data: string;
  width?: number;
  height?: number;
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
  logoUrl?: string;
  logoSize?: number;
}

export function useQRCode(options: QROptions) {
  const ref = useRef<HTMLDivElement>(null);
  const qrCodeRef = useRef<InstanceType<
    typeof import("qr-code-styling").default
  > | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initQR = async () => {
      if (typeof window === "undefined") return;

      const QRCodeStyling = (await import("qr-code-styling")).default;

      const qrCode = new QRCodeStyling({
        width: options.width || 280,
        height: options.height || 280,
        type: "canvas",
        data: options.data || "https://github.com",
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

      setIsReady(true);
    };

    initQR();
  }, [
    options.data,
    options.dotsColor,
    options.backgroundColor,
    options.dotsType,
    options.cornersSquareType,
    options.cornersDotType,
    options.logoUrl,
    options.width,
    options.height,
    options.logoSize,
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

  return { ref, download, isReady };
}
