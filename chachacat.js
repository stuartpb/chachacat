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

    var xstart, xlimit, ystart, ylimit, nedge, fedge;

    if (increment > 0) {
      xstart = 0;   ystart = 0;   nedge = 0;
      xlimit = w;   ylimit = h;   fedge = 1;
    } else {
      xstart = w-1; ystart = h-1; nedge = 1;
      xlimit = 1;   ylimit = 1;   fedge = 0;
    }

    var lastWasCloser = false;

    for (var ix = xstart; ix * increment < xlimit; ix += increment) {
      for (var iy = ystart; iy * increment < ylimit; iy += increment) {

        // If we've hit this column's first opaque value
        if (imagedata.data[iy * row + ix*4 + 3] >= threshold) {
          // if there are at least two points to compare with
          if (chain.length > 1) {
            // if we're closer to our probe edge than the last pixel
            if ((iy + nedge) * increment < link[1] * increment) {
              // use the nearer-to-start corner of this pixel
              link[0] = ix + nedge;
              // note that we got closer
              lastWasCloser = true;
            // if we're further from our probe edge than the last pixel
            } else {
              // if the last pixel used only the near-to-start edge
              if (lastWasCloser) {
                // push the far-from-start corner of the apex pixel
                chain.push([link[0]+increment, link[1]]);
                // note that we got farther
                lastWasCloser = false;
              }
              // use the far-from-start corner of this pixel
              link[0] = ix + fedge;
            }
            // note the edge that we're colliding with
            link[1] = iy + nedge;
            // reduce prior concavities
            while (moveWouldBeCounterClockwise()) {
               chain.pop();
            }
            // add the new furthest-along point
            chain.push(link.slice());
          // if there aren't nodes on the chain yet
          } else {
            // Record current height
            link[1] = iy + nedge;
            // Push both corners of this pixel on this edge
            chain.push([ix + nedge, link[1]], [ix + fedge, link[1]]);
          }

          // start the next column
          break;
        }
      }
    }

    // if the last pixel used only the near-to-start corner
    if (lastWasCloser) {
      // push the far-from-start corner of the last pixel
      chain.push([link[0]+increment, link[1]]);
    }

    return chain;
  }

  // if we didn't get the hull as our input, calculate the hull
  if (!hull) hull = loopSide(1).concat(loopSide(-1));

  // allow for early hull return (mostly for demo / debugging)
  if (opts.returnHull) return hull;

  // area calculation //////////////////////////////////////////////////////

  // if no opaque pixels were found, the area is zero
  if (hull.length == 0) return 0;

  // push wraparound vertex
  hull.push(hull[0], hull[1]);

  var area = 0;
  for (var i = 1; i < hull.length-2; i++) {
    area += hull[i][0] * (hull[i+1][1] - hull[i-1][1]);
  }
  return area /= 2;
}
