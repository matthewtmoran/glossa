/**
 * @ngdoc directive
 * @name md-wavesurfer-audio
 *
 * Directive for playing a set of audio files. This directive is analogous to `<audio>` HTML tag.
 * The audio files, should be specified using the  `md-wavesurfer-source`
 *
 * WaveSurfer properties can be passed in using the prefix : player-* for attributes, e.g. `player-wave-color` is
 * equivalent to WaveSurfer's waveColor option.
 *
 * Must be used as an element.
 *
 * @usage
 * ```html
 * <md-wavesurfer-audio player-wave-color="gray" player-progress-color="black" player-backend="MediaElement">
 *   <md-wavesurfer-source src="source1" title="Title-1"></md-wavesurfer-source>
 *   <md-wavesurfer-source src="source2" title="Title-2"></md-wavesurfer-source>
 *   <md-wavesurfer-source src="source3" title="Title-3"></md-wavesurfer-source>
 *   ...
 *   <md-wavesurfer-source src="sourceN" title="Рассказы о сновидениях"></md-wavesurfer-source>
 * </md-wavesurfer-audio>
 * ```
 *
 * @param string player-* specifies WaveSurfer properties.
 *
 */


angular.module('glossa')
    .directive('mdWavesurferAudio', [
    function () {
        return {

            restrict: 'E',
            templateUrl: 'app/audioSandbox/md-player-audio.partial.html',
            transclude: true,
            controller: 'mdWavesurferAudioController',
            controllerAs: 'audio'
        };
    }
]);