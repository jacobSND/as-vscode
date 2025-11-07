import { createMutable } from "solid-js/store";
import { vscode } from "./utilities/vscode";

const initialState: any = vscode.getState();

export const clients = createMutable({
  current_client: initialState?.current_client || null,
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
    const prevState = vscode.getState() || {};
    vscode.setState({ ...prevState, query: value, clients: [] });
  },
  set(clients = []) {
    this.list = clients;
    this.loading = false;
    const prevState = vscode.getState() || {};
    vscode.setState({ ...prevState, clients });
  },
  setCurrentClient(client = null) {
    this.current_client = client;
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