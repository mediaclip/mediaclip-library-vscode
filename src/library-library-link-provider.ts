import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {LibraryContext} from './library-context';
import {IResourceTypeUtil} from './resource-type-util';
import {ILibraryContextUtil, LibraryContextUtil} from './library-context-util';


type ResourceUrl = {
    owner: string;
    package: string;
    path: string;
    fullPath: string;
}

export class LibraryLibraryLinkProvider implements vscode.DocumentLinkProvider {
    private readonly urlRegex = /["']\$\((?<package>[^)]+)\)(?<path>[^"']+)["']/g;

    constructor(
        private readonly resourceTypeUtil: IResourceTypeUtil,
        private readonly libraryContextUtil: ILibraryContextUtil,
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
            let packageWithOwner = match[1];
            if (packageWithOwner.startsWith("package:")) {
                let splitPackage = packageWithOwner.substring("package:".length).split('/', 2);
                let owner = splitPackage[0];
                let packageName = splitPackage[1];
                return {
                    fullPath: match[0],
                    owner: owner,
                    package: packageName,
                    path: match[2]
                };
            } else if (packageWithOwner === "package") {
                return {
                    fullPath: match[0],
                    owner: libraryContext.currentPackage.owner,
                    package: libraryContext.currentPackage.package,
                    path: match[2]
                };
            } else if (packageWithOwner === "default-package") {
                return {
                    fullPath: match[0],
                    owner: libraryContext.defaultPackage.owner,
                    package: libraryContext.defaultPackage.package,
                    path: match[2]
                };
            }
            return null;
        } catch (error) {
            console.error('Error parsing package URL: ' + match[0], error);
            return null;
        }
    }

    private getTargetFile(
        libraryContext: LibraryContext,
        resourceUrl: ResourceUrl
    ) {
        let xmlFile: string = "";
        for (let resourceType of this.resourceTypeUtil.getResourceTypes()) {
            if (resourceUrl.path.includes(resourceType)) {
                xmlFile = resourceType + ".xml";
                break;
            }
        }

        return path.join(
            libraryContext.packagesFolder,
            resourceUrl.owner,
            resourceUrl.package,
            resourceUrl.path,
            xmlFile
        );
    }
}
