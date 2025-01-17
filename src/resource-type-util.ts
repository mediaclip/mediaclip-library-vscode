export interface IResourceTypeUtil {
    getResourceTypes(): string[];
}

export class ResourceTypeUtil implements IResourceTypeUtil {
    getResourceTypes() {
        return [
            "theme",
            "format",
            "product",
            "categorization",
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
