import vscode from 'vscode';
import {PackageContext, PackageUrl} from './library-context';
import {ILibraryContextUtil} from './library-context-util';
import path from 'path';
import {ILibraryPackageUtil} from './library-package-util';

export interface IPackageContextUtil {
    getCurrentPackageContextOfDocument(document: vscode.TextDocument): PackageContext | undefined
}

export class PackageContextUtil implements IPackageContextUtil {
    constructor(
        private readonly libraryContextUtil: ILibraryContextUtil,
        private readonly libraryPackageUtil: ILibraryPackageUtil,
    ) {
    }

    getCurrentPackageContextOfDocument(document: vscode.TextDocument): PackageContext | undefined {
        let libraryContext = this.libraryContextUtil.getLibraryContextOfDocument(document);
        if (!libraryContext) {
            return undefined;
        }

        let currentPackage = this.getCurrentPackage(libraryContext.packagesFolder, document);
        if (!currentPackage) {
            console.warn('Failed to determine the current library package');
            return undefined;
        }

        let referencedPackages = this.libraryPackageUtil.getReferencedPackage(
            libraryContext,
            currentPackage.owner,
            currentPackage.package
        );

        return {
            libraryContext: libraryContext,
            currentPackage: currentPackage,
            defaultPackage: {owner: currentPackage.owner, package: 'default'},
            referencedPackages: referencedPackages
        };
    }

    private getCurrentPackage(packagesFolder: string, document: vscode.TextDocument): PackageUrl | undefined {
        let normalizedPackagesFolder = path.normalize(packagesFolder);
        let normalizedDocumentPath = path.normalize(document.uri.fsPath);
        // If child starts with parent, remove it
        if (normalizedDocumentPath.startsWith(normalizedPackagesFolder)) {
            // Get the relative path, removing leading separator if present
            let commonPart = normalizedDocumentPath.substring(normalizedPackagesFolder.length);
            if (commonPart.startsWith('/') || commonPart.startsWith('\\')) {
                commonPart = commonPart.substring(1);
            }
            let splitParts = commonPart.split(/[/\\]/);
            return {
                owner: splitParts[0],
                package: splitParts[1],
            };
        }
        return undefined;
    }
}
