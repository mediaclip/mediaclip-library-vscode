import * as vscode from 'vscode';
import {Uri} from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {PackageContext} from './library-context';
import {IResourceTypeUtil} from './resource-type-util';
import {ILibraryPackageUtil} from './library-package-util';
import {PackageReferenceActionProvider} from './package-reference-action-provider';
import {IPackageContextUtil} from './package-context-util';
import {IResourceUrlResolver, ResourceUrl} from './resource-url-resolver';


export class LibraryLibraryLinkProvider implements vscode.DocumentLinkProvider {
    private readonly urlRegex = /["']\$\((?<package>[^)]+)\)(?<path>[^"']+)["']/g;

    constructor(
        private readonly resourceTypeUtil: IResourceTypeUtil,
        private readonly packageContextUtil: IPackageContextUtil,
        private readonly resourceUrlResolver: IResourceUrlResolver,
        private readonly diagnosticCollection: vscode.DiagnosticCollection,
        private readonly libraryPackageUtil: ILibraryPackageUtil,
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
        let packageContext = this.packageContextUtil.getCurrentPackageContextOfDocument(document);
        if (!packageContext) {
            return links;
        }

        const text = document.getText();

        let lastLinkPosition = 0;
        while ((match = this.urlRegex.exec(text)) !== null) {
            if (token.isCancellationRequested) {
                return links;
            }

            const resourceUrl = this.resourceUrlResolver.resolveResourceUrl(packageContext, match[0]);
            if (!resourceUrl) {
                continue;
            }

            let targetPath = this.getTargetFile(packageContext, resourceUrl);
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
                    if (!this.libraryPackageUtil.isTargetPackagedReferenced(resourceUrl.owner, resourceUrl.package, packageContext)) {
                        const diagnostic = new vscode.Diagnostic(
                            range,
                            `Referencing a resource from the package '${resourceUrl.owner}/${resourceUrl.package}' but it was not listed in the package.xml file.`,
                            vscode.DiagnosticSeverity.Warning
                        );
                        diagnostic.code = {
                            value: PackageReferenceActionProvider.PackageMissingReferenceDiagnosticCode,
                            target: Uri.parse('https://doc.mediaclip.ca/library/packages/package-xml/'),
                        };
                        diagnostic.source = 'Mediaclip Library';
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


    private getTargetFile(
        packageContext: PackageContext,
        resourceUrl: ResourceUrl
    ) {
        let groupKey = resourceUrl.resourceIdentity.groupKey;
        if (!groupKey) {
            return undefined;
        }

        let xmlFile: string = this.resourceTypeUtil.getFilenameForGroupKey(groupKey) + ".xml";

        return path.join(
            packageContext.libraryContext.packagesFolder,
            resourceUrl.owner,
            resourceUrl.package,
            resourceUrl.path,
            xmlFile
        );
    }
}
