export type Client = {
  key: string;
  name?: string;
  type?: string;
  cluster?: string;
  db?: string;
  domain?: string;
  repo?: string;
  localPath?: string;
  APP_ADMIN_PATH?: string;
  links?: { text: string; url: string }[];
}

export type SendMessage = (message: { command: string; value: unknown }) => void;