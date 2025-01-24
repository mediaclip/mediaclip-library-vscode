import {PackageContext} from './library-context';
import {ResourceIdentityFactory, ResourceIdentityRaw} from './resource-identity-factory';

export type ResourceUrl = {
    owner: string;
    package: string;
    path: string;
    resolvedPath: string;
    fullPath: string;
    resourceIdentity: ResourceIdentityRaw
    isSpecialDefaultPackage?: boolean;
}


export interface IResourceUrlResolver {
    resolveResourceUrl(
        packageContext: PackageContext,
        resourceUrl: string,
    ): ResourceUrl | null;
}

export class ResourceUrlResolver implements IResourceUrlResolver {
    constructor(
        private readonly resourceIdentityFactory: ResourceIdentityFactory
    ) {
    }

    private readonly urlRegex = /["']\$\((?<package>[^)]+)\)(?<path>[^"']+)["']/;

    resolveResourceUrl(
        packageContext: PackageContext,
        resourceUrl: string,
    ): ResourceUrl | null {
        try {
            let match = resourceUrl.match(this.urlRegex);
            if (!match) {
                return null;
            }
            let owner = '';
            let packageName = '';
            let isSpecialDefaultPackage = false;
            let packageWithOwner = match[1];
            if (packageWithOwner.startsWith("package:")) {
                let splitPackage = packageWithOwner.substring("package:".length).split('/', 2);
                owner = splitPackage[0];
                packageName = splitPackage[1];
            } else if (packageWithOwner === "package") {
                owner = packageContext.currentPackage.owner;
                packageName = packageContext.currentPackage.package;
            } else if (packageWithOwner === "default-package") {
                owner = packageContext.defaultPackage.owner;
                packageName = packageContext.defaultPackage.package;
                isSpecialDefaultPackage = true;
            }

            let resolvedPath = `/packages/${owner}/${packageName}${match[2]}`;
            let resourceIdentityResult = this.resourceIdentityFactory.fromPath(resolvedPath);
            if (!resourceIdentityResult) {
                console.warn(`Failed to parse: \`${resolvedPath}'`);
                return null;
            }

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
            console.error('Error parsing package URL: ' + resourceUrl, error);
            return null;
        }
    }

}
