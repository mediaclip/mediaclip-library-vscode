import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {LibraryContext} from './library-context';
import {IResourceTypeUtil} from './resource-type-util';
import {ILibraryContextUtil} from './library-context-util';
import {IResourceIdentityFactory, ResourceIdentityRaw} from './resource-identity-factory';


type ResourceUrl = {
    owner: string;
    package: string;
    path: string;
    resolvedPath: string;
    fullPath: string;
    resourceIdentity: ResourceIdentityRaw
    isSpecialDefaultPackage?: boolean;
}

export class LibraryLibraryLinkProvider implements vscode.DocumentLinkProvider {
    private readonly urlRegex = /["']\$\((?<package>[^)]+)\)(?<path>[^"']+)["']/g;

    constructor(
        private readonly resourceTypeUtil: IResourceTypeUtil,
        private readonly libraryContextUtil: ILibraryContextUtil,
        private readonly resourceIdentityFactory: IResourceIdentityFactory,
        private readonly diagnosticCollection: vscode.DiagnosticCollection,
    ) {
    }

    async provideDocumentLinks(
        document: vscode.TextDocument,
        token: vscode.CancellationToken
    ): Promise<vscode.DocumentLink[]> {
        const links: vscode.DocumentLink[] = [];
        const diagnostics: vscode.Diagnostic[] = [];

        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            return links;
        }

        let match: RegExpExecArray | null;
        let libraryContext = this.libraryContextUtil.getLibraryContextOfDocument(document);
        if (!libraryContext) {
            return links;
        }

        const text = document.getText();

        let lastLinkPosition = 0;
        while ((match = this.urlRegex.exec(text)) !== null) {
            if (token.isCancellationRequested) {
                return links;
            }

            const resourceUrl = this.parsePackageUrl(libraryContext, match);
            if (!resourceUrl) {
                continue;
            }

            let targetPath = this.getTargetFile(libraryContext, resourceUrl);
            if (!targetPath) {
                continue;
            }

            const startIndex = document.getText().indexOf(resourceUrl.fullPath, lastLinkPosition);
            if (startIndex === -1) {
                continue;
            }
            lastLinkPosition = startIndex + resourceUrl.fullPath.length;
            const startPosition = document.positionAt(startIndex);
            const endPosition = document.positionAt(startIndex + resourceUrl.fullPath.length);
            const range = new vscode.Range(startPosition, endPosition);

            if (!fs.existsSync(targetPath)) {
                const diagnostic = new vscode.Diagnostic(
                    range,
                    'File `' + targetPath + '` was not found',
                    vscode.DiagnosticSeverity.Error
                );
                diagnostics.push(diagnostic);
            } else {
                const link = new vscode.DocumentLink(
                    range,
                    vscode.Uri.file(targetPath)
                );

                link.tooltip = `Open ${targetPath}`;
                links.push(link);

                if (!resourceUrl.isSpecialDefaultPackage) {
                    if (resourceUrl.owner !== libraryContext.currentPackage.owner || resourceUrl.package !== libraryContext.currentPackage.package) {
                        let referencedPackage = libraryContext.referencedPackages.find(x => x.owner === resourceUrl.owner && x.package === resourceUrl.package);
                        if (!referencedPackage) {
                            const diagnostic = new vscode.Diagnostic(
                                range,
                                `Referencing a resource from the package '${resourceUrl.owner}/${resourceUrl.package}' but it was not listed in the package.xml file.`,
                                vscode.DiagnosticSeverity.Warning
                            );
                            diagnostics.push(diagnostic);
                        }
                    }
                }
            }
        }

        // Set the diagnostics for the document
        this.diagnosticCollection.clear();
        this.diagnosticCollection.set(document.uri, diagnostics);

        return links;
    }

    private parsePackageUrl(
        libraryContext: LibraryContext,
        match: RegExpExecArray,
    ): ResourceUrl | null {
        try {
            let owner = '';
            let packageName = '';
            let isSpecialDefaultPackage = false;
            let packageWithOwner = match[1];
            if (packageWithOwner.startsWith("package:")) {
                let splitPackage = packageWithOwner.substring("package:".length).split('/', 2);
                owner = splitPackage[0];
                packageName = splitPackage[1];
            } else if (packageWithOwner === "package") {
                owner = libraryContext.currentPackage.owner;
                packageName = libraryContext.currentPackage.package;
            } else if (packageWithOwner === "default-package") {
                owner = libraryContext.defaultPackage.owner;
                packageName = "default";
                isSpecialDefaultPackage = true;
            }

            let resolvedPath = `/packages/${owner}/${packageName}${match[2]}`;
            let resourceIdentityResult = this.resourceIdentityFactory.fromPath(resolvedPath);
            if (!resourceIdentityResult) {
                console.warn(`Failed to parse: \`${resolvedPath}'`);
                return null;
            }
            console.log(resourceIdentityResult.resourceIdentity);

            return {
                fullPath: match[0],
                owner: owner,
                package: packageName,
                path: match[2],
                resolvedPath: resolvedPath,
                resourceIdentity: resourceIdentityResult.resourceIdentity,
                isSpecialDefaultPackage: isSpecialDefaultPackage,
            } as ResourceUrl;
        } catch (error) {
            console.error('Error parsing package URL: ' + match[0], error);
            return null;
        }
    }

    private getTargetFile(
        libraryContext: LibraryContext,
        resourceUrl: ResourceUrl
    ) {
        let groupKey = resourceUrl.resourceIdentity.groupKey;
        if (!groupKey) {
            return undefined;
        }

        let xmlFile: string = this.resourceTypeUtil.getFilenameForGroupKey(groupKey) + ".xml";

        return path.join(
            libraryContext.packagesFolder,
            resourceUrl.owner,
            resourceUrl.package,
            resourceUrl.path,
            xmlFile
        );
    }
}
