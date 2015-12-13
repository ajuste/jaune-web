/**
 * @file   Source code for localization
 * @author Alvaro Juste
 */
"use strict";

// 3rd
const _i18n    = require("i18next");
const _bind    = require("lodash").bind;
const _collect = require("lodash").collect;

// constants
/**
 * @constant {String} Section name for configuration
 */
const CONFIG_SECTION = "jaune.locale";

// variables
const _countryLocations = {
  UY : { lat : -34.88987359652848, lng : -56.16416931152344 },
  Default : { lat : -34.88987359652848, lng : -56.16416931152344 }
};
const _keys = {
  string : "res.key"
};
/**
 * @class Locale manager
 */
const LocaleManager = function(env) {

  this.settings = env.getEnvProperty(CONFIG_SECTION);

  if (!this.settings) return;

  this.defaultLocale = [
    this.settings.defaultLanguage.toLowerCase(),
    this.settings.defaultCountry.toUpperCase()
  ].join("-");
};

LocaleManager.prototype.getLocaleFolderName = function(lang) {
  return this.getDefaultLanguage() === lang ? "en" : lang;
};

/**
 * @function Validates if a country code is supported.
 * @param    {String} code Country code
 * @returns  {Boolean} True if supported
 */
LocaleManager.prototype.isSupportedCountry = function(code) {
  return -1 !== this.settings.supportedCountries.indexOf(code);
};

/**
 * @function Get countries codes.
 * @return   {Array} Codes.
 */
LocaleManager.prototype.getCountries = function() {
  return this.settings.supportedCountries;
};

/**
 * @function Get countries names.
 * @return   {Array} Names.
 */
LocaleManager.prototype.getCountriesNames = function() {
  return _collect(this.getCountries(), function(code){
    return this.getStringResource("app.countries." + code);
  }, this);
};

/**
 * @function Get languages names.
 * @return   {Array} Names.
 */
LocaleManager.prototype.getLanguagesNames = function() {
  return _collect(this.getLanguages(), function(code){
    return this.getStringResource("app.languages." + code.toUpperCase());
  }, this);
};

/**
 * @function Validates if a language code is supported.
 * @param    {String} code Language code
 * @returns  {Boolean} True if supported
 */
LocaleManager.prototype.isSupportedLanguage = function(code) {
  return -1 !== this.settings.supportedLanguages.indexOf(code);
};

/**
 * @function Gets default country code.
 * @return   {String} Names.
 */
LocaleManager.prototype.getDefaultCountry = function() {
  return this.settings.defaultCountry;
};

LocaleManager.prototype.getLanguages = function() {
  return this.settings.supportedLanguages;
};

LocaleManager.prototype.getDefaultLanguage = function() {
  return this.settings.defaultLanguage;
};

/**
 * @function Get string resource
 * @param    {String} key The key
 * @param    {Boolean} asObject As object tree
 */
LocaleManager.prototype.getStringResource = function(key, asObject) {
  return _i18n.t(key, { returnObjectTrees: true });
};

LocaleManager.prototype.getCountryLocation = function(countryCode) {
  return _countryLocations[countryCode.toUpperCase()] || _countryLocations.Default;
};

LocaleManager.prototype.translateEnum = function(enumeration) {

  const resourceKey = enumeration[_keys.string];

  return _chain(enumeration)
  .keys   ()
  .filter (function(k) { return _isNumber(enumeration[k]) && _keys.string != k; })
  .map    (function(k) { return [enumeration[k], _i18n.t(resourceKey + "." + enumeration[k])]; })
  .object ()
  .value  ();
};

LocaleManager.prototype.sameOrValidLanguage = function(lang) {
  return this.settings.supportedLanguages.indexOf(lang) === -1 ? this.settings.defaultLanguage : lang;
};

LocaleManager.prototype.sameOrValidCountry = function(country) {
  return this.settings.supportedCountries.indexOf(country) === -1 ? this.settings.defaultCountry : country;
};

LocaleManager.prototype.setLocale = function* (locale) {
  locale = this.getLocale(locale);
  return new Promise(function(resolve, reject) {
    _i18n.setLng(locale.locale, { fixLng: true });
    resolve(locale);
  });
};

LocaleManager.prototype.getLocale = function(language) {

  var lng = (language || _i18n.lng() || _defaultLocale).split("-");

  switch(lng.length) {

    case 0 :
      lng = _defaultLocale.split("-");
    break;

    case 1 :
      lng = [this.sameOrValidLanguage(lng[0]), this.settings.defaultCountry];
    break;

    default :
      lng = [this.sameOrValidLanguage(lng[0]), this.sameOrValidCountry(lng[1])];
    break;
  }
  return {
    locale : lng.join("-"),
    language : lng[0],
    country : lng[1],
    folder : _i18n.detectLanguage()
  };
};

module.exports = {
  Manager : LocaleManager
};
