import { createSignal, onMount } from "solid-js";
import { vscode } from "./vscode";

export function useActionSettings() {
  const [actionSettings, setActionSettings] = createSignal<ActionVisibility>([
    "Copilot Chat",
    "Build & Deploy",
    "Github Repo",
    "Open Project",
    "Github Dev",
    "Connect to DB"
  ]);

  onMount(() => {
    window.addEventListener('message', (event) => {
      const message = event.data;
      if (message.type === 'settingsUpdate') {
        setActionSettings(message.payload);
      }
    });

    vscode.postMessage({ command: 'getSettings' });
  });

  return actionSettings;
}

export type ActionVisibility = (
  "Copilot Chat" |
  "Build & Deploy" |
  "Github Repo" |
  "Open Project" |
  "Github Dev" |
  "Connect to DB"
)[];