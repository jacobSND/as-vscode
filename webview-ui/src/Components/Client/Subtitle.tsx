import { useCurrentlyHeldKey } from "@solid-primitives/keyboard";
import { Client } from "./types";

export function Subtitle({ client }: Props) {
  if (!client?.domain) return null;
  const heldKey = useCurrentlyHeldKey();

  const adminDomain = client?.domain + (client?.APP_ADMIN_PATH || '/admin');
  const domain = heldKey() === 'CONTROL' ? adminDomain : client?.domain;

  return (
    <div class="subtitle">
      <vscode-link class="admin-domain" href={adminDomain}>
        <span class="codicon codicon-globe"></span>
      </vscode-link>
      <vscode-link
        class="domain"
        href={domain}
      >
        {domain.replace('https://', '')}
      </vscode-link>
    </div>
  );
}

type Props = {
  client: Client,
}