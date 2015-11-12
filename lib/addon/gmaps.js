/**
 * @file Source code for Google Maps add on
 * @author Alvaro Juste
 */
(function() {
	"use strict";
	
	var
	modules = {
		path : require("path"),
		env : new jaune.env.Environment(),
		httpUtil : new jaune.http.Util(),
		staticIP : new jaune.addons.StaticIP()
	},
	settings = {
		gmaps : modules.env.getModulesSettings().gmaps
	},
	data = {
		gmaps : {
			cache : {
				scriptTimer : null
			},
			api : {
				script : modules.path.join(settings.gmaps.path, settings.gmaps.api.script),
				geocode : modules.path.join(settings.gmaps.path, settings.gmaps.api.geocode)
			}
		}
	};
	/**
	 * Google Maps add on constructor.
	 */
	function GoogleMaps() {
		if (!data.gmaps.cache.scriptTimer) {
			data.gmaps.cache.scriptTimer = setInterval(function() {
				if ("undefined" !== typeof data.gmaps.cache.script) {
					delete data.gmaps.cache.script;
				}
			}, settings.gmaps.cache.script);
		}
	}
	/**
	 * Google Maps add on prototype.
	 */
	GoogleMaps.prototype = {
			
		getGoogleMaps : function(parameters, cb){
			/**
			 * 
			 * @param err
			 * @param res
			 */
			function onGet(err, res, body) {
				
				if (!err) {
					if (res.statusCode == 200) {
						if (!data.gmaps.cache.script) {
							data.gmaps.cache.script = body;
						}
					}
					else {
						err = new Error("Invalid response code: " + res.statusCode);
					}
				}
				cb(err, body);
			}
			if (data.gmaps.cache.script) {
				cb(undefined, data.gmaps.cache.script);
			}
			else {
				modules.staticIP.get({
					protocol : settings.gmaps.protocol,
					host : settings.gmaps.host,
					pathname :  data.gmaps.api.script,
					query : {
						sensor : "false"/*,
						libraries : "drawing"*/
					}
				}, onGet);
			}
		},
		/**
		 * Calls GEOCODE API.
		 * @param {Object} parameters Parameters with latitude and long to decode.
		 * @param {Function} cb Callback
		 */
		getAddressFromCoordinates : function(parameters, cb){
			/**
			 * 
			 * @param err
			 * @param res
			 */
			function onGet(err, res, body) {
				
				if (!err) {
					if (res.statusCode !== 200) {
						err = new Error("Invalid response code: " + res.statusCode);
					}
				}
				cb(err, body);
			}
			modules.staticIP.get({
				protocol : settings.gmaps.protocol,
				host : settings.gmaps.host,
				pathname :  data.gmaps.api.geocode,
				query : {
					latlng : [parameters.lat, parameters.lng].join(","),
					sensor : "false",
					language : parameters.language,
					key : settings.gmaps.apiKey
				}
			}, onGet);
		}
	};
	//begin: global
	jaune.common.extend(jaune, {
		addons : {
			GoogleMaps : GoogleMaps
		}
	}, false);
	//end: global
})();