/* global CanvasRenderingContext2D */

function chachacat(imagedata, opts) {

  // image data helpers ////////////////////////////////////////////////////

  opts = opts || {};
  var threshold = opts.threshold || 64;

  var hull;

  if (imagedata instanceof HTMLCanvasElement) {
    imagedata = imagedata.getContext('2d');
  }
  if (imagedata instanceof CanvasRenderingContext2D) {
    imagedata = imagedata.getImageData(0, 0,
      imagedata.canvas.width, imagedata.canvas.height);
  }
  // two-dimensional arrays are our hull data format
  if (Array.isArray(imagedata[0])) {
    hull = imagedata;
  }

  var w = imagedata.width;
  var h = imagedata.height;

  var row = 4 * w;

  // convex hull calculation ///////////////////////////////////////////////

  function loopSide(increment) {
    var chain = [];
    var link = [0,0];

    function moveWouldBeCounterClockwise() {
      if (chain.length > 1) {
        var o = chain[chain.length - 2];
        var ox = o[0], oy = o[1];
        var a = chain[chain.length - 1];
        return ((a[0] - ox) * (link[1] - oy) -
                (a[1] - oy) * (link[0] - ox)) <= 0;
      } else return false;
    }

    function appendLink() {
      // reduce prior concavities
      while (moveWouldBeCounterClockwise()) {
         chain.pop();
      }
      // add the new furthest-along point
      chain.push(link.slice());
    }

    var xstart, xlimit, ystart, ylimit, yedge;

    if (increment > 0) {
      xstart = 0;   ystart = 0;   yedge = 0;
      xlimit = w;   ylimit = h;
    } else {
      xstart = w-1; ystart = h-1;
      xlimit = 1;   ylimit = 1;   yedge = 1;
    }

    for (var ix = xstart; ix * increment < xlimit; ix += increment) {
      for (var iy = ystart; iy * increment < ylimit; iy += increment) {

        // If we've hit this column's first opaque value
        if (imagedata.data[iy * row + ix*4 + 3] >= threshold) {

          link[1] = iy + yedge;

          link[0] = ix;
          appendLink();

          // start the next column
          break;
        }
      }
    }

    // Add node for the far edge of the chain
    if (chain.length > 0) {
      link[0] += increment;
      appendLink();
    }

    return chain;
  }

  // if we didn't get the hull as our input, calculate the hull
  if (!hull) hull = loopSide(1).concat(loopSide(-1));

  // allow for early hull return (mostly for demo / debugging)
  if (opts.returnHull) return hull;

  // area calculation //////////////////////////////////////////////////////

  // 0, 1, or 2-point hulls have the area of their number of pixels
  if (hull.length < 3) return hull.length;

  // push wraparound vertex
  hull.push(hull[0], hull[1]);

  var area = 0;
  for (var i = 1; i < hull.length-2; i++) {
    area += hull[i][0] * (hull[i+1][1] - hull[i-1][1]);
  }
  return area /= 2;
}
