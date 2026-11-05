import { useParams } from "wouter";
import { SandboxIDE } from "@/components/sandbox/SandboxIDE";

export default function SystemBuilderIDE() {
  const params = useParams<{ id: string }>();
  if (!params.id) return null;
  const orderId = new URLSearchParams(window.location.search).get("orderId") || undefined;
  return <SandboxIDE projectId={params.id} adminOrderId={orderId} />;
}
