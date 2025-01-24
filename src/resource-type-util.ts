import {
    Categorization,
    Clipart,
    DesignerSettings,
    EventsResource,
    Filter,
    Font,
    FormatResource,
    FrameBorder,
    GeneratedImage,
    GridResource,
    ImageBackground,
    Layout,
    LineBorder,
    MaskBorder,
    PrintFinishing,
    Product,
    Redirections,
    RenderingPipelineResource,
    RenderingSettingsResource,
    StockPhoto,
    Style,
    TextGenerationSettings,
    Theme,
    VariableDataDefinition
} from './library-resource-definitions';


export interface IResourceTypeUtil {
    getFilenameForGroupKey(groupKey: string): string
}

export class ResourceTypeUtil implements IResourceTypeUtil {
    static FilenamesByGroupKey: Record<string, string> = {
        [Categorization.GroupKey]: Categorization.Filename,
        [ImageBackground.GroupKey]: ImageBackground.Filename,
        [Clipart.GroupKey]: Clipart.Filename,
        [GridResource.GroupKey]: GridResource.Filename,
        [MaskBorder.GroupKey]: MaskBorder.Filename,
        [LineBorder.GroupKey]: LineBorder.Filename,
        [FrameBorder.GroupKey]: FrameBorder.Filename,
        [Theme.GroupKey]: Theme.Filename,
        [FormatResource.GroupKey]: FormatResource.Filename,
        [Layout.GroupKey]: Layout.Filename,
        [Font.GroupKey]: Font.Filename,
        [StockPhoto.GroupKey]: StockPhoto.Filename,
        [Style.GroupKey]: Style.Filename,
        [Product.GroupKey]: Product.Filename,
        [DesignerSettings.GroupKey]: DesignerSettings.Filename,
        [RenderingSettingsResource.GroupKey]: RenderingSettingsResource.Filename,
        [RenderingPipelineResource.GroupKey]: RenderingPipelineResource.Filename,
        [Redirections.GroupKey]: Redirections.Filename,
        [EventsResource.GroupKey]: EventsResource.Filename,
        [GeneratedImage.GroupKey]: GeneratedImage.Filename,
        [TextGenerationSettings.GroupKey]: TextGenerationSettings.Filename,
        [PrintFinishing.GroupKey]: PrintFinishing.Filename,
        [VariableDataDefinition.GroupKey]: VariableDataDefinition.Filename,
        [Filter.GroupKey]: Filter.Filename,
    };

    getFilenameForGroupKey(groupKey: string): string {
        return ResourceTypeUtil.FilenamesByGroupKey[groupKey];
    }
}
