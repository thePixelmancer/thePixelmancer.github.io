//Buttons
const textureButton = document.querySelector("#texture-upload");
const paletteButton = document.querySelector("#palette-upload");
const submit = document.querySelector("#confirm-button");
const output = document.querySelector("#output");
//texture canvas
const textureCanvas = document.querySelector("#texture-canvas");
const textureCtx = textureCanvas.getContext('2d');
//palette canvas
const paletteCanvas = document.querySelector("#palette-canvas");
const paletteCtx = paletteCanvas.getContext('2d');
//init
const reader = new FileReader();
const texture = new Image();
const palette = new Image();

textureButton.addEventListener('change', uploadTexture);
paletteButton.addEventListener('change', uploadPalette);
submit.addEventListener('click', processImages);

function uploadTexture (e){
  reader.onload = () => {
    texture.src = reader.result;
    texture.onload = () => {
      textureCanvas.width = texture.naturalWidth;
      textureCanvas.height = texture.naturalHeight;
      textureCtx.drawImage(texture, 0,0);
    }
  }
  reader.readAsDataURL(e.target.files[0]);
}
function uploadPalette (e){
  reader.onload = () => {
    palette.src = reader.result;
    palette.onload = () => {
      paletteCanvas.width = palette.naturalWidth;
      paletteCanvas.height = palette.naturalHeight;
      paletteCtx.drawImage(palette, 0,0);
    }
  }
  reader.readAsDataURL(e.target.files[0]);
}
function errorShake(button){
  button.classList.add("shake");
  setTimeout(function(){
    button.classList.remove("shake");
  },400);
} 
function isCanvasBlank(canvas) {
  return !canvas.getContext('2d')
    .getImageData(0, 0, canvas.width, canvas.height).data
    .some(channel => channel !== 0);
}
function processImages(e){
  //get image data
  var textureData = textureCtx.getImageData(0,0,textureCanvas.width,textureCanvas.height);
  var paletteData = paletteCtx.getImageData(0,0,paletteCanvas.width,paletteCanvas.height);
  if(isCanvasBlank(textureCanvas) || isCanvasBlank(paletteCanvas)){
    errorShake(submit);
    return
  }
  //seperate recoloring and variant pixels into objects so i dont have to deal with a lot of numbers in array brackets. Its annoying
  const templatePixels = [];
  for(let i = 0; i<paletteData.width; i++){
    templatePixels[i] = {
      red: paletteData.data[4*i],
      green: paletteData.data[4*i+1],
      blue: paletteData.data[4*i+2],
      alpha: paletteData.data[4*i+3]
    }
  }

  var variants = [];
  var pixelIndex = 0;
  for (let i = 0; i<paletteData.height - 1; i++){
    variants[i] = [];
    for (let j = 0; j<paletteData.width; j++){
      pixelIndex = (i+1) * paletteData.width + j;
      variants[i][j] = {
        "red": paletteData.data[pixelIndex * 4],
        "green": paletteData.data[pixelIndex * 4 + 1],
        "blue": paletteData.data[pixelIndex * 4 + 2],
        "alpha": paletteData.data[pixelIndex * 4 + 3]
      };
    }
  }

  var variantImageData = [];
  for(let i = 0; i<paletteData.height -1; i++){
    variantImageData[i] = Uint8ClampedArray.from(textureData.data); //hell
  }
  //go through texture pixels
  for(let i = 0; i<textureData.data.length/4; i++){
    //go through possible template Pixels
     for(let j = 0; j<templatePixels.length; j++){
       //if they pixels colors match...
      if(textureData.data[4*i] == templatePixels[j].red && textureData.data[4*i+1] == templatePixels[j].green && textureData.data[4*i+2] == templatePixels[j].blue &&textureData.data[4*i+3] == templatePixels[j].alpha)
      {
        //recolor that pixel in the new arrays once per variant
        for(let k = 0; k < paletteData.height - 1; k++){
          variantImageData[k][4*i] = variants[k][j].red;
          variantImageData[k][4*i+1] = variants[k][j].green;
          variantImageData[k][4*i+2] = variants[k][j].blue;
          variantImageData[k][4*i+3] = variants[k][j].alpha;
        }
      }
    }
  }
  //create new canvases, image datas and assign them
  for(let i = 0; i<paletteData.height -1; i++){
    let canvas = document.createElement('canvas');
    canvas.classList.add('output-canvas')
    let ctx = canvas.getContext('2d');
    canvas.width = textureData.width;
    canvas.height = textureData.height;
    let imgData = new ImageData(variantImageData[i],textureData.width,textureData.height);
    ctx.putImageData(imgData,0,0);
    output.append(canvas);
  }



}