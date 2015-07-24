/* global CanvasRenderingContext2D */

function chachacat(imagedata, opts) {

  // image data helpers ////////////////////////////////////////////////////

  opts = opts || {};
  var threshold = opts.threshold || 64;

  // This is one of those mistakes I talked myself into and coded before
  // realizing it's a dumb idea. It's going to be in the first commit,
  // but then I'm going to immediately rip it out.
  // It is, essentially, a hack to make squares' areas calculate the exact
  // number of pixels for the square - and everything else is calculated
  // as slightly-to-significantly less, depending on the degree to which
  // the shape is non-uniform.
  var bias = opts.bias === 0 ? 0 : opts.bias || 1;

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

  var iw = imagedata.width;
  var ih = imagedata.height;

  var row = 4*iw;

  // convex hull calculation ///////////////////////////////////////////////

  function loopSide(increment) {
    var chain = [];

    var ix, iy;

    function moveWouldBeCounterClockwise() {
      if (chain.length >= 2) {
        var o = chain[chain.length - 2];
        var ox = o[0], oy = o[1];
        var a = chain[chain.length - 1];
        return ((a[0] - ox) * (iy - oy) -
                (a[1] - oy) * (ix - ox)) <= 0;
      } else return false;
    }

    var xstart, xlimit, ystart, ylimit;

    if (increment > 0) {
      xstart =  0; ystart =  0;
      xlimit = iw; ylimit = ih;
    } else {
      xstart = iw-1; ystart = ih-1;
      xlimit = 1; ylimit = 1;
    }

    for (ix = xstart; ix * increment < xlimit; ix += increment) {
      for (iy = ystart; iy * increment < ylimit; iy += increment) {

        // If we've hit this column's first opaque value
        if (imagedata.data[iy * row + ix*4 + 3] >= threshold) {

          // reduce prior concavities
          while (moveWouldBeCounterClockwise()) {
             chain.pop();
          }
          // add the new furthest-along point
          chain.push([ix, iy]);

          // start the next column
          break;
        }
      }
    }

    return chain;
  }

  // if we didn't get the hull as our input, calculate the hull
  if (!hull) hull = loopSide(1).concat(loopSide(-1));

  // allow for early hull return (mostly for demo / debugging)
  if (opts.returnHull) return hull;

  // area calculation //////////////////////////////////////////////////////

  // 0, 1, or 2-point hulls have the area of their number of pixels
  if (hull.length < 3) return bias * hull.length;

  // push wraparound vertex
  hull.push(hull[0], hull[1]);

  var area = 0;
  for (var i = 1; i < hull.length-2; i++) {
    area += hull[i][0] * (hull[i+1][1] - hull[i-1][1]);
  }
  area /= 2;
  if (bias == 0) {
    return area;
  } else {
    area = Math.sqrt(area)+bias;
    return area*area;
  }
}
