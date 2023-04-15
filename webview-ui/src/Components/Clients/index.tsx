import { Component } from "solid-js";
import { vscode } from "../../utilities/vscode";
import { clients } from '../../store';
import { Client } from "../Client";
import './style.scss';

function onSearch(e?: any) {
  e?.preventDefault();
  const query = (document.getElementById('search-input') as HTMLInputElement)?.value;
  clients.search(query);
}

export const Clients: Component = () => {
  window.addEventListener("focus", () => document.getElementById('search-input')?.focus());
  return (
    <main>
      <form id="search-container" onSubmit={onSearch}>
        <vscode-text-field
          id="search-input"
          name="search"
          placeholder="Search Clients..."
          autofocus
          onKeyDown={(e: any) => {
            if (e.key === 'Enter') {
              onSearch();
            }
          }}
        >
          <span slot="start" class="codicon codicon-search"></span>
        </vscode-text-field>
        <vscode-button id="search-button" type="submit" onClick={onSearch}>search</vscode-button>
      </form>
      {!!clients?.query && (
        <div class="results-container">
          {clients.loading && <vscode-progress-ring />}
          {!clients?.loading && (
            <div id="clients">
              <div class="results-details">
                <div class="count">
                  {clients?.list?.length} clients found
                </div>
              </div>
              {clients.list.map((client: any) => (
                <Client
                  client={client}
                  sendMessage={(message: any) => vscode.postMessage(message)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
