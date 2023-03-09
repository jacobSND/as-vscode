import type { Component } from 'solid-js';
import { Clients } from './Components/Clients';
import { provideVSCodeDesignSystem, vsCodeButton, vsCodeDataGrid, vsCodeDataGridCell, vsCodeDataGridRow, vsCodeDivider, vsCodeLink, vsCodeProgressRing, vsCodeTag, vsCodeTextField } from "@vscode/webview-ui-toolkit";
import './style.scss';

provideVSCodeDesignSystem().register(
  vsCodeTextField(),
  vsCodeButton(),
  vsCodeProgressRing(),
  vsCodeLink(),
  vsCodeTag(),
  vsCodeDataGrid(),
  vsCodeDataGridRow(),
  vsCodeDataGridCell(),
  vsCodeDivider(),
);

const App: Component = () => {
  return (
    <div>
      <Clients />
    </div>
  );
};

export default App;