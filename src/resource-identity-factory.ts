import {
    Categorization,
    Product,
    ResourceWithNamedAssetsBase,
    Theme,
    ThemeMapping
} from './library-resource-definitions';

export class ResourceIdentityRaw {
    owner?: string;
    packageName?: string;
    groupKey?: string;
    groupId?: string;
    id?: string;
    childKey?: string;
    childId?: string;
    options?: string;

    constructor(
        owner?: string,
        packageName?: string,
        groupKey?: string,
        groupId?: string,
        id?: string,
        childKey?: string,
        childId?: string,
        options?: string
    ) {
        this.owner = owner;
        this.packageName = packageName;
        this.groupKey = groupKey;
        this.groupId = groupId;
        this.id = id;
        this.childKey = childKey;
        this.childId = childId;
        this.options = options;
    }
}

const emptyIdx = 0;
const packagesIdx = 1;
const ownerIdx = 2;
const packageIdx = 3;
const groupIdx = 4;


export type ResourceIdentityParseResult = {
    resourceIdentity: ResourceIdentityRaw,
    extras?: string
}

export interface IResourceIdentityFactory {
    fromPath(path: string): ResourceIdentityParseResult | undefined;
}

export class ResourceIdentityFactory implements IResourceIdentityFactory {

    public fromPath(path: string): ResourceIdentityParseResult | undefined {
        let options: string | undefined;
        let indexOfOptions = path.indexOf('[');
        if (indexOfOptions !== -1) {
            options = path.substring(indexOfOptions);
            path = path.substring(0, indexOfOptions);
        }

        let parts = path.split('/');

        if (parts[emptyIdx] !== "" || parts[packagesIdx] !== "packages" || parts.length < 4) {
            return undefined;
        }

        if (parts.length === 4) {
            if (options) {
                throw new Error(`Options are not allowed in a package resource identity. '${options}'`);
            }

            return {
                resourceIdentity: new ResourceIdentityRaw(parts[ownerIdx], parts[packageIdx]),
            };
        }

        if (parts.length < 6) {
            return undefined;
        }

        if (parts.length === 6) {
            return {
                resourceIdentity: new ResourceIdentityRaw(parts[ownerIdx], parts[packageIdx], parts[groupIdx], undefined, parts[groupIdx + 1], undefined, undefined, options),
            };
        }

        if (parts.length >= 7 && parts[groupIdx] === Product.GroupKey) {
            if (parts[groupIdx + 2] === ResourceWithNamedAssetsBase.AssetsKey) {
                return {
                    resourceIdentity: new ResourceIdentityRaw(parts[ownerIdx], parts[packageIdx], parts[groupIdx], undefined, parts[groupIdx + 1], undefined, undefined, options),
                    extras: parts.slice(groupIdx + 2).join('/'),
                };
            }

            return {
                resourceIdentity: new ResourceIdentityRaw(parts[ownerIdx], parts[packageIdx], parts[groupIdx], undefined, parts[groupIdx + 1], parts[groupIdx + 2], undefined, options),
                extras: parts.length > 7 ? parts.slice(groupIdx + 3).join('/') : undefined,
            };
        }

        if (parts.length > 6 && parts[groupIdx] === Theme.GroupKey) {
            if (parts.length >= 7 && parts[groupIdx + 2] === "autofill-specifications") {
                return {
                    resourceIdentity: new ResourceIdentityRaw(
                        parts[ownerIdx],
                        parts[packageIdx],
                        parts[groupIdx],
                        undefined,
                        parts[groupIdx + 1],
                        parts[groupIdx + 2],
                        undefined,
                        options
                    )
                };
            }
            return {
                resourceIdentity: new ResourceIdentityRaw(
                    parts[ownerIdx],
                    parts[packageIdx],
                    parts[groupIdx],
                    undefined,
                    parts[groupIdx + 1],
                    undefined,
                    undefined,
                    options
                ),
                extras: parts.length > 7 ? parts.slice(groupIdx + 2).join('/') : undefined,
            };
        }

        if (parts.length === 7 && parts[groupIdx] === Categorization.GroupKey) {
            return {
                resourceIdentity: new ResourceIdentityRaw(
                    parts[ownerIdx],
                    parts[packageIdx],
                    parts[groupIdx],
                    parts[groupIdx + 1],
                    parts[groupIdx + 2],
                    undefined,
                    undefined,
                    options
                )
            };
        }

        if (parts.length === 9 && parts[groupIdx] === Categorization.GroupKey) {
            return {
                resourceIdentity: new ResourceIdentityRaw(
                    parts[ownerIdx],
                    parts[packageIdx],
                    parts[groupIdx],
                    parts[groupIdx + 1],
                    parts[groupIdx + 2],
                    parts[groupIdx + 3],
                    parts[groupIdx + 4],
                    options
                )
            };
        }

        if (parts.length > 7 && parts[groupIdx] === Theme.GroupKey && parts[6] === ThemeMapping.ChildKey) {
            return {
                resourceIdentity: new ResourceIdentityRaw(
                    parts[ownerIdx],
                    parts[packageIdx],
                    parts[groupIdx],
                    undefined,
                    parts[groupIdx + 1],
                    parts[groupIdx + 2],
                    parts.slice(groupIdx + 2).slice(0, parts.length - groupIdx + 2).join('/'),
                    options
                )
            };
        }

        return {

            resourceIdentity: new ResourceIdentityRaw(
                parts[ownerIdx],
                parts[packageIdx],
                parts.slice(groupIdx).slice(0, parts.length - groupIdx - 1).join('/'),
                undefined,
                parts[parts.length - 1],
                undefined,
                undefined,
                options
            )
        };
    }

}
