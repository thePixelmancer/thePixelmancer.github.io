const slika = document.getElementsByClassName("right-half")[0];

//slika viteza mouseover efekat
document.addEventListener("mousemove", (e) => {
    if (e.target == slika) {
        slika.style.backgroundPositionX = -e.offsetX/30 + "px";
        slika.style.backgroundPositionY = -e.offsetY/30 + "px";
    }
})

//crtanje

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const clearButton = document.getElementsByTagName("input")[1];
const colorPicker = document.getElementsByTagName("input")[0];
const resPicker = document.getElementsByTagName("input")[2];
console.log(resPicker);

var resolution = 16;
var pixelSize = canvas.width/resolution;


resPicker.addEventListener("change",(e) => {
    resolution = resPicker.value;
    pixelSize = canvas.width/resolution;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
});

function handleCanvasMousedown(e){
    var pixelX = Math.floor((e.offsetX / canvas.width) * resolution);
    var pixelY = Math.floor((e.offsetY / canvas.height) * resolution);
    console.log(pixelX);
    console.log(pixelY);
    fillCell(pixelX,pixelY);
}

function clearButtonClick(e){
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function fillCell(x,y){
    ctx.fillStyle = colorPicker.value,
    ctx.fillRect(x*pixelSize,y*pixelSize,pixelSize,pixelSize);
}
canvas.addEventListener("mousedown", handleCanvasMousedown);
clearButton.addEventListener("mousedown", clearButtonClick);
