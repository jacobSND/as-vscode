import { Component } from "solid-js";
import VscodeIcon from '../../assets/vscode.svg?component-solid';
import GitDevIcon from '../../assets/github-dev.svg?component-solid';
import { unwrap } from "solid-js/store";
import { ActionVisibility } from "../../utilities/useActionSettings";
import { Subtitle } from "./Subtitle";
import type { Client as ClientType } from "./types";
import './style.scss';
import { Title } from "./Title";

export const Client: Component<ClientProps> = ({ client, sendMessage, actionSettings }) => {
  return (
    <div id={`client-${client.key}`} class="client">
      <div class="main">
        <Title client={client} sendMessage={sendMessage} />
        <Subtitle client={client} />
      </div>
      <details>
        <summary> Details
          <span class="tags">
            {client.type && <vscode-tag class="tag"><span class="type">{client.type}</span></vscode-tag>}
            {client.cluster && <vscode-tag class="tag"><span class="cluster">Cluster {client.cluster}</span></vscode-tag>}
            {!client.cluster && client.db && <vscode-tag class="tag"><span class="db">{client.db}</span></vscode-tag>}
          </span>
        </summary>
        <vscode-data-grid class="details-grid" generate-header="default" aria-label="Details">
          <vscode-data-grid-row row-type="header">
            <vscode-data-grid-cell cell-type="columnheader" grid-column="1">Field</vscode-data-grid-cell>
            <vscode-data-grid-cell cell-type="columnheader" grid-column="2">Value</vscode-data-grid-cell>
          </vscode-data-grid-row>
          {Object.keys(client).map((field) => (
            <vscode-data-grid-row>
              <vscode-data-grid-cell grid-column="1">{field}</vscode-data-grid-cell>
              <vscode-data-grid-cell grid-column="2">{client[field as keyof ClientType]}</vscode-data-grid-cell>
            </vscode-data-grid-row>
          ))}
        </vscode-data-grid>
      </details>
      <div class="actions">
        {actionSettings().includes('Copilot Chat') && (
          <vscode-link class="copilot" title={`Chat about ${client.name}`} onClick={() => sendMessage({ command: 'aiChat', value: unwrap(client) })}>
            <span class="codicon codicon-copilot"></span>
          </vscode-link>
        )}
        {client.type === 'custom' && actionSettings().includes('Build & Deploy') && (
          <vscode-link class="Build/Deploy" title="Build/Deploy" onClick={() => sendMessage({ command: 'buildDeploy', value: unwrap(client) })}>
            <span class="codicon codicon-play-circle"></span>
          </vscode-link>
        )}
        {actionSettings().includes('Github Repo') && !!client.repo && (
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
        {actionSettings().includes('Open Project') && !!(client.localPath || client.repo) && (
          <vscode-link class="folder" title="Open in VS Code" onClick={() => sendMessage({ command: 'openProject', value: unwrap(client) })}>
            <VscodeIcon />
          </vscode-link>
        )}
        {(actionSettings().includes('Github Dev') && client.repo) && (
          <vscode-link class="github-dev" title="Open on Github.dev" href={client.repo.replace('.com', '.dev')}>
            <GitDevIcon />
          </vscode-link>
        )}
        {actionSettings().includes('Connect to DB') && !!client.db && (
          <vscode-link class="db" title="Connect to DB" onClick={() => sendMessage({ command: 'connectDb', value: unwrap(client) })}>
            <span class="codicon codicon-database"></span>
          </vscode-link>
        )}
        {actionSettings().includes('Custom Terminal Command') && (
          <vscode-link class="terminal" title="Open Terminal" onClick={() => sendMessage({ command: 'customTerminalCommand', value: unwrap(client) })}>
            <span class="codicon codicon-terminal"></span>
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

export type ClientProps = {
  client: ClientType;
  sendMessage: (message: any) => void;
  actionSettings: () => ActionVisibility
}