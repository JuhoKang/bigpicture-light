
// const fs = require('fs');
const Canvas = require('canvas');
const fs = require('fs');
const Image = Canvas.Image;
const ImageData = Canvas.ImageData;
const ImageDataCell = require('../models/ImageDataCell');


//promise 프로미스!
function asyncRead ([x, y]){
  return new Promise(function(resolve, reject) {
      fs.readFile(__dirname + '/../data/image' + x + 'c' + y , function(err, data){
        if (err) reject('not find file');
        let img = new Image;
        img.src = data;
        ctx.drawImage(img, 0, 0, 100, 100);
        resolve([x, y]);
      });
  });
}


module.exports = {

  imageCreater(inputdata, x, y) {
    const canvas = new Canvas(100, 100);
    const ctx = canvas.getContext('2d');

    let imgUint8Data = Uint8ClampedArray.from(JSON.parse(inputdata));
    let imgData;
    imgData = new ImageData(imgUint8Data, 100, 100);

    // imgData = new Image(imgUint8Data, 100, 100);
    ctx.putImageData(imgData, 0, 0);

    let data = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");
    let buf = new Buffer(data, 'base64');
    fs.writeFileSync(__dirname + '/../data/1sc1f' + x + 'c' + y, buf);    
  },

  resizer(scale, x, y){

    // 새 캔버스 
    const canvas = new Canvas(100, 100);
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // 컨텍스트 리셋
    ctx.beginPath();
    //let Math.pow(0.5, scale);
    ctx.scale(0.5, 0.5);

    //동기
    const img = new Image;
    let syncData;
    try{
      syncData = fs.readFileSync(__dirname + '/../data/' + (scale-1) + 'sc1f' + x + 'c' + y);
      img.src = syncData;
      ctx.drawImage(img, 0, 0, 100, 100);
    }catch (e){
    }

    try{
      syncData = fs.readFileSync(__dirname + '/../data/' + (scale-1) + 'sc1f' + x + 'c' + (y + (100 * (Math.pow(2,scale - 2)))));  
      img.src = syncData;
      ctx.drawImage(img, 0, 100, 100, 100);
    }catch (e){
    }
    
    try{
      syncData = fs.readFileSync(__dirname + '/../data/' + (scale-1) + 'sc1f' + (x + (100 * (Math.pow(2,scale - 2))) + 'c' + y));
      img.src = syncData;
      ctx.drawImage(img, 100, 0, 100, 100);
    }catch (e){
    }
    

    try{
      syncData = fs.readFileSync(__dirname + '/../data/' + (scale-1) + 'sc1f' + (x + (100 * (Math.pow(2,scale - 2)))) + 'c' + (y + (100 * (Math.pow(2,scale - 2)))));
      img.src = syncData;
      ctx.drawImage(img, 100, 100, 100, 100);
    }catch (e){
    }

    return new Promise((resolve, reject) => {
      const data = canvas.toDataURL().replace(/^data:image\/\w+;base64,/, "");
      const buf = new Buffer(data, 'base64');
      fs.writeFile(__dirname + '/../data/' + scale + 'sc1f' + x + 'c' + y, buf, () => {
        resolve();
      });
    });
  }


}