import {DiToken, IDiContainer} from "@mediaclip/dependency-injection";
import {LibraryLibraryLinkProvider} from './library-library-link-provider';
import vscode from 'vscode';
import {IResourceTypeUtil, ResourceTypeUtil} from './resource-type-util';
import {ILibraryContextUtil, LibraryContextUtil} from './library-context-util';
import {ILibraryXmlSchemaUtil, LibraryXmlSchemaUtil} from './library-xml-schema-util';

const moduleTokens = {
    LibraryLinkDiagnosticCollection: DiToken.create<vscode.DiagnosticCollection>("LibraryLinkDiagnosticCollection"),
    LibraryLinkProvider: DiToken.create<LibraryLibraryLinkProvider>("LibraryLinkProvider"),
    ResourceTypeUtil: DiToken.create<IResourceTypeUtil>("ResourceTypeUtil"),
    LibraryContextUtil: DiToken.create<ILibraryContextUtil>("LibraryContextUtil"),
    LibraryXmlSchemaUtil: DiToken.create<ILibraryXmlSchemaUtil>("LibraryXmlSchemaUtil"),
};

export class ExtensionModule {
    static register(container: IDiContainer) {
        if (container.isRegistered(moduleTokens.LibraryLinkDiagnosticCollection)) {
            return moduleTokens;
        }

        container.registerSingleton(moduleTokens.LibraryXmlSchemaUtil, new LibraryXmlSchemaUtil());
        container.registerSingleton(moduleTokens.LibraryContextUtil, new LibraryContextUtil());
        container.registerSingleton(moduleTokens.ResourceTypeUtil, new ResourceTypeUtil());
        container.registerSingleton(moduleTokens.LibraryLinkDiagnosticCollection, vscode.languages.createDiagnosticCollection('mediaclipLibraryUrlValidation'));
        container.registerSingleton(moduleTokens.LibraryLinkProvider, c => new LibraryLibraryLinkProvider(
            c.resolve(moduleTokens.ResourceTypeUtil),
            c.resolve(moduleTokens.LibraryContextUtil),
            c.resolve(moduleTokens.LibraryLinkDiagnosticCollection),
        ));

        return moduleTokens;
    }
}
