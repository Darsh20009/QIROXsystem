import { useParams } from "wouter";
import { SandboxIDE } from "@/components/sandbox/SandboxIDE";

export default function SystemBuilderIDE() {
  const params = useParams<{ id: string }>();
  if (!params.id) return null;
  return <SandboxIDE projectId={params.id} />;
}
