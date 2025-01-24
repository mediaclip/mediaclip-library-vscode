import fs from 'fs';
import path from 'path';
import vscode from 'vscode';
import {LibraryContext} from './library-context';

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

        return {
            packagesFolder: packagesFolder,
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
}
