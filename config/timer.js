const ImageResizer = require('../utils/imageResizer');
const ImageDataCell = require('../models/ImageDataCell');
const Flag = require('../models/Flag');

let flag1 = 1;
let flag2 = 0;

function getScaleCoord(scale, coord) {
  let pow2 = Math.pow(2, scale - 1);
  return coord - (coord % (pow2 * 100)); 
}

/*module.exports = {
  cellUpdateCheckArray: [],

  imageTimer: function( app ) {
    // let cellUpdateCheckArray = [];

    //Image Resizer
    setInterval(() => {
      console.log( this.cellUpdateCheckArray );
      let updateCheckScale2 = {};
      let updateCheckScale3 = {};
      let updateCheckScale4 = {};
      const DB_promises = [];
      for (let i = 0; i < this.cellUpdateCheckArray.length; i++){
        DB_promises.push(ImageDataCell.find({ x_axis: this.cellUpdateCheckArray[i].x_axis, y_axis: this.cellUpdateCheckArray[i].y_axis }).exec());
        updateCheckScale2[`${getScaleCoord(2, this.cellUpdateCheckArray[i].x_axis)},${getScaleCoord(2, this.cellUpdateCheckArray[i].y_axis)}`] = true;
        updateCheckScale3[`${getScaleCoord(3, this.cellUpdateCheckArray[i].x_axis)},${getScaleCoord(3, this.cellUpdateCheckArray[i].y_axis)}`] = true;
        updateCheckScale4[`${getScaleCoord(4, this.cellUpdateCheckArray[i].x_axis)},${getScaleCoord(4, this.cellUpdateCheckArray[i].y_axis)}`] = true;
      }
      this.cellUpdateCheckArray = [];

      Promise.all(DB_promises).then((o) => {
        const promises = []; 
        o.forEach((i) => {
          console.log(i[0].x_axis);
          // console.log(i.y_axis);
          let x = i[0].x_axis;
          let y = i[0].y_axis;
          let data = i[0].data;
          ImageResizer.imageCreater(data, x, y);
        });
        for (const coord in updateCheckScale2) {
          const arr = coord.split(',');
          promises.push(ImageResizer.resizer(2, Number(arr[0]), Number(arr[1])));
        }
        updateCheckScale2 = {};
        return Promise.all(promises);
      }).then(() => {
        const promises = []; 
        for (const coord in updateCheckScale3) {
          const arr = coord.split(',');
          promises.push(ImageResizer.resizer(3, Number(arr[0]), Number(arr[1])));
        }
        updateCheckScale3 = {};
        return Promise.all(promises);
      }).then(() => {
        const promises = []; 
        for (const coord in updateCheckScale4) {
          const arr = coord.split(',');
          promises.push(ImageResizer.resizer(4, Number(arr[0]), Number(arr[1])));
        }
        updateCheckScale4 = {};
        return Promise.all(promises);
      });
 
        
        // for (let i = 0; i < o.length; i++){
        //   ImageResizer.imageCreater(o,);
        // };
      // });

      // let imageDataCells = ImageDataCell.find().exec();
      // imageDataCells.then((o) => {
      //   console.log("flage1");
      //   o.forEach((i) => {
      //     let x = i.x_axis;
      //     let y = i.y_axis;
      //     let data = i.data;
      //     ImageResizer.imageCreater(data, x, y);
      //   });
      // });

      // const promises = [];  
      // for (let i = 0; i < 4000; i += 200){
      //   for (let j = 0; j < 4000; j += 200){
      //     promises.push(ImageResizer.resizer(2, i, j, flag1));
      //   };
      // };
    
      // Promise.all(promises).then(() => {
      //   for (let i = 0; i < 4000; i += 400){
      //     for (let j = 0; j < 4000; j += 400){
      //       ImageResizer.resizer(3, i, j, flag1);
      //     };
      //   };
      // });
      
    }, 60000);
  }
}*/
