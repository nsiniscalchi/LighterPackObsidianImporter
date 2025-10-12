import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, requestUrl } from 'obsidian';
import {listNoteProperties, itemNoteProperties, listNoteBases, listNoteChartsAndDataviewjs} from "formattedStrings"
import { stringify } from 'querystring';

// Remember to rename these classes and interfaces!

interface LighterPackObsidianImporterSettings {
	showRibbonIcon: boolean;
}

const DEFAULT_SETTINGS: LighterPackObsidianImporterSettings = {
	showRibbonIcon: true
}

export default class LighterPackObsidianImporter extends Plugin {
	
	settings: LighterPackObsidianImporterSettings;
	ribbonIconEl: HTMLElement | null = null;

	async onload() {

		await this.loadSettings();

		/*
		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (_evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, _view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});
		*/

		this.addSettingTab(new SettingTab(this.app, this));

		/*
		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
		*/

		this.addCommand({
			id: "import-packing-list-from-url",
			name: "Import a packing list from a lighterpack.com URL",
			callback: () => {
				new UrlPromptModal(this.app, async (url: string) => {
					if (!url) return;
					try {
						const response = await requestUrl({ url });
						const html = response.text;
						HTMLscraper(html);
					} catch (e) {
						new Notice("Unable to import the packing list.\nMore details in the console.");
						console.error(e);
					}
				}).open();
			}
		});

		this.updateRibbonIcon();
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	updateRibbonIcon() {
		// Rimuovo l'icona esistente se presente
		if (this.ribbonIconEl) {
			this.ribbonIconEl.remove();
			this.ribbonIconEl = null;
		}

		// Aggiungo l'icona se l'impostazione è true
		if (this.settings.showRibbonIcon) {
			this.ribbonIconEl = this.addRibbonIcon('backpack', 'Import LighterPack List', () => {
				new UrlPromptModal(this.app, async (url: string) => {
					if (!url) return;
					try {
						const response = await requestUrl({ url });
						const html = response.text;
						HTMLscraper(html);
					} catch (e) {
						new Notice("Unable to import the packing list.\nMore details in the console.");
						console.error(e);
					}
				}).open();
			});
		}
	}
}

/*
class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
*/

class UrlPromptModal extends Modal {

	constructor(app: App, onSubmit: (url: string) => void) {
		super(app);
		
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		let url = "";

		contentEl.createEl("h1", { text: "Inserisci l'URL" });

		contentEl.createEl("div", { cls: "setting-divider" });

		new Setting(contentEl)
			.setName("lighterpack.com URL")
			.addText(text => text
				.setPlaceholder("https://lighterpack.com/r/...")
				.onChange(value => url = value)
			)
			.addButton(btn => btn
				.setButtonText("Import")
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(url);
				})
			);
	}

	onSubmit: (url: string) => void;

	onClose() {
		this.contentEl.empty();
	}
}

class SettingTab extends PluginSettingTab {
	plugin: LighterPackObsidianImporter;

	constructor(app: App, plugin: LighterPackObsidianImporter) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Show Ribbon Icon')
			.setDesc('Show the ribbon icon in the left sidebar')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showRibbonIcon)
				.onChange(async (value) => {
					this.plugin.settings.showRibbonIcon = value;
					await this.plugin.saveSettings();
					this.display();
					this.plugin.updateRibbonIcon();
				})
			);
	}
}

async function HTMLscraper(html: string): Promise<void>{

	let title = "";
	let description = "";
	let categories: string[] = [];
	let itemUnit = "";
	let totalsUnit = "";
	let currency = "";

	try {
		const doc = new DOMParser().parseFromString(html, 'text/html');
		
		let container = doc.querySelector('h1.lpListName');
		if(!container){
			new Notice("Unable to find the packing list title.");
			console.log("h1.lpListName not found");
			return;
		}
		title = container ? (container.textContent || '') : '';
		let folderPath = title.replaceAll(" ", "");
		console.log("Title: " + title);

		this.app.vault.createFolder(folderPath);

		this.app.vault.createFolder(folderPath+'/gear');

		
		container = doc.querySelector('div#lpListDescription');
		if(!container){
			new Notice("Unable to find the packing list description.");
			console.log("div#lpListDescription not found");
			return;
		}
		container = container.querySelector('p');
		description = container ? (container.textContent || '') : '';
		console.log("Description: " + description);

		container = doc.querySelector('span.lpWeightCell.lpNumber');
		if(!container){
			new Notice("Unable to find the packing list items unit.");
			console.log("span.lpWeightCell not found");
			return;
		}

		container = doc.querySelector('span.lpSubtotalUnit');
		if(!container){
			new Notice("Unable to find the packing list totals unit.");
			console.log("span.lpSubtotalUnit not found");
			return;
		}
		totalsUnit = container ? (container.textContent || '') : '';
		console.log("Totals Unit: " + totalsUnit);

		container = doc.querySelector('span.lpPriceCell.lpNumber');
		if(!container){
			new Notice("Unable to find the packing list currency.");
			console.log("span.lpPriceCell not found");
			return;
		}
		currency = container ? (container.textContent.trim().slice(0, 1) || '') : '';
		console.log("Currency: " + currency);

		let nodeList = doc.querySelectorAll('li.lpCategory');
		for(let i=0; i<nodeList.length; i++){
			container = nodeList[i].querySelector('h2');
			if(!container){
				new Notice("Unable to find the packing list category.");
				console.log("h2 not found");
				return;
			}
			categories.push(container ? (container.textContent || '') : '');
			
			this.app.vault.createFolder(folderPath+'/gear/'+categories[i]);

			let nodeList2 = nodeList[i].querySelectorAll('li.lpItem');
			for(let j=0; j<nodeList2.length; j++){
				let itemImage = "";
				let itemName = "";
				let itemDescription = "";
				let itemWorn = false;
				let itemConsumable = false;
				let itemStar1;
				let itemStar2;
				let itemStar3;
				let itemPrice = "";
				let itemWeight = "";
				let itemQty = 0;
				

				container = nodeList2[j].querySelector('span.lpImageCell');
				if(!container){
					new Notice("Unable to find the packing list item image.");
					console.log("span.lpImageCell not found");
					return;
				}
				container = container.querySelector('img');
				itemImage = container ? (container.getAttribute('src') || '') : '';
				
				container = nodeList2[j].querySelector('span.lpName');
				if(!container){
					new Notice("Unable to find the packing list item name.");
					console.log("span.lpName not found");
					return;
				}
				itemName = container ? (container.textContent.trim() || '') : '';
				itemName = itemName.replaceAll(":", "=");

				container = nodeList2[j].querySelector('span.lpDescription');
				if(!container){
					new Notice("Unable to find the packing list item description.");
					console.log("span.lpDescription not found");
					return;
				}
				itemDescription = container ? (container.textContent.trim() || '') : '';
				itemDescription = itemDescription.replaceAll(":", "=");

				container = nodeList2[j].querySelector('i.lpWorn.lpActive');
				if(!container){
					itemWorn = false;
				} else {
					itemWorn = true;
				}
				
				container = nodeList2[j].querySelector('i.lpConsumable.lpActive');
				if(!container){
					itemConsumable = false;
				} else {
					itemConsumable = true;
				}

				container = nodeList2[j].querySelector('span.lpActionsCell');
				let containerCopy = nodeList2[j].querySelector('span.lpActionsCell');
				if(!container || !containerCopy){
					new Notice("Unable to find the packing list actions cell.");
					console.log("span.lpActionsCell not found");
					return;
				}
				container = containerCopy.querySelector('i.lpStar.lpHidden');
				if(!container){
					container = containerCopy.querySelector('i.lpStar1');
					if(!container){
						container = containerCopy.querySelector('i.lpStar2');
						if(!container){
							container = containerCopy.querySelector('i.lpStar3');
							if(!container){
								itemStar1 = false;
								itemStar2 = false;
								itemStar3 = false;
							} else {
								itemStar1 = false;
								itemStar2 = false;
								itemStar3 = true;
							}
						} else {
							itemStar1 = false;
							itemStar2 = true;
							itemStar3 = false;
						}
					} else {
						itemStar1 = true;
						itemStar2 = false;
						itemStar3 = false;
					}
				} else {
					itemStar1 = false;
					itemStar2 = false;
					itemStar3 = false;
				}

				container = nodeList2[j].querySelector('span.lpPriceCell');
				if(!container){
					new Notice("Unable to find the packing list item price.");
					console.log("span.lpPriceCell not found");
					return;
				}
				itemPrice = container ? (container.textContent.trim().slice(1) || '0') : '0';

				container = nodeList2[j].querySelector('span.lpWeight');
				if(!container){
					new Notice("Unable to find the packing list item weight.");
					console.log("span.lpWeight not found");
					return;
				}
				itemWeight = container ? (container.textContent || '0') : '0';

				container = nodeList2[j].querySelector('span.lpDisplay');
				if(!container){
					new Notice("Unable to find the packing list item weight.");
					console.log("span.lpWeight not found");
					return;
				}
				itemUnit = container ? (container.textContent || '0') : '0';


				container = nodeList2[j].querySelector('span.lpQtyCell');
				if(!container){
					new Notice("Unable to find the packing list item quantity.");
					console.log("span.lpQtyCell not found");
					return;
				}
				itemQty = container ? parseInt(container.textContent || '0') : 0;

				const itemNotePropertiesReplaced = itemNoteProperties
					.replace("{{itemName}}", itemName)
					.replace("{{itemDescription}}", itemDescription)
					.replace("{{itemImage}}", itemImage)
					.replace("{{itemCategory}}", categories[i])
					.replace("{{itemWorn}}", itemWorn ? "true" : "false")
					.replace("{{itemConsumable}}", itemConsumable ? "true" : "false")
					.replace("{{itemStar1}}", itemStar1 ? "true" : "false")
					.replace("{{itemStar2}}", itemStar2 ? "true" : "false")
					.replace("{{itemStar3}}", itemStar3 ? "true" : "false")
					.replace("{{currency}}", currency)
					.replace("{{itemPrice}}", itemPrice.toString())
					.replace("{{itemWeight}}", itemWeight.toString())
					.replace("{{itemUnit}}", itemUnit)
					.replace("{{itemQty}}", itemQty.toString());
				this.app.vault.create(folderPath+'/gear/'+categories[i]+'/'+itemName+'.md', itemNotePropertiesReplaced);
			}
		}


		const listNoteChartsAndDataviewjsReplaced = listNoteChartsAndDataviewjs
			.replace("{{folderPath}}", folderPath)
			.replace("{{currency}}", currency)
			.replace("{{totalsUnit}}", totalsUnit)
			.replace("{{categories}}", JSON.stringify(categories));
		await this.app.vault.create(folderPath+'/'+title+'.md', listNoteProperties+listNoteChartsAndDataviewjsReplaced+description);
		
		const filePath = folderPath+'/'+title+'.md';
		const file = this.app.vault.getAbstractFileByPath(filePath);
		if (file && file instanceof TFile) {
			for(let i=0; i<categories.length; i++){	
				const textToAppend = listNoteBases
					.replaceAll("{{folderPath}}", folderPath)
					.replaceAll("{{categories[i]}}", categories[i]);
				const currentContent = await this.app.vault.read(file);
				await this.app.vault.modify(file, currentContent + textToAppend);
			}
		} else {
		console.log("Nota non trovata: " + filePath);
		}

		
	} catch (err) {
		new Notice("Error parsing the packing list HTML.\nMore details in the console.");
		console.error('Error parsing HTML', err);
		return;
	}

}