import * as vscode from "vscode";
import { watch } from "l2txt/vscode";

export function activate(context: vscode.ExtensionContext) {
  let watcher: vscode.Disposable | undefined;
  const start = () => {
    watcher?.dispose();
    const client = vscode.workspace.getConfiguration("l2txt").get<string>("client");
    watcher = watch(vscode, { client: client === "C1" || client === "C2" ? client : undefined });
  };
  start();
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("l2txt.client"))
        start();
    }),
    { dispose: () => watcher?.dispose() },
  );
}

export function deactivate() {}
