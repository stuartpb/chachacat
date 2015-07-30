/* global CanvasRenderingContext2D */

function chachacat(imagedata, opts) {

  // image data helpers ////////////////////////////////////////////////////

  opts = opts || {};
  var threshold = opts.threshold === 0 ? 0 : opts.threshold || 128;

  // The vector of points in our hull.
  var v;

  var w, h, row;

  // complain on no argument
  if (!imagedata) {
    throw new TypeError("No input");

  // arrays are our hull data format
  } else if (Array.isArray(imagedata)) {
    v = imagedata;

  // if we've gotten something that doesn't resemble image data
  } else if (!imagedata.data) {
    // if we can't get image data from it
    if (!(imagedata.getImageData && imagedata.canvas)) {
      // if we can get a context from it
      if (imagedata.getContext) {
        // try getting a 2d rendering context
        imagedata = imagedata.getContext('2d');
      // otherwise, don't even bother trying
      } else {
        throw new TypeError("Can't get image data or hull from input");
      }
    }

    // try getting image data from a render context
    imagedata = imagedata.getImageData(0, 0,
      imagedata.canvas.width, imagedata.canvas.height);
  }

  // convex hull calculation ///////////////////////////////////////////////

  function loopSide(ydir) {
    var xdir = -ydir;
    var chain = [];
    var ex, ey;
    var xdiff = -xdir;

    function moveWouldBeCounterClockwise() {
      if (chain.length > 0) {
        var a = chain[chain.length - 1];
        xdiff = ex - a[0];

        if (chain.length > 1) {
          var o = chain[chain.length - 2];
          var ox = o[0], oy = o[1];
          return ((a[0] - ox) * (ey - oy) -
                  (a[1] - oy) * (ex - ox)) <= 0;
        } else return false;
      } else return false;
    }

    var xstart, xlimit, ystart, ylimit, nedge, fedge;

    if (ydir > 0) {
      xstart = w-1; ystart = 0;   nedge = 0;
      xlimit = 1;   ylimit = h;   fedge = 1;
    } else {
      xstart = 0;   ystart = h-1; nedge = 1;
      xlimit = w;   ylimit = 1;   fedge = 0;
    }

    for (var iy = ystart; iy * ydir < ylimit; iy += ydir) {
      for (var ix = xstart; ix * xdir < xlimit; ix += xdir) {

        // If we've hit this column's first opaque value
        var alpha = imagedata.data[iy * row + ix * 4 + 3];
        if (alpha >= threshold) {
          ex = ix + fedge;
          ey = iy + fedge;

          // reduce prior concavities
          while (moveWouldBeCounterClockwise()) {
            chain.pop();
          }

          // If we're receding toward the edge
          if (xdiff * xdir < 0) {
            // Push the nearer-to-start corner of the pixel
            chain.push([ex, iy + nedge]);
          }

          // add the new furthest-along point
          chain.push([ex, ey]);

          // start the next row
          break;
        }
      }
    }

    return chain;
  }

  // area calculation //////////////////////////////////////////////////////

  // if we didn't get the hull as our input
  if (!v) {

    // ready our width and height values
    w = imagedata.width;
    h = imagedata.height;

    // save a row value if we're going to evaluate thresholds
    if (threshold > 0) {
      row = 4 * w;

    // shortcut area if not actually hulling
    } else {
      return opts.returnHull ? [[0,0], [w,0], [w,h], [0,h]] : w * h;
    }

    // calculate the hull
    v = loopSide(1).concat(loopSide(-1));
  }

  // allow for early hull return (mostly for demo / debugging)
  if (opts.returnHull) return v;

  // if we have a hull that can't define a polygon
  else if (v.length < 3) {

    // nulls and points and lines have an area of zero
    return 0;
  }

  // actually calculate the area of the polygon
  // adapted from http://stackoverflow.com/a/717367/34799
  // itself adapted from http://geomalgorithms.com/a01-_area.html#2D-Polygons

  var n = v.length;
  var last = n - 1;
  var i, j, k;

  // start with the integral of the first quad
  // (which uses the last point's Y as its posterior bound)
  var area = v[0][0] * (v[1][1] - v[last][1]);

  // add the integrals of all intermediate quads
  for (i = 1, j = 2, k = 0; i < last; ++i, ++j, ++k) {
    area += v[i][0] * (v[j][1] - v[k][1]);
  }

  // wrap around to add the integral of the last quad
  // (which uses the first point's Y as its anterior bound)
  area += v[i][0] * (v[0][1] - v[k][1]);

  // return the area of the polygon (half the quads)
  return area /= 2;
}
