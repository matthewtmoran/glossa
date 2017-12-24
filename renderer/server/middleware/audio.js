

function extractPeaks(req, res, next) {
  let context = new AudioContext();

}


function getPeaks(audioBuffer, length) {
  var buffer = audioBuffer;
  var sampleSize = buffer.length / length;
  var sampleStep = ~~(sampleSize / 10) || 1;
  var channels = buffer.numberOfChannels;
  var peaks = new Float32Array(length);

  for (var c = 0; c < channels; c++) {
    var chan = buffer.getChannelData(c);
    for (var i = 0; i < length; i++) {
      var start = ~~(i * sampleSize);
      var end = ~~(start + sampleSize);
      var max = 0;
      for (var j = start; j < end; j += sampleStep) {
        var value = chan[j];
        if (value > max) {
          max = value;
          // faster than Math.abs
        } else if (-value > max) {
          max = -value;
        }
      }
      if (c == 0 || max > peaks[i]) {
        peaks[i] = max;
      }
    }
  }

  return peaks;
}

module.exports = {
  extractPeaks: extractPeaks
};