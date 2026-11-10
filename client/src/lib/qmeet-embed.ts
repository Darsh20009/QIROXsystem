const commands = new Set(["toggleCamera", "toggleMicrophone", "toggleScreenShare", "openAnnotations", "leave"]);
export function qmeetEmbedCommand(event: Pick<MessageEvent, "origin" | "source" | "data">,
  parent: MessageEventSource | null, origins: string[], roomName: string | undefined, joined: boolean): string | null {
  if (!joined || !parent || event.source !== parent || !origins.includes(event.origin)) return null;
  const data = event.data;
  return data?.type === "qmeet:command" && data.roomName === roomName && commands.has(data.command) ? data.command : null;
}