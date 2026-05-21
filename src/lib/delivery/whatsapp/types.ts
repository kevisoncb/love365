export type WhatsAppSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
  skipped?: boolean;
};

export interface WhatsAppProvider {
  readonly id: string;
  sendText(input: {
    toE164: string;
    text: string;
  }): Promise<WhatsAppSendResult>;
  sendImage(input: {
    toE164: string;
    imageBase64: string;
    caption?: string;
  }): Promise<WhatsAppSendResult>;
}
