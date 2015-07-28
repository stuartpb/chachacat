/* global CanvasRenderingContext2D */

function chachacat(imagedata, opts) {

  // image data helpers ////////////////////////////////////////////////////

  opts = opts || {};
  var threshold = opts.threshold === 0 ? 0 : opts.threshold || 128;

  var hull;

  var w, h, row;

  // complain on no argument
  if (!imagedata) {
    throw new TypeError("No input");

  // arrays are our hull data format
  } else if (Array.isArray(imagedata)) {
    hull = imagedata;

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
  if (!hull) {

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
    hull = loopSide(1).concat(loopSide(-1));

    // allow for early hull return (mostly for demo / debugging)
    if (opts.returnHull) return hull;

    // if we found no pixels, there's no area
    else if (hull.length == 0) return 0;

    // If we're not exposing the hull we made, add a wraparound vertex
    else hull.push(hull[0], hull[1]);

  // if we've been given the hull
  } else {
    // if for some reason we have also been asked to return it
    if (opts.returnHull) {
      // go ahead, be a glorified identity function
      return hull;

    // if we've been given a hull that can't define a polygon
    } else if (hull.length < 3) {
      // nulls and points and lines have an area of zero
      return 0;

    // if we're doing our area calculation on the given hull
    } else {
      // Use a copy of that hull with a wraparound vertex
      hull = hull.concat(hull.slice(0,2));
    }
  }

  // actually calculate the area of the polygon
  // adapted from http://stackoverflow.com/a/717367/34799
  // itself adapted from http://geomalgorithms.com/a01-_area.html#2D-Polygons
  var area = 0;
  for (var i = 1; i < hull.length - 1; i++) {
    area += hull[i][0] * (hull[i+1][1] - hull[i-1][1]);
  }
  return area /= 2;
}
