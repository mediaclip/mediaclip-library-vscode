import vscode, {Range} from 'vscode';
import {IPackageContextUtil} from './package-context-util';
import {IResourceUrlResolver} from './resource-url-resolver';
import {ILibraryPackageUtil} from './library-package-util';
import fs from 'fs';
import doc = Mocha.reporters.doc;

export class PackageReferenceActionProvider implements vscode.CodeActionProvider {
    public static readonly PackageMissingReferenceDiagnosticCode = 'mc:library:missingPackageReference';

    constructor(
        private readonly resourceUrlResolver: IResourceUrlResolver,
        private readonly packageContextUtil: IPackageContextUtil,
        private readonly libraryPackageUtil: ILibraryPackageUtil,
    ) {
    }

    provideCodeActions(
        document: vscode.TextDocument,
        _range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext,
        _token: vscode.CancellationToken
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        let diagnostic = context.diagnostics.find(d => typeof d.code === 'object' && d.code?.value === PackageReferenceActionProvider.PackageMissingReferenceDiagnosticCode);
        if (!diagnostic) {
            return [];
        }

        let packageContext = this.packageContextUtil.getCurrentPackageContextOfDocument(document);
        if (!packageContext) {
            return [];
        }

        let problematicUrl = document.getText(diagnostic.range);
        const resourceUrl = this.resourceUrlResolver.resolveResourceUrl(packageContext, problematicUrl);
        if (!resourceUrl) {
            return [];
        }

        if (this.libraryPackageUtil.isTargetPackagedReferenced(resourceUrl.owner, resourceUrl.package, packageContext)) {
            return [];
        }

        const action = new vscode.CodeAction(
            'Add reference to package.xml',
            vscode.CodeActionKind.QuickFix
        );

        let packageXmlFilePath = this.libraryPackageUtil.getPackageXmlFilePath(packageContext.libraryContext, packageContext.currentPackage);
        action.edit = new vscode.WorkspaceEdit();
        let packageXmlFileUri = vscode.Uri.file(packageXmlFilePath);
        let updatedXml = this.libraryPackageUtil.getPackageXmlContentWithAdditionalReference(packageContext, resourceUrl);
        if (fs.existsSync(packageXmlFilePath)) {
            let content = fs.readFileSync(packageXmlFilePath, {encoding: "utf8"});
            action.edit.replace(packageXmlFileUri, new Range(0, 0, content.length, 0), updatedXml);
        } else {
            action.edit.createFile(packageXmlFileUri, {contents: Buffer.from(updatedXml, 'utf8')});
        }

        action.command = {
            command: 'vscode.open',
            title: 'Refresh',
            arguments: [packageXmlFileUri]
        };
        action.diagnostics = [diagnostic];

        return [action];
    }

    resolveCodeAction?(
        codeAction: vscode.CodeAction,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.CodeAction> {
        return codeAction;
    }

}
