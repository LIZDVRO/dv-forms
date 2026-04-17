export type EfileResult = {
  success: boolean;
  messageId?: string;
  message?: string;
  error?: string;
};

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export async function submitEfile(params: {
  petitionerName: string;
  dv100Bytes: Uint8Array;
  clets001Bytes: Uint8Array;
  dv109Bytes: Uint8Array;
  dv110Bytes: Uint8Array;
}): Promise<EfileResult> {
  const body = {
    petitionerName: params.petitionerName,
    dv100: uint8ArrayToBase64(params.dv100Bytes),
    clets001: uint8ArrayToBase64(params.clets001Bytes),
    dv109: uint8ArrayToBase64(params.dv109Bytes),
    dv110: uint8ArrayToBase64(params.dv110Bytes),
  };

  const res = await fetch("/api/efile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as Partial<EfileResult>;
  return {
    success: res.ok && data.success === true,
    messageId: data.messageId,
    message: data.message,
    error: data.error,
  };
}
