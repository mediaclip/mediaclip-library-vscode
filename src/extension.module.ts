import {DiToken, IDiContainer} from "@mediaclip/dependency-injection";
import {LibraryLibraryLinkProvider} from './library-library-link-provider';
import vscode from 'vscode';
import {IResourceTypeUtil, ResourceTypeUtil} from './resource-type-util';
import {ILibraryContextUtil, LibraryContextUtil} from './library-context-util';
import {ILibraryXmlSchemaUtil, LibraryXmlSchemaUtil} from './library-xml-schema-util';
import {IResourceIdentityFactory, ResourceIdentityFactory} from './resource-identity-factory';
import {ILibraryPackageUtil, LibraryPackageUtil} from './library-package-util';
import {PackageReferenceActionProvider} from './package-reference-action-provider';
import {IPackageContextUtil, PackageContextUtil} from './package-context-util';
import {IResourceUrlResolver, ResourceUrlResolver} from './resource-url-resolver';

const moduleTokens = {
    LibraryLinkDiagnosticCollection: DiToken.create<vscode.DiagnosticCollection>("LibraryLinkDiagnosticCollection"),
    LibraryLinkProvider: DiToken.create<LibraryLibraryLinkProvider>("LibraryLinkProvider"),
    ResourceTypeUtil: DiToken.create<IResourceTypeUtil>("ResourceTypeUtil"),
    LibraryContextUtil: DiToken.create<ILibraryContextUtil>("LibraryContextUtil"),
    PackageContextUtil: DiToken.create<IPackageContextUtil>("PackageContextUtil"),
    LibraryPackageUtil: DiToken.create<ILibraryPackageUtil>("LibraryPackageUtil"),
    LibraryXmlSchemaUtil: DiToken.create<ILibraryXmlSchemaUtil>("LibraryXmlSchemaUtil"),
    ResourceIdentityFactory: DiToken.create<IResourceIdentityFactory>("ResourceIdentityFactory"),
    ResourceUrlResolver: DiToken.create<IResourceUrlResolver>("ResourceUrlResolver"),
    PackageReferenceActionProvider: DiToken.create<PackageReferenceActionProvider>("PackageReferenceActionProvider"),
};

export class ExtensionModule {
    static register(container: IDiContainer) {
        if (container.isRegistered(moduleTokens.LibraryLinkDiagnosticCollection)) {
            return moduleTokens;
        }

        container.registerSingleton(moduleTokens.ResourceUrlResolver, c => new ResourceUrlResolver(
            c.resolve(moduleTokens.ResourceIdentityFactory)
        ));
        container.registerSingleton(moduleTokens.ResourceIdentityFactory, new ResourceIdentityFactory());
        container.registerSingleton(moduleTokens.LibraryXmlSchemaUtil, new LibraryXmlSchemaUtil());
        container.registerSingleton(moduleTokens.LibraryContextUtil, new LibraryContextUtil());
        container.registerSingleton(moduleTokens.PackageContextUtil, c => new PackageContextUtil(
            c.resolve(moduleTokens.LibraryContextUtil),
            c.resolve(moduleTokens.LibraryPackageUtil),
        ));
        container.registerSingleton(moduleTokens.LibraryPackageUtil, new LibraryPackageUtil());
        container.registerSingleton(moduleTokens.ResourceTypeUtil, new ResourceTypeUtil());
        container.registerSingleton(moduleTokens.LibraryLinkDiagnosticCollection, vscode.languages.createDiagnosticCollection('mediaclipLibraryUrlValidation'));
        container.registerSingleton(moduleTokens.LibraryLinkProvider, c => new LibraryLibraryLinkProvider(
            c.resolve(moduleTokens.ResourceTypeUtil),
            c.resolve(moduleTokens.PackageContextUtil),
            c.resolve(moduleTokens.ResourceUrlResolver),
            c.resolve(moduleTokens.LibraryLinkDiagnosticCollection),
            c.resolve(moduleTokens.LibraryPackageUtil),
        ));
        container.registerSingleton(moduleTokens.PackageReferenceActionProvider, c => new PackageReferenceActionProvider(
            c.resolve(moduleTokens.ResourceUrlResolver),
            c.resolve(moduleTokens.PackageContextUtil),
            c.resolve(moduleTokens.LibraryPackageUtil),
        ));

        return moduleTokens;
    }
}
