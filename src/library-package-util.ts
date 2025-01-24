import {LibraryContext, PackageContext, PackageUrl} from './library-context';
import path from 'path';
import fs from 'fs';
import {XMLParser} from 'fast-xml-parser';
import {Package} from './library-resource-definitions';

export interface ILibraryPackageUtil {
    isTargetPackagedReferenced(owner: string, packageName: string, packageContext: PackageContext): boolean

    getPackageXmlFilePath(libraryContext: LibraryContext, packageUrl: PackageUrl): string

    getReferencedPackage(libraryContext: LibraryContext, owner: string, packageName: string): PackageUrl[];

    getPackageXmlContentWithAdditionalReference(
        packageContext: PackageContext,
        newPackage: PackageUrl,
    ): string
}

export class LibraryPackageUtil implements ILibraryPackageUtil {
    isTargetPackagedReferenced(owner: string, packageName: string, packageContext: PackageContext): boolean {
        if (owner === packageContext.currentPackage.owner && packageName === packageContext.currentPackage.package) {
            return true;
        }

        let referencedPackage = packageContext.referencedPackages.find(x => x.owner === owner && x.package === packageName);
        return !!referencedPackage;
    }

    getPackageXmlFilePath(libraryContext: LibraryContext, packageUrl: PackageUrl): string {
        return path.join(libraryContext.packagesFolder, packageUrl.owner, packageUrl.package, "package.xml");
    }

    getReferencedPackage(libraryContext: LibraryContext, owner: string, packageName: string): PackageUrl[] {
        let referencedPackages: PackageUrl[] = [];
        let packageXmlPath = path.join(libraryContext.packagesFolder, owner, packageName, "package.xml");
        try {
            if (fs.existsSync(packageXmlPath)) {
                const parser = new XMLParser({
                    ignoreAttributes: false,
                    attributeNamePrefix: "@_"
                });
                let xmlData = fs.readFileSync(packageXmlPath, {encoding: "utf8"});
                let packageObj = parser.parse(xmlData);
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

        return referencedPackages;
    }

    getPackageXmlContentWithAdditionalReference(
        packageContext: PackageContext,
        newPackage: PackageUrl,
    ): string {
        let references = '';
        for (let referencedPackage of packageContext.referencedPackages.concat([newPackage])) {
            references += `    <reference package="${referencedPackage.owner}/${referencedPackage.package}" />\n`;
        }

        return `<package xmlns="http://www.mediaclip.ca/schema/xml/library">
  <references>
${references}  </references>
</package>
`;
    }
}
