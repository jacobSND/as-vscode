import { Component } from "solid-js";
import VscodeIcon from '../../assets/vscode.svg?component-solid';
import GitDevIcon from '../../assets/github-dev.svg?component-solid';
import './style.scss';

export const Client: Component<any> = ({ client, sendMessage }) => {
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
          <vscode-button
            title="Copy URL"
            appearance="icon"
            class="domain"
            onClick={() => sendMessage({ command: 'copy', value: client.domain })}
          ><span class="codicon codicon-globe"></span></vscode-button>
          <vscode-link class="domain" href={client.domain}>{client.domain.replace('https://', '')}</vscode-link>
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
        <div class="links">
          {!!client?.links?.length && <>
            <h4 class="heading">Links:</h4>
            {client.links.map((link: any) => (
              <vscode-link
                class="link"
                href={link.url}
              >
                <span class="codicon codicon-link-external"></span>
                <span class="text">{link.text}</span>
              </vscode-link>
            ))}
          </>}
        </div>
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
        <vscode-link class="github" title="View on Github" href={client.repo} onClick={(e: any) => {
          if (e.altKey) {
            sendMessage({ command: 'copy', value: client.repo })
            e.stopPropagation();
            e.preventDefault();
          }
        }}>
          <span class="codicon codicon-github"></span>
        </vscode-link>
        <vscode-link class="folder" title="Open in VS Code" onClick={() => sendMessage({ command: 'openProject', value: { ...client } })}>
          <VscodeIcon />
        </vscode-link>
        <vscode-link class="github-dev" title="Open on Github.dev" href={client.repo.replace('.com', '.dev')}>
          <GitDevIcon />
        </vscode-link>
        <vscode-link class="db" title="Connect to DB" onClick={() => sendMessage({ command: 'connectDb', value: { ...client } })}>
          <span class="codicon codicon-database"></span>
        </vscode-link>
      </div>
    </div>
  );
}