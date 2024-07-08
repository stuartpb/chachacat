# chachacat

Chained Hulling Algorithm for Convex Hull Area of Canvas Alpha Threshold

![Convex hull demo](https://cloud.githubusercontent.com/assets/572196/8876272/812cac00-31d3-11e5-900f-8322b41f294e.png)

This function calculates the [convex hull][] of pixels in a given image's alpha
channel (above a certain threshold - 64 by default) and returns the area of
that hull.

[convex hull]: https://en.wikipedia.org/wiki/Convex_hull

This yields a decent approximation of the image content's area, in terms of
space occupied by the image. This can then be used for, say, normalizing the
size of icons on a menu, rather than [trusting developers to figure out][1],
which, in practice, doesn't really work.

[1]: https://developer.chrome.com/docs/webstore/images#icon-size
