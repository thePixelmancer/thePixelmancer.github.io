
fetch('../data/item_texture.json')
    .then(function(resp) {
        return resp.json();
    })
    .then(function(data) {
        processItems(data);
    });



class Item {
    constructor (shortName,texture,id) {
        this.shortName = shortName;
        this.texture = texture;
        this.id = id;
    }
}
const itemsDiv = document.getElementById('items');

function processItems(data) {
    var itemList = Object.entries(data.texture_data);
    console.log(itemList);
    var items = [];
    for (let i = 0; i < itemList.length; i++) {
        if (Array.isArray(itemList[i][1].textures) == false) {
            items[i] = new Item(itemList[i][0],itemList[i][1].textures,i);
        }
        else {
            items[i] = new Item(itemList[i][0],itemList[i][1].textures[0],i);
        }
        let newItem = document.createElement('div');
        let newItemURL = '../data/vanilla_items/' + items[i].texture + '.png';
        newItem.className = 'item-slot';
        newItem.style.backgroundImage = 'url('+newItemURL+')';
        newItem.setAttribute('draggable','true');
        itemsDiv.append(newItem);
    }
    console.log(items);























}


