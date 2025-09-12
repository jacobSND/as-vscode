import { Component, createSignal, onMount } from "solid-js";
import { useKeyDownList } from "@solid-primitives/keyboard";
import VscodeIcon from '../../assets/vscode.svg?component-solid';
import GitDevIcon from '../../assets/github-dev.svg?component-solid';
import './style.scss';
import { unwrap } from "solid-js/store";

interface ActionVisibility {
  copilotChat: boolean;
  buildDeploy: boolean;
  githubRepo: boolean;
  openProject: boolean;
  githubDev: boolean;
  connectDb: boolean;
}

export const Client: Component<any> = ({ client, sendMessage }) => {
  const pressedKeys = useKeyDownList();
  const ctrl = () => pressedKeys().includes('CONTROL');

  const [actionSettings, setActionSettings] = createSignal<ActionVisibility>({
    copilotChat: true,
    buildDeploy: true,
    githubRepo: true,
    openProject: true,
    githubDev: true,
    connectDb: true
  });

  onMount(() => {
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'settingsUpdate') {
        setActionSettings(message.payload);
      }
    });
  });

  return (
    <div id={`client-${client.key}`} class="client">
      <div class="main">
        <h2 class="title">
          <vscode-button
            title="Copy Key"
            appearance="icon"
            onClick={() => sendMessage({ command: 'copy', value: client.key })}
          ><span class="codicon codicon-key"></span></vscode-button>
          <div>
            <span class="key">{client.key}</span>:&nbsp;
            <span class="name">{client.name}</span>
          </div>
        </h2>
        <div class="subtitle">
          <vscode-link class="admin-domain" href={client.domain + client.APP_ADMIN_PATH}>
            <span class="codicon codicon-globe"></span>
          </vscode-link>
          <vscode-link
            class="domain"
            href={client.domain + (ctrl() ? client.APP_ADMIN_PATH : '')}
          >
            {client.domain.replace('https://', '') + (ctrl() ? client.APP_ADMIN_PATH : '')}
          </vscode-link>
        </div>
      </div>
      <details>
        <summary> Details
          <span class="tags">
            <vscode-tag class="tag"><span class="type">{client.type}</span></vscode-tag>
            {client.cluster ? (
              <vscode-tag class="tag"><span class="cluster">Cluster {client.cluster}</span></vscode-tag>
            ) : (
              <vscode-tag class="tag"><span class="cluster">{client.db}</span></vscode-tag>
            )}
          </span>
        </summary>
        <vscode-data-grid class="details-grid" generate-header="default" aria-label="Details">
          <vscode-data-grid-row row-type="header">
            <vscode-data-grid-cell cell-type="columnheader" grid-column="1">Field</vscode-data-grid-cell>
            <vscode-data-grid-cell cell-type="columnheader" grid-column="2">Value</vscode-data-grid-cell>
          </vscode-data-grid-row>
          {Object.keys(client).map((field: any) => (
            <vscode-data-grid-row>
              <vscode-data-grid-cell grid-column="1">{field}</vscode-data-grid-cell>
              <vscode-data-grid-cell grid-column="2">{client[field as keyof any]}</vscode-data-grid-cell>
            </vscode-data-grid-row>
          ))}
        </vscode-data-grid>
      </details>
      <div class="actions">
        {actionSettings().copilotChat && (
          <vscode-link class="copilot" title={`Chat about ${client.name}`} onClick={() => sendMessage({ command: 'aiChat', value: unwrap(client) })}>
            <span class="codicon codicon-copilot"></span>
          </vscode-link>
        )}
        {client.type === 'custom' && actionSettings().buildDeploy && (
          <vscode-link class="Build/Deploy" title="Build/Deploy" onClick={() => sendMessage({ command: 'buildDeploy', value: unwrap(client) })}>
            <span class="codicon codicon-play-circle"></span>
          </vscode-link>
        )}
        {actionSettings().githubRepo && (
          <vscode-link class="github" title="View on Github" href={client.repo} onClick={(e: any) => {
            if (e.altKey) {
              sendMessage({ command: 'copy', value: client.repo })
              e.stopPropagation();
              e.preventDefault();
            }
          }}>
            <span class="codicon codicon-github"></span>
          </vscode-link>
        )}
        {actionSettings().openProject && (
          <vscode-link class="folder" title="Open in VS Code" onClick={() => sendMessage({ command: 'openProject', value: unwrap(client) })}>
            <VscodeIcon />
          </vscode-link>
        )}
        {actionSettings().githubDev && (
          <vscode-link class="github-dev" title="Open on Github.dev" href={client.repo.replace('.com', '.dev')}>
            <GitDevIcon />
          </vscode-link>
        )}
        {actionSettings().connectDb && (
          <vscode-link class="db" title="Connect to DB" onClick={() => sendMessage({ command: 'connectDb', value: unwrap(client) })}>
            <span class="codicon codicon-database"></span>
          </vscode-link>
        )}
        {!!client?.links?.length && <>
          <div class="links">
            <vscode-button
              title="More Actions"
              appearance="icon"
            >
              <span class="codicon codicon-triangle-down"></span>
            </vscode-button>
            <div class="links-container">
              {client.links.map((link: any) => (
                <vscode-link
                  class="link"
                  href={link.url}
                >
                  <span class="text">{link.text}</span>
                  <span class="codicon codicon-link-external"></span>
                </vscode-link>
              ))}
            </div>
          </div>
        </>}
      </div>
    </div>
  );
}