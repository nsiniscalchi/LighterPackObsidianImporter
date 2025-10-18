export const listNoteProperties =
`---
cssclasses: lighterpack-list
---
`;

export const itemNoteProperties =
`---
Name: {{itemName}}
Description: {{itemDescription}}
Image: {{itemImage}}
Link: {{itemLink}}
Category: {{itemCategory}}
Worn: {{itemWorn}}
Consumable: {{itemConsumable}}
Star1: {{itemStar1}}
Star2: {{itemStar2}}
Star3: {{itemStar3}}
Price: {{currency}} {{itemPrice}}
Weight: {{itemWeight}} {{itemUnit}}
Qty: {{itemQty}}
---
`;

export const listNoteBases ="\n```base\n"+
`filters:
  and:
    - file.inFolder("{{folderPath}}/gear")
views:
  - type: table
    name: {{categories[i]}}
    filters:
      and:
        - file.inFolder("{{folderPath}}/gear/{{categories[i]}}")
    order:
      - file.name
      - Description
      - Worn
      - Consumable
      - Price
      - Weight
      - Qty
    sort:
      - property: itemName
        direction: ASC
    columnSize:
      file.name: 420
      note.Description: 520
      note.Worn: 90
      note.Consumable: 110
      note.Price: 110
      note.Weight: 110
      note.Qty: 50
`+"```";

export const listNoteChartsAndDataviewjs = "\n```dataviewjs\n"+
`const parseQty = (qty) => qty ? parseInt(qty.toString()) : 1;
const parseWeight = (weight) => weight ? parseFloat(weight.toString().split(" ")[0]) : 0;
const parseItemUnit = (weight) => weight ? (weight.toString().split(" ")[1]) : " ";
const parsePrice = (price) => price ? parseFloat(price.toString().split(" ")[1]) : 0;

const pages = dv.pages('"{{folderPath}}/gear"').where(page => page.Weight !== undefined && page.Price !== undefined);

if(pages.length === 0){
  const container = dv.container.createEl('div', { cls: 'lp-container' });
  container.createEl('p', { text: 'No items found in the packing list.' });
} else{
  let categoriesData = {};
  let totalWeight = 0, totalPrice = 0, consumableWeight = 0, wornWeight = 0;
  let currencySymbol = '{{currency}}', weightUnit = '{{totalsUnit}}';

  for (const page of pages) {
      const category = page.Category;
      const qty = parseQty(page.Qty);
      const weight = parseWeight(page.Weight)*qty;
      const itemUnit = parseItemUnit(page.Weight);
      const price = parsePrice(page.Price);

      let weightConverted;
      
      if(itemUnit == 'g' && weightUnit == 'g'){
        weightConverted = weight;
      } else if(itemUnit == 'g' && weightUnit == 'kg'){
        weightConverted = weight/1000;
      } else if(itemUnit == 'g' && weightUnit == 'oz'){
        weightConverted = weight/28.3495;
      } else if(itemUnit == 'g' && weightUnit == 'lb'){
        weightConverted = weight/453.592;
      } else if(itemUnit == 'kg' && weightUnit == 'g'){
        weightConverted = weight*1000;
      } else if(itemUnit == 'kg' && weightUnit == 'kg'){
        weightConverted = weight
      } else if(itemUnit == 'kg' && weightUnit == 'oz'){
        weightConverted = weight*35.27396195;
      } else if(itemUnit == 'kg' && weightUnit == 'lb'){
        weightConverted = weight*2.2046226218;
      } else if(itemUnit == 'oz' && weightUnit == 'g'){
        weightConverted = weight*28.3495;
      } else if(itemUnit == 'oz' && weightUnit == 'kg'){
        weightConverted = weight/35.27396195;
      } else if(itemUnit == 'oz' && weightUnit == 'oz'){
        weightConverted = weight
      } else if(itemUnit == 'oz' && weightUnit == 'lb'){
        weightConverted = weight/16;
      } else if(itemUnit == 'lb' && weightUnit == 'g'){
        weightConverted = weight*453.592;
      } else if(itemUnit == 'lb' && weightUnit == 'kg'){
        weightConverted = weight/2.2046226218;
      } else if(itemUnit == 'lb' && weightUnit == 'oz'){
        weightConverted = weight*16;
      } else if(itemUnit == 'lb' && weightUnit == 'lb'){
        weightConverted = weight;
      }

      totalWeight += weightConverted;
      totalPrice += price;
      if (page.Consumable) consumableWeight += weightConverted;
      if (page.Worn) wornWeight += weightConverted;

      if (!categoriesData[category]) {
          categoriesData[category] = { weight: 0, price: 0 };
      }
      categoriesData[category].weight += weightConverted;
      categoriesData[category].price += price;
  }

  const baseWeight = totalWeight - consumableWeight - wornWeight;
  const sortedCategories = {{categories}};

  const chartColors = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#9C27B0', '#FF6D00', '#009688', '#3F51B5', '#CDDC39', '#00BCD4', '#FF4081', '#795548']

  const chartData = {
      type: 'doughnut',
      data: {
          labels: sortedCategories,
          datasets: [{
              data: sortedCategories.map(cat => categoriesData[cat].weight.toFixed(2)),
              backgroundColor: chartColors,
              borderColor: '#FFF',
              borderWidth: 2,
          }]
      },
      options: {
          responsive: true,
          cutout: '70%',
          plugins: {
              legend: {
                  display: false
              }
          }
      }
  };

  dv.container.innerHTML = "";

  const container = dv.container.createEl('div', { cls: 'lp-container' });
  const chartCol = container.createEl('div', { cls: 'lp-chart-col' });
  const tableCol = container.createEl('div', { cls: 'lp-table-col' });

  if (app.plugins.plugins['obsidian-charts']) {
      window.renderChart(chartData, chartCol);
  } else {
      chartCol.setText("Plugin 'Obsidian Charts' non trovato. Per favore, installalo e abilitalo.");
  }

  const table = tableCol.createEl('table', { cls: 'lp-table' });
  table.createEl('thead').createEl('tr').innerHTML = "<th>Category</th><th>Price</th><th>Weight</th>";
  const tbody = table.createEl('tbody');
  sortedCategories.forEach((cat, index) => {`+
    "tbody.createEl('tr').innerHTML = `<td><span class='lp-color-box' style='background-color: ${chartColors[index % chartColors.length]}'></span>${cat}</td><td>${currencySymbol} ${categoriesData[cat].price.toFixed(2)}</td><td>${categoriesData[cat].weight.toFixed(2)} ${weightUnit}</td>`;});\n"+
    "tbody.createEl('tr', { cls: 'lp-total-row' }).innerHTML = `<td><strong>Total</strong></td><td><strong>${currencySymbol} ${totalPrice.toFixed(2)}</strong></td><td><strong>${totalWeight.toFixed(2)} ${weightUnit}</strong></td>`;\n"+
    "tbody.createEl('tr', { cls: 'lp-summary-row' }).innerHTML = `<td><strong>Consumable</strong></td><td></td><td>${consumableWeight.toFixed(2)} ${weightUnit}</td>`;\n"+
    "tbody.createEl('tr', { cls: 'lp-summary-row' }).innerHTML = `<td><strong>Worn</strong></td><td></td><td>${wornWeight.toFixed(2)} ${weightUnit}</td>`;\n"+
    "tbody.createEl('tr', { cls: 'lp-summary-row' }).innerHTML = `<td><strong>Base Weight</strong></td><td></td><td>${baseWeight.toFixed(2)} ${weightUnit}</td>`;\n"+
"}\n```\n";