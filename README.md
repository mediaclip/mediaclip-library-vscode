# Mediaclip Library VS Code Extension

A Visual Studio Code extension that enables clickable links in XML files for custom package URLs.

## Features

- Makes package URLs in XML files clickable
- Automatically opens the corresponding theme.xml files
- Supports the format: `$(package:packageName/path)`
- Works with XML files in your workspace

Example:
```xml
<defaultTheme url="$(package:mediaclip-hub-dev/tests)/themes/full-size-photo" />
```
Clicking on this URL will open `tests/themes/full-size-photo/theme.xml` in your workspace.

## Installation

### From VSIX
1. Download the `.vsix` file from the releases
2. In VS Code, press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
3. Type "Install from VSIX" and select the downloaded file

### From Source
1. Clone this repository
2. Run `npm install`
3. Run `npm run package` to create the VSIX file
4. Install using the steps above

## Usage

1. Open any XML file in VS Code
2. URLs matching the pattern `$(package:packageName/path)` will be automatically converted to clickable links
3. Click the link to open the corresponding xml file

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch for changes
npm run watch

# Create VSIX package
npm run package
```

## Requirements

- Visual Studio Code version 1.60.0 or higher
