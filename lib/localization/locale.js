
/**
 * @file   Source code for localization
 * @author Alvaro Juste
 */
'use struct';
var ConfigSection, CountryLocations, Keys, Manager, i18n,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

i18n = require('i18next');

ConfigSection = 'jaune.locale';

CountryLocations = {
  UY: {
    lat: -34.88987359652848,
    lng: -56.16416931152344
  },
  Default: {
    lat: -34.88987359652848,
    lng: -56.16416931152344
  }
};

Keys = {
  string: 'res.key'
};


/**
 * @class Locale manager
 */

Manager = (function() {
  function Manager(env) {
    this.settings = env.getEnvProperty(ConfigSection);
    if (!this.settings) {
      return;
    }
    this.defaultLocale = [this.settings.defaultLanguage.toLowerCase(), this.settings.defaultCountry.toUpperCase()].join('-');
  }

  Manager.prototype.getLocaleFolderName = function(lang) {
    if (this.getDefaultLanguage() === lang) {
      return 'en';
    } else {
      return lang;
    }
  };


  /**
   * @function Validates if a country code is supported.
   * @param    {String} code Country code
   * @returns  {Boolean} True if supported
   */

  Manager.prototype.isSupportedCountry = function(code) {
    return indexOf.call(this.settings.supportedCountries, code) >= 0;
  };


  /**
   * @function Get countries codes.
   * @return {Array} Codes.
   */

  Manager.prototype.getCountries = function() {
    return this.settings.supportedCountries;
  };


  /**
   * @function Get countries names.
   * @return   {Array} Names.
   */

  Manager.prototype.getCountriesNames = function() {
    var code, i, len, ref, results;
    ref = this.getCountries();
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      code = ref[i];
      results.push(this.getStringResource("app.countries." + code));
    }
    return results;
  };


  /**
   * @function Get languages names.
   * @return   {Array} Names.
   */

  Manager.prototype.getLanguagesNames = function() {
    var code, i, len, ref, results;
    ref = this.getLanguages();
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      code = ref[i];
      results.push(this.getStringResource("app.languages." + (code.toUpperCase())));
    }
    return results;
  };


  /**
   * @function Validates if a language code is supported.
   * @param    {String} code Language code
   * @returns  {Boolean} True if supported
   */

  Manager.prototype.isSupportedLanguage = function(code) {
    return indexOf.call(this.settings.supportedLanguages.indexOf, code) >= 0;
  };


  /**
   * @function Gets default country code.
   * @return   {String} Names.
   */

  Manager.prototype.getDefaultCountry = function() {
    return this.settings.defaultCountry;
  };

  Manager.prototype.getLanguages = function() {
    return this.settings.supportedLanguages;
  };

  Manager.prototype.getDefaultLanguage = function() {
    return this.settings.defaultLanguage;
  };


  /**
   * @function Get string resource
   * @param    {String} key The key
   * @param    {Object} [placeholders] The placeholders
   * @param    {Boolean} asObject As object tree
   */

  Manager.prototype.getStringResource = function(key, asObject, placeholders) {
    return i18n.t(key, Object.assign({
      returnObjectTrees: true
    }, placeholders));
  };

  Manager.prototype.getCountryLocation = function(countryCode) {
    return CountryLocations[countryCode.toUpperCase()] || CountryLocations.Default;
  };

  Manager.prototype.translateEnum = function(enumeration) {
    var i, key, len, resourceKey, result, value;
    resourceKey = enumeration[Keys.string];
    result = {};
    for (value = i = 0, len = enumeration.length; i < len; value = ++i) {
      key = enumeration[value];
      if (!(key !== Keys.string && typeof value === 'number')) {
        continue;
      }
      result[value] = i18n.t(resourceKey + "." + value);
    }
    return result;
  };

  Manager.prototype.sameOrValidLanguage = function(lang) {
    if (indexOf.call(this.settings.supportedLanguages, lang) >= 0) {
      return lang;
    } else {
      return this.settings.defaultLanguage;
    }
  };

  Manager.prototype.sameOrValidCountry = function(country) {
    if (indexOf.call(this.settings.supportedCountries, country) >= 0) {
      return country;
    } else {
      return this.settings.defaultCountry;
    }
  };

  Manager.prototype.setLocale = function(locale) {
    locale = this.getLocale(locale);
    return new Promise(function(resolve, reject) {
      i18n.setLng(locale.locale, {
        fixLng: true
      });
      return resolve(locale);
    });
  };


  /**
  * @function Get locale from language or current i18n or default locale
  * @param {String} [language] The language
   */

  Manager.prototype.getLocale = function(language) {
    var country, lng, ref, ref1;
    ref1 = ((ref = language != null ? language : i18n.lng()) != null ? ref : defaultLocale).split('-'), language = ref1[0], country = ref1[1];
    switch (false) {
      case !((language == null) && (country == null)):
        lng = defaultLocale.split('-');
        break;
      case !(country == null):
        lng = [language, this.settings.defaultCountry];
        break;
      default:
        lng = [language, country];
    }
    return {
      language: language,
      country: country,
      locale: lng.join('-'),
      folder: i18n.detectLanguage()
    };
  };

  return Manager;

})();

module.exports = {
  Manager: Manager
};
