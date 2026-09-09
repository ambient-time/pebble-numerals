// Copyright 2026 Luke Steuber. MIT.
var SYSTEMS = require('./systems');
var PREVIEWS = require('./previews');

function escapeHTML(value) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}

// This function runs in the settings webview, after its controls are present.
function connectSettings(systems, previews, fallback) {
  var system = document.getElementById('system');
  var seconds = document.getElementById('seconds');
  function explain() {
    var row = systems[Number(system.value)];
    var count = Number(seconds.value) ? 3 : 2;
    var time = count === 3 ? '23:59:59' : '10:08';
    var description = row.name + ', ' + count + ' ' + row.layout + ', showing ' + time;
    var preview = document.getElementById('preview');
    preview.src = previews[row.id][Number(seconds.value)];
    preview.alt = description;
    document.getElementById('caption').textContent = 'Example · ' + time + (fallback ? ' · color screen' : '');
    document.getElementById('guide').textContent = row.guide;
  }
  system.onchange = explain;
  seconds.onchange = explain;
  explain();
  document.getElementById('save').onclick = function () {
    location.href = 'pebblejs://close#' + encodeURIComponent(JSON.stringify({
      system: Number(system.value), seconds: Number(seconds.value)
    }));
  };
}

module.exports = function (selection, platform) {
  var fallback = ['basalt', 'diorite', 'emery', 'flint'].indexOf(platform) === -1;
  if (fallback) platform = 'emery';
  var frames = PREVIEWS.frames[platform].map(function (row) {
    return row.map(function (index) { return PREVIEWS.images[index]; });
  });
  var options = SYSTEMS.map(function (row) {
    return '<option value="' + row.id + '"' + (row.id === selection.system ? ' selected' : '') + '>' + escapeHTML(row.name) + '</option>';
  }).join('');
  var data = JSON.stringify(SYSTEMS).replace(/</g, '\\u003c');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1"><title>Numerals</title>' +
    '<style>*{box-sizing:border-box}body{font:18px/1.5 system-ui;max-width:30em;margin:auto;padding:24px;color:#171717;background:#fff}' +
    'select,button{display:block;width:100%;font:inherit;padding:12px;margin:8px 0 20px}' +
    'figure{margin:24px 0;text-align:center}img{display:block;width:auto;height:auto;max-width:100%;margin:0 auto;image-rendering:pixelated}' +
    'figcaption{margin-top:12px;font-size:16px;color:#444}button{background:#171717;color:white;border:0;border-radius:6px}' +
    ':focus-visible{outline:3px solid #007b93;outline-offset:3px}</style></head><body><main><h1>Numerals</h1>' +
    '<label for="system">Numeral system</label><select id="system">' + options + '</select>' +
    '<label for="seconds">Time groups</label><select id="seconds"><option value="1"' + (selection.seconds ? ' selected' : '') +
    '>Hours, minutes, seconds</option><option value="0"' + (!selection.seconds ? ' selected' : '') + '>Hours and minutes</option></select>' +
    '<figure><img id="preview" alt="" width="' + (platform === 'emery' ? 200 : 144) + '" height="' + (platform === 'emery' ? 228 : 168) + '">' +
    '<figcaption id="caption"></figcaption></figure><p id="guide" aria-live="polite"></p>' +
    '<p>Hours use 0–23 in local time. Your choice is saved on the watch. Showing hours and minutes updates once per minute.</p>' +
    '<button id="save">Save to watch</button><p>Luke Steuber · Ambient Time</p></main><script>(' + connectSettings.toString() + ')(' +
    data + ',' + JSON.stringify(frames) + ',' + fallback + ');<\/script></body></html>';
};
