export interface IResourceTypeUtil {
    getResourceTypes(): string[];
}

export class ResourceTypeUtil implements IResourceTypeUtil {
    getResourceTypes() {
        return [
            "categorization",
            "theme",
            "format",
            "product",
            "layout",
            "font",
            "photo",
            "beautyshot",
            "clipart",
            "composition",
            "designer",
            "rendering",
            "mask",
            "grid",
        ]
    }
}
