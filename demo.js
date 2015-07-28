/* global chachacat URL */

var threshold = 128;

var transparencyGrid = true;
var gridBgColor = '#666'; // or #ccc
var gridFgColor = '#999'; // or #fff
var gridSize = 8;

var alphaColor = '#000'; // or #FF8000
var alphaAlpha = 1;

var hullFill = '#FF8000'; // or #007FFF
var hullAlpha = 0.5;
var hullCompositeOperation = 'source-over'; // or 'destination-over';
var outlineFirstColor = '#000';
var outlineSecondColor = '#fff';
var outlineDashLength = 4;
var outlineCompositeOperaton = 'source-over';
var outlineAlpha = 1;
var outlineWidth = 2;

var elImage = document.getElementById('source');
var elCanvas = document.createElement('canvas');
var elHullCanvas = document.getElementById('hull');
var elStats = document.getElementById('stats');
var elPicker = document.getElementById('picker');

var ctxCanvas = elCanvas.getContext('2d');
var ctxHullCanvas = elHullCanvas.getContext('2d');

function generateTransparencyGrid () {
  if (gridFgColor && gridSize) {
    elCanvas.width = elCanvas.height = gridSize * 2;
    ctxCanvas.fillStyle = gridBgColor;
    ctxCanvas.fillRect(0, 0, gridSize * 2, gridSize * 2);
    ctxCanvas.fillStyle = gridFgColor;
    ctxCanvas.fillRect(0, 0, gridSize, gridSize);
    ctxCanvas.fillRect(gridSize, gridSize, gridSize * 2, gridSize * 2);
    transparencyGrid = ctxHullCanvas.createPattern(elCanvas, 'repeat');
  } else transparencyGrid = gridBgColor;
}

if (transparencyGrid) generateTransparencyGrid();

function calculateFromImage() {
  var w = elImage.width;
  elHullCanvas.width = elCanvas.width = w;
  var h = elImage.height;
  elHullCanvas.height = elCanvas.height = h;

  ctxCanvas.clearRect(0,0,w,h);
  ctxCanvas.drawImage(elImage,0,0);

  ctxHullCanvas.globalCompositeOperation = 'source-over';
  ctxHullCanvas.globalAlpha = alphaAlpha;
  ctxHullCanvas.clearRect(0,0,w,h);
  ctxHullCanvas.drawImage(elImage,0,0);

  if (alphaColor) {
    ctxHullCanvas.globalCompositeOperation = 'source-in';
    ctxHullCanvas.globalAlpha = 1;
    ctxHullCanvas.fillStyle = alphaColor;
    ctxHullCanvas.fillRect(0,0,w,h);
  }

  var hull = chachacat(ctxCanvas.getImageData(0,0,w,h),
    {threshold: threshold, returnHull: true});

  console.log(hull);

  if (hull.length > 0) {
    ctxHullCanvas.beginPath();
    ctxHullCanvas.moveTo(hull[0][0], hull[0][1]);
    for (var i = 0; i < hull.length; i++) {
      ctxHullCanvas.lineTo(hull[i][0], hull[i][1]);
    }
    ctxHullCanvas.closePath();

    if (hullFill) {
      ctxHullCanvas.globalCompositeOperation = hullCompositeOperation;
      ctxHullCanvas.globalAlpha = hullAlpha;
      ctxHullCanvas.fillStyle = hullFill;
      ctxHullCanvas.fill();
    }

    if (outlineFirstColor) {
      if (outlineDashLength) {
        ctxHullCanvas.setLineDash([outlineDashLength]);
      } else {
        ctxHullCanvas.setLineDash([]);
      }
      ctxHullCanvas.globalCompositeOperation = outlineCompositeOperaton;
      ctxHullCanvas.globalAlpha = outlineAlpha;
      ctxHullCanvas.lineWidth = outlineWidth;
      ctxHullCanvas.stroke();

      if (outlineDashLength && outlineSecondColor) {
        ctxHullCanvas.lineDashOffset = outlineDashLength;
        ctxHullCanvas.strokeStyle = outlineSecondColor;
        ctxHullCanvas.stroke();
      }
    }
  }

  if (transparencyGrid) {
    ctxHullCanvas.globalCompositeOperation = 'destination-over';
    ctxHullCanvas.globalAlpha = 1;
    ctxHullCanvas.fillStyle = transparencyGrid;
    ctxHullCanvas.fillRect(0,0,w,h);
  }

  var area = chachacat(hull);

  elStats.innerHTML = 'Area: ' + area + ' (' + Math.sqrt(area).toFixed(2) +
    '&sup2;) / ' + (100*area / (w*h)).toFixed(2) + '% of ' + w + 'x' + h;
}

elImage.addEventListener('load', calculateFromImage);

if (elImage.complete) calculateFromImage();

elPicker.addEventListener('change', function(evt) {
  elImage.src = URL.createObjectURL(elPicker.files[0]);
});

function testX(legs, opts) {
  legs = legs || 1;
  opts = opts || {};
  var size = legs * 2 + 1;
  var row = size * 4;
  var imagedata = ctxCanvas.createImageData(size, size);
  var i;
  for (i = 0; i < legs; i++) {
    imagedata.data[row*i+i*4+3] = 255;
    imagedata.data[row*i+(size-i-1)*4+3] = 255;
    imagedata.data[row*(size-i-1)+i*4+3] = 255;
    imagedata.data[row*(size-i-1)+(size-i-1)*4+3] = 255;
  }
  imagedata.data[row*legs+legs*4+3] = 255;

  if (opts.putTo) opts.putTo.putImageData(imagedata,0,0);

  return chachacat(imagedata, opts);
}

function testPlus(legs, opts) {
  legs = legs || 1;
  opts = opts || {};
  var size = legs * 2 + 1;
  var row = size * 4;
  var middleRow = row * legs + 3;
  var middleAlpha = legs * 4 + 3;
  var imagedata = ctxCanvas.createImageData(size, size);
  var i;
  for (i = 0; i < legs; i++) {
    imagedata.data[row*i+middleAlpha] = 255;
    imagedata.data[row*(size-i-1)+middleAlpha] = 255;
  }
  for (i = 0; i < size; i++) {
    imagedata.data[middleRow+i*4] = 255;
  }

  if (opts.putTo) opts.putTo.putImageData(imagedata,0,0);

  return chachacat(imagedata, opts);
}

function testO(edge, steps, opts) {
  edge = edge || 1;
  steps = steps || 0;
  opts = opts || {};
  var size = steps * 2 + edge + 2;
  var row = size * 4;
  var bottom = row * (size - 1);
  var right = row - 1;
  var stepedge = steps + 1;
  var imagedata = ctxCanvas.createImageData(size, size);
  var i;
  for (i = 0; i < edge; i++) {
    imagedata.data[(stepedge+i)*4+3] = 255;
    imagedata.data[row*(stepedge+i)+3] = 255;
    imagedata.data[row*(stepedge+i)+right] = 255;
    imagedata.data[bottom+(stepedge+i)*4+3] = 255;
  }
  for (i = 0; i < steps; i++) {
    imagedata.data[row*(i+1)+(steps-i)*4+3] = 255;
    imagedata.data[row*(i+2)-(stepedge-i)*4+3] = 255;
    imagedata.data[bottom-(i+1)*row+(steps-i)*4+3] = 255;
    imagedata.data[bottom-i*row-(stepedge-i)*4+3] = 255;
  }

  if (opts.putTo) opts.putTo.putImageData(imagedata,0,0);

  return chachacat(imagedata, opts);
}
