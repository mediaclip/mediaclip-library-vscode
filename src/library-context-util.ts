import fs from 'fs';
import path from 'path';
import vscode from 'vscode';
import {LibraryContext, PackageUrl} from './library-context';
import {XMLParser} from 'fast-xml-parser';

export interface ILibraryContextUtil {
    getLibraryContextOfDocument(document: vscode.TextDocument): LibraryContext | undefined;
}

export class LibraryContextUtil implements ILibraryContextUtil {

    public getLibraryContextOfDocument(document: vscode.TextDocument): LibraryContext | undefined {
        let packagesFolder = this.getFolderContaining(document.uri.fsPath, ".mediaclip-library-root");
        if (!packagesFolder) {
            let packageRootFolder = this.getFolderContaining(document.uri.fsPath, ".git");
            if (packageRootFolder) {
                packagesFolder = path.join(packageRootFolder, '..');
            }
        }
        if (!packagesFolder) {
            let currentPackageFolder = this.getFolderContaining(document.uri.fsPath, "package.xml");
            if (currentPackageFolder) {
                packagesFolder = path.join(currentPackageFolder, '..', '..');
            }
        }

        if (!packagesFolder) {
            console.warn('Failed to find the library root folder. The folder containing the packages');
            return undefined;
        }

        let currentPackage = this.getCurrentPackage(packagesFolder, document);
        if (!currentPackage) {
            console.warn('Failed to determine the current library package');
            return undefined;
        }

        let referencedPackages = this.getReferencedPackage(packagesFolder, currentPackage);

        return {
            packagesFolder: packagesFolder,
            currentPackage: currentPackage,
            // FIXME: find a better solution for the defaultPackage, like reading a file or a vs code settings
            defaultPackage: currentPackage,
            referencedPackages: referencedPackages
        };
    }

    private getFolderContaining(filePath: string, expectedName: string): string | undefined {
        let packagesPath = filePath;
        let maxDepth = 15;
        while (true) {
            if (fs.existsSync(path.join(packagesPath, expectedName))) {
                return packagesPath;
            }
            packagesPath = path.join(packagesPath, '..');
            maxDepth--;
            if (maxDepth === 0) {
                return undefined;
            }
        }
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

    private getReferencedPackage(packagesFolder: string, currentPackage: PackageUrl): PackageUrl[] {
        let referencedPackages: PackageUrl[] = [];
        let packageXmlPath = path.join(packagesFolder, currentPackage.owner, currentPackage.package, "package.xml");
        try {
            if (fs.existsSync(packageXmlPath)) {
                const parser = new XMLParser({
                    ignoreAttributes: false,
                    attributeNamePrefix: "@_"
                });
                let xmlData = fs.readFileSync(packageXmlPath, {encoding: "utf8"});
                let packageObj = parser.parse(xmlData);
                console.log(packageObj);
                let references = [];
                if (packageObj.package.references.reference instanceof Array) {
                    references = packageObj.package.references.reference;
                } else {
                    references = [packageObj.package.references.reference];
                }
                for (let referencedPackage of references) {
                    let packageName = referencedPackage['@_package'];
                    let splitParts = packageName.split('/');
                    referencedPackages.push({
                        owner: splitParts[0],
                        package: splitParts[1],
                    });
                }
            }
        } catch (error) {
            console.error('Failed to load referenced packages from ' + packageXmlPath, error);
        }

        console.log(referencedPackages);
        return referencedPackages;
    }
}
