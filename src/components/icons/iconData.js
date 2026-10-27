// Icon geometry from the design sprite. One source for the React <Icon> and the
// canvas-drawn POI pins in OsmLayers. UI icons sit on a 24px grid, POI glyphs on 10px.
// Each icon is a list of shapes: a string is a path `d`, an array is a circle [cx, cy, r].

export const UI_ICONS = {
  layers:   ['M12 3 3 8l9 5 9-5-9-5zM3 12.5l9 5 9-5M3 16.5l9 5 9-5'],
  sun:      [[12, 12, 4], 'M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6'],
  ruler:    ['M3.5 16.5 16.5 3.5l4 4-13 13zM7.5 12.5l2 2M10.5 9.5l2 2M13.5 6.5l2 2'],
  area:     ['M5 7l9-3 5 6-3 9-9 1z', [5, 7, 1.2], [14, 4, 1.2], [19, 10, 1.2], [16, 19, 1.2], [7, 20, 1.2]],
  eye:      ['M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z', [12, 12, 3]],
  chart:    ['M5 20v-8M10 20V5M15 20v-10M20 20v-5'],
  reset:    ['M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5'],
  search:   [[11, 11, 6.5], 'M16 16l4.5 4.5'],
  plus:     ['M12 5v14M5 12h14'],
  minus:    ['M5 12h14'],
  chev:     ['M6 9l6 6 6-6'],
  close:    ['M6 6l12 12M18 6 6 18'],
  thermo:   ['M10 14.5V5a2 2 0 1 1 4 0v9.5a4 4 0 1 1-4 0z'],
  wind:     ['M3 9h11a3 3 0 1 0-3-3M3 14h15a3 3 0 1 1-3 3M3 19h7'],
  drop:     ['M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0c0-4.3 6-10.5 6-10.5z'],
  pin:      ['M12 21s6.5-6 6.5-11a6.5 6.5 0 0 0-13 0c0 5 6.5 11 6.5 11z', [12, 10, 2.3]],
  up:       ['M7 17 17 7M8 7h9v9'],
  building: ['M6 21V4l8-1.5V21M14 9l4 1.5V21M3 21h18M9 8h2M9 12h2M9 16h2'],
  sunrise:  ['M12 3v5M8.5 5.5 12 2.5l3.5 3M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0'],
  sunset:   ['M12 2.5v5M8.5 5 12 8l3.5-3M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0'],
  check:    ['M5 12.5 10 17.5 19 7'],
  menu:     ['M4 7h16M4 12h16M4 17h16'],
}

export const POI_GLYPHS = {
  hospital:   ['M5 2v6M2 5h6'],
  school:     ['M1 4l4-2 4 2-4 2zM3 5v2.2c1 .9 3 .9 4 0V5'],
  mosque:     ['M2 8V6a3 3 0 0 1 6 0v2M5 1.2v1.2'],
  metro:      ['M2 8V2l3 3 3-3v6'],
  mall:       ['M2.4 3.6h5.2l.5 4.8H1.9zM4 3.6V3a1 1 0 0 1 2 0v.6'],
  park:       ['M5 8.4V5M5 1.6a2.4 2.4 0 0 1 0 4.2a2.4 2.4 0 0 1 0-4.2'],
  hotel:      ['M1.4 8V2.4M1.4 6h7.2V8M8.6 6V4.4H4V6'],
  restaurant: ['M3 1.4v3.2M2 1.4v2a1 1 0 0 0 2 0v-2M3 4.6v4M7 8.6V1.4c-1.2.8-1.6 2-1.6 3.6H7'],
}
