/* global chachacat URL */

var elImage = document.getElementById('source');
var elCanvas = document.createElement('canvas');
var elHullCanvas = document.getElementById('hull');
var elAreaText = document.getElementById('area');
var elPicker = document.getElementById('picker');

var ctxCanvas = elCanvas.getContext('2d');
var ctxHullCanvas = elHullCanvas.getContext('2d');

function calculateFromImage() {
  var w = elImage.width;
  elHullCanvas.width = elCanvas.width = w;
  var h = elImage.height;
  elHullCanvas.height = elCanvas.height = h;

  ctxCanvas.clearRect(0,0,w,h);
  ctxCanvas.drawImage(elImage,0,0);
  ctxHullCanvas.fillStyle = '#fff';
  ctxHullCanvas.fillRect(0,0,w,h);

  var hull = chachacat(ctxCanvas.getImageData(0,0,w,h),{returnHull: true});

  if (hull.length > 0) {
    ctxHullCanvas.fillStyle = '#000';
    ctxHullCanvas.beginPath();
    ctxHullCanvas.moveTo(hull[0][0], hull[0][1]);
    for (var i = 0; i < hull.length; i++) {
      ctxHullCanvas.lineTo(hull[i][0], hull[i][1]);
    }
    ctxHullCanvas.fill();
  }

  elAreaText.textContent = (hull.length > 0) ? chachacat(hull) : '0';
}

elImage.addEventListener('load', calculateFromImage);

if (elImage.complete) calculateFromImage();

elPicker.addEventListener('change', function(evt) {
  elImage.src = URL.createObjectURL(elPicker.files[0]);
});
