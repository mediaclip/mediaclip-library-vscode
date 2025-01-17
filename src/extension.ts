import * as vscode from 'vscode';
import {DiContainer} from "@mediaclip/dependency-injection";
import {ExtensionModule} from './extension.module';


export function activate(context: vscode.ExtensionContext) {
	console.log('Activating Mediaclip Library Extension...');

	const container = new DiContainer({
		overridesBehaviour: "deny",
		name: 'hub-js'
	});

	const tokens = ExtensionModule.register(container);
	const libraryLinkDiagnosticCollection = container.resolve(tokens.LibraryLinkDiagnosticCollection);
	const libraryLinkProvider = container.resolve(tokens.LibraryLinkProvider);
	context.subscriptions.push(libraryLinkDiagnosticCollection);

	const linkProvider = vscode.languages.registerDocumentLinkProvider(
		{ language: 'xml' },
		libraryLinkProvider
	);
	context.subscriptions.push(linkProvider);

	const jsLinkProvider = vscode.languages.registerDocumentLinkProvider(
		{ language: 'javascript' },
		libraryLinkProvider
	);
	context.subscriptions.push(jsLinkProvider);

	console.log('Mediaclip Library Extension Activated !');
}
