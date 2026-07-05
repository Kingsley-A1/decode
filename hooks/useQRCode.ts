"use client";

import { useEffect, useRef, useState } from "react";
import { getQuietZonePx } from "@/lib/qr/quiet-zone";

export interface QROptions {
  data: string;
  width?: number;
  height?: number;
  /** Quiet zone in QR modules (0-16), matching the server export schema. */
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
      qrCodeRef.current = null;

      const data = options.data.trim();
      if (!data) {
        if (ref.current) {
          ref.current.innerHTML = "";
        }

        return;
      }

      const [{ default: QRCodeStyling }, qrCodeLib] = await Promise.all([
        import("qr-code-styling"),
        import("qrcode"),
        options.logoUrl ? preloadLogoImage(options.logoUrl) : Promise.resolve(),
      ]);

      if (!isActive) return;

      const size = options.width || 280;
      const marginModules = options.margin ?? 4;
      let marginPx = marginModules;
      try {
        // Same matrix library as the server export, so the preview quiet zone
        // occupies the same proportion of the canvas as the downloaded file.
        const moduleCount = qrCodeLib.create(data, {
          errorCorrectionLevel: options.errorCorrectionLevel || "Q",
        }).modules.size;
        marginPx = getQuietZonePx({ marginModules, moduleCount, size });
      } catch {
        // Unencodable payloads keep the raw value; qr-code-styling surfaces
        // its own failure for the same payload.
      }

      const qrCode = new QRCodeStyling({
        width: size,
        height: options.height || 280,
        type: "canvas",
        data,
        margin: marginPx,
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
          // Only fall back to a default ratio when a logo is actually present;
          // an unset/zero ratio must not silently render an oversized logo.
          imageSize:
            options.logoSize && options.logoSize > 0 ? options.logoSize : 0.25,
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

  return { ref, isReady };
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
