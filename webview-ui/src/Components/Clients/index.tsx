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
      {(clients.list.length || clients.loading) && (
        <div class="results-container">
          {clients.loading && <vscode-progress-ring />}
          {!!clients.list.length ? (
            <div id="clients">
              {clients.list.length > 1 && (
                <div class="results-details">
                  <div class="count">{clients.list.length} clients found</div>
                </div>
              )}
              {clients.list.map((client: any) => (
                <Client
                  client={client}
                  sendMessage={(message: any) => vscode.postMessage(message)}
                />
              ))}
            </div>
          ) : (
            <div id="no-results">
              <p>No Clients found</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
