import type { Metadata } from "next";
import { SunflourMenuClient } from "./SunflourMenuClient";

export const metadata: Metadata = {
  title: "Sunflour Bakery Menu",
  description:
    "Browse Sunflour Bakery's cakes, burgers, shawarma, ice cream, pastries, chops, and pizza menu.",
  openGraph: {
    title: "Sunflour Bakery Menu",
    description:
      "Cakes, burgers, shawarma, ice cream, pastries, chops, and pizza from Sunflour Bakery.",
    images: [
      {
        url: "/sunflour/sunflour-logo.png",
        width: 1536,
        height: 1024,
        alt: "Sunflour Bakery logo",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SunflourMenuPage() {
  return <SunflourMenuClient />;
}
