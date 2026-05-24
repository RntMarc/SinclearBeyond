"use client";

import dynamic from "next/dynamic";
import { OfficeSkeleton } from "@/components/layout/Skeletons";

const OfficeClient = dynamic(() => import("./OfficeClient"), {
  ssr: false,
  loading: () => <OfficeSkeleton />,
});

export default function OfficeClientWrapper(props) {
  return <OfficeClient {...props} />;
}
