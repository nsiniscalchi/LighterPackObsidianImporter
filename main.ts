import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile, normalizePath, requestUrl } from "obsidian";
import {regexURL, listNoteProperties, itemNoteProperties, listNoteBases, listNoteChartsAndDataviewjs} from "formattedStrings";
import TurndownService from "turndown";

interface LighterPackObsidianImporterSettings {
	showRibbonIcon: boolean;
}

const DEFAULT_SETTINGS: LighterPackObsidianImporterSettings = {
	showRibbonIcon: true
};

export default class LighterPackObsidianImporter extends Plugin {
	
	settings: LighterPackObsidianImporterSettings;
	ribbonIconEl: HTMLElement | null = null;

	async onload() {

		await this.loadSettings();

		this.addSettingTab(new SettingTab(this.app, this));

		this.addCommand({
			id: "import-packing-list-from-url",
			name: "Import a lighterpack.com list",
			callback: () => {
				new UrlPromptModal(this.app, async (url: string) => {
					if (!url) {return;}
					if(!url.startsWith("https://")){
						url = "https://"+url;
					}
					if(regexURL.test(url) === false){
						new Notice("Invalid URL.\nPlease enter a valid lighterpack.com URL.");
						return;
					}
					try {
						const response = await requestUrl({ url });
						const html = response.text;
						void importList(this.app, html);
					} catch (e) {
						new Notice("Unable to import the packing list.\nMore details in the console.");
						console.error("Unable to import the packing list:\n", e);
					}
				}).open();
			}
		});

		this.updateRibbonIcon();
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) as LighterPackObsidianImporterSettings;
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	updateRibbonIcon() {
		if (this.ribbonIconEl) {
			this.ribbonIconEl.remove();
			this.ribbonIconEl = null;
		}

		if (this.settings.showRibbonIcon) {
			this.ribbonIconEl = this.addRibbonIcon("backpack", "Import a lighterpack.com list", () => {
				new UrlPromptModal(this.app, async (url: string) => {
					if (!url) {return;}
					if(!url.startsWith("https://")){
						url = "https://"+url;
					}
					if(regexURL.test(url) === false){
						new Notice("Invalid URL.\nPlease enter a valid lighterpack.com URL.");
						return;
					}
					try {
						const response = await requestUrl({ url });
						const html = response.text;
						void importList(this.app, html);
					} catch (e) {
						new Notice("Unable to import the packing list.\nMore details in the console.");
						console.error("Unable to import the packing list:\n", e);
					}
				}).open();
			});
		}
	}
}

class UrlPromptModal extends Modal {

	constructor(app: App, onSubmit: (url: string) => Promise<void>) {
		super(app);
		
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		let url = "";

		contentEl.createEl("h1", { text: "Inserisci l'URL" });

		contentEl.createEl("div", { cls: "setting-divider" });

		new Setting(contentEl)
			.setName("Insert a lighterpack.com URL.")
			.addText(text => text
				.setPlaceholder("https://lighterpack.com/r/...")
				.onChange(value => url = value)
			)
			.addButton(btn => btn
				.setButtonText("Import")
				.setCta()
				.onClick(() => {
					this.close();
					void this.onSubmit(url);
				})
			);
	}

	onSubmit: (url: string) => Promise<void>;

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
			.setName("Show ribbon icon")
			.setDesc("Show the ribbon icon in the left sidebar")
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

async function importList(app: App, html: string): Promise<void>{

	let title = "";
	let description = "";
	let itemUnit = "";
	let totalsUnit = "";
	let currency = "";
	let categoryName = "";
	const categories: string[] = [];
	const items: string[] = [];
	
	let duplicatePackingListCounter = 0;

	try {
		const doc = new DOMParser().parseFromString(html, "text/html");
		
		let container = doc.querySelector("h1.lpListName");
		if(!container){
			new Notice("Unable to find the packing list title.");
			return;
		}
		title = container ? (container.textContent || "") : "";
		if(title === ""){
			title = "UnnamedPackingList";
		}

		let folderPath = title.replaceAll(" ", "");
		if(app.vault.getFolderByPath(folderPath) !== null){
			duplicatePackingListCounter++;
			while(app.vault.getFolderByPath(folderPath+"("+duplicatePackingListCounter+")") !== null){
				duplicatePackingListCounter++;
			}
			folderPath = folderPath+"("+duplicatePackingListCounter+")";
		}
		
		container = doc.querySelector("div#lpListDescription");
		if(!container){
			description = "\n\n";
		} else{
			const turndownService = new TurndownService();
			const serializer = new XMLSerializer();
			const innerHtml = Array.from(container.childNodes)
				.map(node => serializer.serializeToString(node))
				.join("")
				.trim();
			const markdownContent = turndownService.turndown(innerHtml);
			description = markdownContent+"\n\n";
		}
		
		container = doc.querySelector("span.lpSubtotalUnit");
		if(!container){
			new Notice("Unable to find the packing list total weight unit.");
			return;
		}
		totalsUnit = container ? (container.textContent || "") : "";

		container = doc.querySelector("span.lpPriceCell.lpNumber");
		if(!container){
			currency = "";
		} else {
			currency = container ? ((container.textContent || "").trim().slice(0, 1) || "") : "";
		}

		await app.vault.createFolder(normalizePath(folderPath));
		await app.vault.createFolder(normalizePath(folderPath+"/gear"));

		const nodeList = doc.querySelectorAll("li.lpCategory");
		for(let i=0; i<nodeList.length; i++){
			categoryName = "";
			container = nodeList[i].querySelector("h2");
			if(!container){
				if(i===0){
					new Notice("Unable to find the first category name.");
				} else if(i===1){
					new Notice("Unable to find the second category name.");
				} else if(i===2){
					new Notice("Unable to find the third category name.");
				} else{
					new Notice("Unable to find the "+(i+1).toString()+"th category name.");
				}
				return;
			}
			categoryName = (container ? (container.textContent || "") : "").trim();
			if(categoryName === ""){
				categoryName = "UnnamedCategory";
			}
			if(categories.includes(categoryName)){
				let k = 1;
				while(categories.includes(categoryName+"("+k+")")){
					k++;
				}
				categoryName = categoryName+"("+k+")";
				categories.push(categoryName);
			} else {
				categories.push(categoryName);
			}

			await app.vault.createFolder(normalizePath(folderPath+"/gear/"+categories[i]));

			const nodeList2 = nodeList[i].querySelectorAll("li.lpItem");
			for(let j=0; j<nodeList2.length; j++){
				let itemImage = "";
				let itemName = "";
				let itemLink = "";
				let itemDescription = "";
				let itemWorn = false;
				let itemConsumable = false;
				let itemStar1 = false;
				let itemStar2 = false;
				let itemStar3 = false;
				let itemPrice = "";
				let itemWeight = "";
				let itemQty = 0;
				
				container = nodeList2[j].querySelector("span.lpImageCell");
				if(!container){
					itemImage = "";
				} else {
					container = container.querySelector("img");
					itemImage = container ? (container.getAttribute("src") || "") : "";
				}
				
				container = nodeList2[j].querySelector("span.lpName");
				if(!container){
					if(j===0){
						new Notice("Unable to find the first item name.");
					} else if(j===1){
						new Notice("Unable to find the second item name.");
					} else if(j===2){
						new Notice("Unable to find the third item name.");
					} else{
						new Notice("Unable to find the "+(j+1).toString()+"th item name.");
					}
					return;
				}
				itemName = container ? ((container.textContent || "").trim() || "") : "";
				itemName = itemName.replaceAll(":", "=");
				if(itemName === ""){
					itemName = "UnnamedItem";
				}
				if(items.includes(itemName)){
					let w = 1;
					while(items.includes(itemName+"("+w+")")){
						w++;
					}
					itemName = itemName+"("+w+")";
					items.push(itemName);
				} else {
					items.push(itemName);
				}

				let containerCopy = nodeList2[j].querySelector("a.lpHref");
				if(!containerCopy){
					itemLink = "";
				} else {
					itemLink = containerCopy ? (containerCopy.getAttribute("href") || "") : "";
				}

				container = nodeList2[j].querySelector("span.lpDescription");
				if(!container){
					if(j===0){
						new Notice("Unable to find the first item description.");
					} else if(j===1){
						new Notice("Unable to find the second item description.");
					} else if(j===2){
						new Notice("Unable to find the third item description.");
					} else{
						new Notice("Unable to find the "+(j+1).toString()+"th item description.");
					}
					return;
				}
				itemDescription = container ? ((container.textContent || "").trim() || "") : "";
				itemDescription = itemDescription.replaceAll(":", "=");
				if(itemDescription === ""){
					itemDescription = "";
				}

				container = nodeList2[j].querySelector("i.lpWorn.lpActive");
				if(!container){
					itemWorn = false;
				} else {
					itemWorn = true;
				}
				
				container = nodeList2[j].querySelector("i.lpConsumable.lpActive");
				if(!container){
					itemConsumable = false;
				} else {
					itemConsumable = true;
				}

				container = nodeList2[j].querySelector("span.lpActionsCell");
				containerCopy = nodeList2[j].querySelector("span.lpActionsCell");
				if(!container || !containerCopy){
					if(j===0){
						new Notice("Unable to find the first item actions cell.");
					} else if(j===1){
						new Notice("Unable to find the second item actions cell.");
					} else if(j===2){
						new Notice("Unable to find the third item actions cell.");
					} else{
						new Notice("Unable to find the "+(j+1).toString()+"th item actions cell.");
					}
					return;
				} else{
					container = containerCopy.querySelector("i.lpStar.lpHidden");
					if(!container){
						container = containerCopy.querySelector("i.lpStar1");
						if(!container){
							container = containerCopy.querySelector("i.lpStar2");
							if(!container){
								container = containerCopy.querySelector("i.lpStar3");
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
				}
				
				container = nodeList2[j].querySelector("span.lpPriceCell");
				if(!container){
					itemPrice = "0";
				} else{
					itemPrice = container ? ((container.textContent || "").trim().slice(1) || "0") : "0";
				}

				container = nodeList2[j].querySelector("span.lpWeight");
				if(!container){
					if(j===0){
						new Notice("Unable to find the first item weight.");
					} else if(j===1){
						new Notice("Unable to find the second item weight.");
					} else if(j===2){
						new Notice("Unable to find the third item weight.");
					} else{
						new Notice("Unable to find the "+(j+1).toString()+"th item weight.");
					}
					return;
				}
				itemWeight = container ? (container.textContent || "0") : "0";

				container = nodeList2[j].querySelector("span.lpDisplay");
				if(!container){
					if(j===0){
						new Notice("Unable to find the first item's weight unit.");
					} else if(j===1){
						new Notice("Unable to find the second item's weight unit.");
					} else if(j===2){
						new Notice("Unable to find the third item's weight unit.");
					} else{
						new Notice("Unable to find the "+(j+1).toString()+"th item's weight unit.");
					}
					return;
				}
				itemUnit = container ? (container.textContent || "0") : "0";

				container = nodeList2[j].querySelector("span.lpQtyCell");
				if(!container){
					if(j===0){
						new Notice("Unable to find the first item quantity.");
					} else if(j===1){
						new Notice("Unable to find the second item quantity.");
					} else if(j===2){
						new Notice("Unable to find the third item quantity.");
					} else{
						new Notice("Unable to find the "+(j+1).toString()+"th item quantity.");
					}
					return;
				}
				itemQty = container ? parseInt(container.textContent || "0") : 0;

				const itemNotePropertiesReplaced = itemNoteProperties
					.replace("{{itemName}}", itemName)
					.replace("{{itemLink}}", itemLink)
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

				await app.vault.create(normalizePath(folderPath+"/gear/"+categories[i]+"/"+itemName+".md"), itemNotePropertiesReplaced);
			}
		}

		const listNoteChartsAndDataviewjsReplaced = listNoteChartsAndDataviewjs
			.replace("{{folderPath}}", normalizePath(folderPath))
			.replace("{{currency}}", currency)
			.replace("{{totalsUnit}}", totalsUnit)
			.replace("{{categories}}", JSON.stringify(categories));
		await app.vault.create(normalizePath(folderPath+"/"+title+".md"), listNoteProperties+listNoteChartsAndDataviewjsReplaced+description);
		
		const filePath = normalizePath(folderPath+"/"+title+".md");
		const file = app.vault.getAbstractFileByPath(filePath);
		if (file && file instanceof TFile) {
			for(let i=0; i<categories.length; i++){	
				const textToAppend = listNoteBases
					.replaceAll("{{folderPath}}", normalizePath(folderPath))
					.replaceAll("{{categories[i]}}", categories[i]);
				const currentContent = await app.vault.read(file);
				await app.vault.modify(file, currentContent + textToAppend);
			}
		}
	} catch (err) {
		new Notice("Error parsing the packing list HTML.\nMore details in the console.");
		console.error("Error parsing HTML:\n", err);
		return;
	}

}