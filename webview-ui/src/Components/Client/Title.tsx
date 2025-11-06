import { Client, SendMessage } from "./types";

export function Title({ client, sendMessage }: Props) {
  return (
    <h2 class="title">
      <vscode-button
        title="Copy Key"
        appearance="icon"
        onClick={() => sendMessage({ command: 'copy', value: client.key })}
      ><span class="codicon codicon-key"></span></vscode-button>
      <div>
        <span class="key">{client.key}</span>
        {client.key && client.name && <span>:&nbsp;</span>}
        <span class="name">{client.name}</span>
      </div>
    </h2>
  );
}

type Props = {
  client: Client,
  sendMessage: SendMessage,
}