import { createMutable } from "solid-js/store";
import { vscode } from "./utilities/vscode";

const initialState: any = vscode.getState();

export const clients = createMutable({
  list: initialState?.clients || [],
  loading: false,
  query: '',
  search(value = '') {
    this.query = value;
    if (value) {
      this.loading = true;
      return vscode.postMessage({ command: 'search', value });
    }
    this.list = [];
  },
  set(clients = []) {
    this.list = clients;
    this.loading = false;
    vscode.setState({ clients });
  }
});

window.addEventListener('message', (e) => {
  if (e?.data?.action === 'search') {
    return clients.set(e?.data?.value || []);
  } else {
    console.log(e);
  }
});