"use client";

import dynamic from "next/dynamic";
import { Loading } from "@/components/Loading";

const QRScanner = dynamic(
  () => import("@/components/QRScanner").then((module) => module.QRScanner),
  {
    ssr: false,
    loading: () => (
      <Loading label="Loading scanner" className="min-h-[560px]" />
    ),
  }
);

export function ScanClient() {
  return <QRScanner />;
}
