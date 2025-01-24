import * as vscode from 'vscode';
import {DiContainer} from "@mediaclip/dependency-injection";
import {ExtensionModule} from './extension.module';
import {LibraryXmlSchemaUtil} from './library-xml-schema-util';
import {PackageReferenceActionProvider} from './package-reference-action-provider';
import {Disposable} from 'vscode';


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

	console.log('Registering link provider...');
	const linkProvider = vscode.languages.registerDocumentLinkProvider(
		{language: 'xml'},
		libraryLinkProvider
	);
	context.subscriptions.push(linkProvider);

	const jsLinkProvider = vscode.languages.registerDocumentLinkProvider(
		{language: 'javascript'},
		libraryLinkProvider
	);
	context.subscriptions.push(jsLinkProvider);

	console.log('Registering code actions...');
	const addReferenceActionProvider = vscode.languages.registerCodeActionsProvider(
		'xml',
		container.resolve(tokens.PackageReferenceActionProvider)
	);
	context.subscriptions.push(addReferenceActionProvider);

	console.log('Registering XML Schemas...');
	const libraryXmlSchemaUtil = container.resolve(tokens.LibraryXmlSchemaUtil);
	libraryXmlSchemaUtil.addLibraryCatalogToConfig();


	console.log('Mediaclip Library Extension Activated !');
}
