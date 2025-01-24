export type LibraryContext = {
    packagesFolder: string;
}

export type PackageUrl = {
    owner: string;
    package: string;
}

export type PackageContext = {
    libraryContext: LibraryContext;
    currentPackage: PackageUrl;
    defaultPackage: PackageUrl;
    referencedPackages: PackageUrl[];
}
