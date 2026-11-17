import * as vscode from "vscode";
import { validate, type Client } from "l2txt";
import { toDiagnostics } from "l2txt/vscode";

declare function setTimeout(callback: () => void, ms: number): unknown;
declare function clearTimeout(timer: unknown): void;

const LANGUAGE = "l2txt";
const DELAY = 300;

export function activate(context: vscode.ExtensionContext) {
  const collection = vscode.languages.createDiagnosticCollection(LANGUAGE);
  const timers = new Map<string, unknown>();

  const client = (): Client | undefined => {
    const value = vscode.workspace.getConfiguration(LANGUAGE).get<string>("client");
    return value === "C1" || value === "C2" ? value : undefined;
  };
  const cancel = (uri: vscode.Uri) => {
    clearTimeout(timers.get(uri.toString()));
    timers.delete(uri.toString());
  };
  const update = (document: vscode.TextDocument) => {
    cancel(document.uri);
    if (document.languageId !== LANGUAGE || document.uri.scheme !== "file") {
      collection.delete(document.uri);
      return;
    }
    const result = validate(document.getText(), document.fileName, { client: client() });
    if (result)
      collection.set(document.uri, toDiagnostics(vscode, result.diagnostics));
    else
      collection.delete(document.uri);
  };
  const later = (document: vscode.TextDocument) => {
    cancel(document.uri);
    if (document.languageId !== LANGUAGE)
      return;
    timers.set(document.uri.toString(), setTimeout(() => update(document), DELAY));
  };
  const updateAll = () => vscode.workspace.textDocuments.forEach(update);

  updateAll();
  context.subscriptions.push(
    collection,
    vscode.workspace.onDidOpenTextDocument(update),
    vscode.workspace.onDidChangeTextDocument(({ document }) => later(document)),
    vscode.workspace.onDidCloseTextDocument(({ uri }) => {
      cancel(uri);
      collection.delete(uri);
    }),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(`${LANGUAGE}.client`))
        updateAll();
    }),
    { dispose: () => timers.forEach(clearTimeout) },
  );
}

export function deactivate() {}
