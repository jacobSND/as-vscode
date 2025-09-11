import { LanguageModelChatResponse, LanguageModelTextPart, LanguageModelToolCallPart } from "vscode";

export function parseTextResponse(response: string | undefined): string | undefined {
  if (!response) return response;
  return response
    .replace(/["'`]/g, '') 
    .replace(/\*\*(.*?)\*\*/g, '$1') 
    .replace(/\*(.*?)\*/g, '$1') 
    .replace(/`(.*?)`/g, '$1')
    .trim();
}

export function parseJsonResponse(response: string): Record<string, any> {
  const jsonString = response
    .replace(/^```json\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  return JSON.parse(jsonString);
}

type AwaitStreamOptions = LanguageModelChatResponse & {
  onText?: (part: LanguageModelTextPart) => void;
  onTool?: (part: LanguageModelToolCallPart) => void;
  onUnknown?: (part: any) => void;
};

export async function awaitStream(response: AwaitStreamOptions): Promise<string> {
  const { stream, onText, onTool, onUnknown } = response;
  const textParts: string[] = [];
  
  for await (const part of stream) {
    if (typeof part === 'string') {
      textParts.push(part);
      onText?.(new LanguageModelTextPart(part));
    } else if (part instanceof LanguageModelTextPart) {
      textParts.push(part.value);
      onText?.(part);
    } else if (part instanceof LanguageModelToolCallPart) {
      onTool?.(part);
    } else {
      onUnknown?.(part);
    }
  }
  return textParts.join('');
}