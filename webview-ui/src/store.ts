import { createMutable } from "solid-js/store";
import { vscode } from "./utilities/vscode";

const initialState: any = vscode.getState();

export const clients = createMutable({
  current_client: initialState?.current_client || null,
  current_client_index: initialState?.current_client_index,
  list: initialState?.clients || [],
  loading: false,
  query: initialState?.query || '',
  search(value = '') {
    this.query = value;
    if (value) {
      this.loading = true;
      vscode.postMessage({ command: 'search', value });
    } else {
      this.list = [];
    }
    this.current_client_index = null;
    const prevState = vscode.getState() || {};
    vscode.setState({ ...prevState, query: value, clients: [] });
  },
  set(clients = []) {
    this.list = clients;
    this.loading = false;
    const prevState = vscode.getState() || {};
    vscode.setState({ ...prevState, clients });
  },
  add(client = null, index?: number) {
    if (!client) return;
    const current_clients = this.list;
    this.list = [];
    this.list = current_clients.toSpliced(typeof index === 'number' ? index : current_clients.length, 0, client);
    const prevState = vscode.getState() || {};
    vscode.setState({ ...prevState, clients: this.list });
  },
  remove(client: any = null) {
    if (!client) return;
    const current_clients = this.list;
    this.list = [];
    this.list = current_clients.filter((c: any) => c.key !== client.key);
    const prevState = vscode.getState() || {};
    vscode.setState({ ...prevState, clients: this.list });
  },
  setCurrentClient(client: any = null) {
    this.current_client = null;
    this.current_client = client;
    this.current_client_index = this.list.findIndex((c: any) => c.key === client?.key);
    const prevState = vscode.getState() || {};
    vscode.setState({ ...prevState, current_client: client });
  }
});

window.addEventListener('message', (e) => {
  if (e?.data?.action === 'search') {
    return clients.set(e?.data?.value || []);
  } else if (e?.data?.action === 'current_client') {
    return clients.setCurrentClient(e?.data?.value || null);
  } else {
    console.log(e);
  }
});