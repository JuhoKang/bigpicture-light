const buttonPencilStyle = document.getElementById('pencilStyle');
const buttonBrushStyle = document.getElementById('brushStyle');

const colorPicker = $('#colorpicker').spectrum({ color: '#000' });

let lineWidthSlider = document.getElementById('lineWidthSlider');

noUiSlider.create(lineWidthSlider, {
  start: [1],
  connect: [true, false],
  format: {
    to(value) {
      return Math.round(value);
    },
    from(value) {
      return value;
    },
  },
  range: {
    min: 1,
    max: 50,
  },
});

let inputLineWidth = document.getElementById('inputLineWidth');
inputLineWidth.value = lineWidthSlider.noUiSlider.get();
lineWidthSlider.noUiSlider.on('change', (e) => {
  brushStyle.width = e;
  console.log(brushStyle.name);
  console.log(brushStyle.width);
});
lineWidthSlider.noUiSlider.on('update', (e) => {
  inputLineWidth.value = e;
});
inputLineWidth.addEventListener('change', () => {
  lineWidthSlider.noUiSlider.set([this.value]);
});

/*buttonPencilStyle.onclick = () => {
  currentStyleChange = {};
  currentStyleChange.shadowBlur = 0;
  console.log('here');
  console.log(currentStyleChange);
};*/


setPencilStyle();

buttonPencilStyle.onclick = setPencilStyle();
function setPencilStyle() {
  brushStyle.name = 'pencil';
  currentStyleChange.lineJoin = 'round';
  currentStyleChange.lineCap = 'round';
}

buttonBrushStyle.onclick = () => {
  brushStyle.name = 'brush';
};

$('#colorpicker').on('move.spectrum', (e, tinycolor) => {
  console.log(e);
  console.log(tinycolor.toHexString());
  current.color = tinycolor.toHexString();
  currentStyleChange.shadowColor = tinycolor.toHexString();
});
