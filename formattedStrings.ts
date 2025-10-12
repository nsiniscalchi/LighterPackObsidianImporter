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
Category: {{itemCategory}}
Worn: {{itemWorn}}
Consumable: {{itemConsumable}}
Star1: {{itemStar1}}
Star2: {{itemStar2}}
Star3: {{itemStar3}}
Price: {{currency}} {{itemPrice}}
Weight: {{itemWeight}} {{itemsUnit}}
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
      - property: itemWeight
        direction: DESC
    columnSize:
      file.name: 420
      note.Description: 520
      note.Worn: 90
      note.Consumable: 110
      note.Price: 110
      note.Weight: 110
      note.Qty: 50
`+"```";