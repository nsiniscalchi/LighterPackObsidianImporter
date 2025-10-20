# LighterPack importer for Obsidian

![GitHub release (latest by date)](https://img.shields.io/github/v/release/nsiniscalchi/LighterPackObsidianImporter?style=flat-square)

Import and manage packing lists from [lighterpack.com](https://lighterpack.com) directly in your Obsidian vault.

This plugin converts a shared LighterPack packing list -including categories, items, weights, and chart- into a structured collection of Markdown notes and a summary page.  
It provides an easy way to keep your gear lists locally organized and accessible offline.

## How it Works

![LighterPack importer Demo](https://github.com/nsiniscalchi/LighterPackObsidianImporter/raw/master/Assets/pluginDemo.gif)

## Features

- **Import from the Web:** Retrieve any public LighterPack list using its share link.
- **Automatic Note Structure:** The plugin creates folders for your packing list categories and individual notes for each item.
- **Summary Page:** A main note reproduces the LighterPack overview, including totals, category breakdowns, and a weight distribution pie chart.
- **Offline Access:** Imported lists are stored locally in Markdown format and can be linked, searched, or modified like any other note.
- **Minimal Setup:** Works entirely within your vault—no external API keys or dependencies required.

## How to Use

You can start an import in two ways:

1. **Via the Ribbon Icon:** Click the **backpack icon** in the left sidebar.  
2. **Via the Command Palette:** Open the palette (`Ctrl+P` or `Cmd+P`) and run the command  
**`LighterPack importer: Import a lighterpack.com list`**.

Then:

1. Open your packing list on [lighterpack.com](https://lighterpack.com) (or any shared link found online).  
2. Copy the share link (e.g. `https://lighterpack.com/r/xxxxxx`).  
3. Paste the link into the modal window's text field.  
4. Click **“Import”**.

The plugin will generate a new folder with your summary note and the related individual item notes grouped by category.


## Installation

> **Note:** The plugin is pending submission to the Obsidian Community Plugin Browser.  
> Until it’s approved, you can install it manually using the steps below.  
>  
> **Requirements:**
> - Obsidian v1.9.10 or newer.
> - Internet connection (only required during import)  
>
> **Optional (for full functionality):**  
> - [Dataview](https://github.com/blacksmithgu/obsidian-dataview) — used to dinamically display totals summary table
> - [Charts](https://obsidian.md/plugins?id=obsidian-charts) — required to render the pie chart in the summary note  

### Manual Installation

1. Go to the [Releases page](https://github.com/nsiniscalchi/LighterPackObsidianImporter/releases).  
2. Download the latest `main.js`, `styles.css`, and `manifest.json` files.  
3. Create a new folder in your vault directory under  
`YOUR-VAULT-FOLDER/.obsidian/plugins/LighterPackImporter`.  
4. Copy the downloaded files into that folder.
5. Enable the plugin from **Settings** → **Community Plugins**.
