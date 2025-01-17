export type LibraryContext = {
    packagesFolder: string;
    currentPackage: PackageUrl;
    defaultPackage: PackageUrl;
    referencedPackages: PackageUrl[];
}

export type PackageUrl = {
    owner: string;
    package: string;
}
