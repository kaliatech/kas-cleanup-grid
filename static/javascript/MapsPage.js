/* global google */
/* global jQuery */
/* global _ */

(function(KAS, $, navigator) {
  "use strict";


  KAS.MapsPage = function(pageCfg, notifier, firebaseSrvc) {
    this.notifier = notifier
    this.firebaseSrvc = firebaseSrvc
    this.mapEl = document.getElementById('map')

    this.tryToUseGeoLocation = false

    this.defaultLat = 35.6605
    //this.defaultLat = 35.661111
    this.defaultLon = -78.75925
    this.defaultZoom = 20.11

    this.defaultGridSize = 0.00005;

    this.currentGridSize = this.defaultGridSize;

    this.currBounds = null;
    this.latGridLines = [];
    this.lonGridLines = [];


    this.mapDataService = new KAS.MapDataService(notifier, firebaseSrvc, this.mapEl)
  }

  KAS.MapsPage.prototype.init = function() {}

  KAS.MapsPage.prototype.initMap = function() {
    if (this.tryToUseGeoLocation) {
      if (!("geolocation" in navigator)) {
        this.notifier.show({ icon: 'error', txt: 'This browser does not support geolocation api.', autoClose: 2000 })
        setTimeout(() => {
          this.displayBaseMap
        }, 2000)
      }
      else {
        this.notifier.show({
          txt: 'Getting geo location',
          icon: 'refresh',
          spin: true
        })

        let geo_options = {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: 5000
        };

        let wpid = navigator.geolocation.getCurrentPosition(
          (position) => {
            this.currentLat = position.coords.latitude
            this.currentLon = position.coords.longitude

            this.displayBaseMap()
          },
          (error) => {
            this.notifier.show({ icon: 'error', txt: 'Unable to get current geolocation information.', autoClose: 2000 })
            console.log('Unable to get current geolocation information.', error)
            this.displayBaseMap()
          },
          geo_options);
      }
    }
    else {
      this.displayBaseMap()
    }
  }

  KAS.MapsPage.prototype.displayBaseMap = function() {

    this.notifier.show({
      txt: 'Loading map',
      icon: 'refresh',
      spin: true,
      autoClose: 2000
    })

    this.currentLat = this.currentLat || this.defaultLat
    this.currentLon = this.currentLon || this.defaultLon

    this.map = new google.maps.Map(this.mapEl, {
      zoom: this.defaultZoom,
      center: new google.maps.LatLng(this.currentLat, this.currentLon),
      mapTypeId: 'hybrid',
      scaleControl: true
    })



    // Not sure if debouncing is really needed
    let debouncedDrawGridLines = _.debounce(() => this.drawGridLines(), 100)
    google.maps.event.addListener(this.map, 'bounds_changed', () => {
      debouncedDrawGridLines()
    })

    // google.maps.event.addListener(this.map, 'zoom_changed', () => {
    // })

    google.maps.event.addListener(this.map, 'click', (evt) => {
      //console.log('click', evt)
      this.mapDataService.onClick(evt.latLng.lat(), evt.latLng.lng())
    })

    this.mapDataService.init(this.map, this.currentGridSize, this.defaultLat, this.defaultLon);
  }

  KAS.MapsPage.prototype.drawGridLines = function() {
    this.currBounds = this.map.getBounds();

    let currZoom = this.map.getZoom()
    if (currZoom < 19) {
      this.currentGridSize = this.defaultGridSize * 2
    }
    else {
      this.currentGridSize = this.defaultGridSize
    }


    // remove any existing lines from the map
    for (var i = 0; i < this.latGridLines.length; i++) {
      this.latGridLines[i].setMap(null);
    }
    this.latGridLines = [];
    for (var i = 0; i < this.lonGridLines.length; i++) {
      this.lonGridLines[i].setMap(null);
    }
    this.lonGridLines = [];

    // don't add the lines if the boxes are too small to be useful
    if (this.map.getZoom() <= 17) return;

    var north = this.currBounds.getNorthEast().lat();
    var east = this.currBounds.getNorthEast().lng().toFixed(5);
    var south = this.currBounds.getSouthWest().lat().toFixed(5);
    var west = this.currBounds.getSouthWest().lng().toFixed(5);

    // define the size of the grid
    var topLat = Math.ceil(north / this.currentGridSize) * this.currentGridSize;
    var rightLong = Math.ceil(east / this.currentGridSize) * this.currentGridSize;

    var bottomLat = Math.floor(south / this.currentGridSize) * this.currentGridSize;
    var leftLong = Math.floor(west / this.currentGridSize) * this.currentGridSize;

    for (var latitude = bottomLat; latitude <= topLat; latitude += this.currentGridSize) {
      // lines of latitude
      this.latGridLines.push(new google.maps.Polyline({
        path: [
          new google.maps.LatLng(latitude, leftLong),
          new google.maps.LatLng(latitude, rightLong)
        ],
        clickable: false,
        map: this.map,
        geodesic: true,
        strokeColor: '#0000FF',
        strokeOpacity: .5,
        strokeWeight: 2
      }));
    }
    for (var longitude = leftLong; longitude <= rightLong; longitude += this.currentGridSize) {
      // lines of longitude
      this.lonGridLines.push(new google.maps.Polyline({
        path: [
          new google.maps.LatLng(topLat, longitude),
          new google.maps.LatLng(bottomLat, longitude)
        ],
        clickable: false,
        map: this.map,
        geodesic: true,
        strokeColor: '#0000FF',
        strokeOpacity: .5,
        strokeWeight: 2
      }));

      //lonGridLines.forEach( (it) => {it.setMap(this.map)})
    }
  }

}(window.KAS = window.KAS || {}, jQuery, window.navigator));
