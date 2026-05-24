"use client";

import dynamic from "next/dynamic";
import { EditorSkeleton } from "@/components/layout/Skeletons";

const EditorClient = dynamic(() => import("./EditorClient"), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

export default function EditorClientWrapper(props) {
  return <EditorClient {...props} />;
}
