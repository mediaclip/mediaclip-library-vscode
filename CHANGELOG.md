# Change Log

## 1.3.0

- Improve how `default-package` is handled
- Reuse same logic as the backend code to parse the resource urls and resolve the file.
- Add quickfix to add missing reference in package.xml

## 1.1.0

- Automatically register xml validation files to highlight errors in xml files.

## 1.0.0

- Provide link resolution for library resources
- Detect invalid link and report error when the resource is not found.
- Detect when a package reference a resource from another package, but the target package was not referenced in the `package.xml`
