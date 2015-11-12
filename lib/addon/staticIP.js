/**
 * @file Source code for Static IP add on
 * @author Alvaro Juste
 */
(function() {
	"use strict";
	
	var
	modules = {
		env : new jaune.env.Environment(),
		http : require("http"),
		url : require("url"),
		request : require("request"),
		httpUtil : new jaune.http.Util()
	},
	settings = {
		staticIP : modules.env.getModulesSettings().staticIP
	},
	data = {
		staticIP : {
			url : modules.url.parse(settings.staticIP.proxyURL),
			auth : "Basic " + new Buffer(modules.url.parse(settings.staticIP.proxyURL).auth).toString("base64")
		}
	};
	/**
	 * Static IP add on constructor.
	 */
	function StaticIP() {
	}
	/**
	 * Static IP add on prototype.
	 */
	StaticIP.prototype = {
		/**
		 * Calls GEOCODE API.
		 * @param {Object} parameters Parameters with latitude and long to decode.
		 * @param {Function} cb Callback
		 */
		get : function(parameters, cb){
			
			var
			target = modules.url.parse(modules.url.format({
				protocol : parameters.protocol,
				host : parameters.host,
				pathname : parameters.pathname,
				query : parameters.query || {}
			})),
			options = {
				url: target.href,
				headers: {
					"Proxy-Authorization": data.staticIP.auth,
					"Host" : target.hostname
				},
				proxy : data.staticIP.url.href
			};
			//	do the request
			modules.request(options, function(error, response, body) {
				cb(error, response, body);
			});
		}
	};
	//begin: global
	jaune.common.extend(jaune, {
		addons : {
			StaticIP : StaticIP
		}
	}, false);
	//end: global
})();