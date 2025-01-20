import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import vscode from 'vscode';

export interface ILibraryXmlSchemaUtil {
    addLibraryCatalogToConfig(): void;
}

export class LibraryXmlSchemaUtil implements ILibraryXmlSchemaUtil {
    catalog = `<?xml version="1.0"?>
<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog">
    <uri name="Mediaclip.Gifting.Model" uri="https://mc-library-schema.azureedge.net/Gifting.xsd"/>
    <uri name="Mediaclip.Photobook.Model" uri="https://mc-library-schema.azureedge.net/Photobook.xsd"/>
    <uri name="Mediaclip.Print.Model" uri="https://mc-library-schema.azureedge.net/Print.xsd"/>
    <uri name="Mediaclip.Modules.Model" uri="https://mc-library-schema.azureedge.net/Project.xsd"/>
    <uri name="Mediaclip.Modules.Model.Collage" uri="https://mc-library-schema.azureedge.net/Collage.xsd"/>
    <uri name="http://www.mediaclip.ca/schema/xml/library" uri="https://mc-library-schema.azureedge.net/Mediaclip.Library.Schema.xsd"/>
</catalog>
`;

    async addLibraryCatalogToConfig(): Promise<void> {

        const xmlCatalog = vscode.workspace.getConfiguration('xml');
        let catalogFilePath = this.createCatalogFile();

        // Add to existing catalogs if any
        let existingCatalogs = (xmlCatalog.get('catalogs') as string[]) || [];
        existingCatalogs = existingCatalogs.filter(x => !x.includes('mediaclip.library.catalog'));
        const updatedCatalogs = [...existingCatalogs, catalogFilePath];

        console.log('Configuring global catalog files config', updatedCatalogs);
        // Update VSCode XML configuration
        await vscode.workspace.getConfiguration().update('xml.catalogs', updatedCatalogs, vscode.ConfigurationTarget.Global);
    }

    createCatalogFile(): string {
        const tempDir = os.tmpdir();
        let fileName = "mediaclip.library.catalog.v2.xml";
        let filePath = path.join(tempDir, fileName);
        if (fs.existsSync(filePath)) {
            return filePath;
        }
        fs.writeFileSync(filePath, this.catalog);
        return filePath;
    }
}
