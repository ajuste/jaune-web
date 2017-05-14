###*
 * @file   Source code for localization
 * @author Alvaro Juste
###
'use struct'

# 3rd
i18n = require 'i18next'

# constants

# Section name for configuration
ConfigSection = 'jaune.locale'

# Country locations
CountryLocations =
  UY: lat: -34.88987359652848, lng: -56.16416931152344
  Default: lat: -34.88987359652848, lng: -56.16416931152344

Keys =
  string : 'res.key'

###*
 * @class Locale manager
###
class Manager

  constructor: (env) ->

    @settings = env.getEnvProperty ConfigSection

    return unless @settings

    @defaultLocale = [
      @settings.defaultLanguage.toLowerCase(),
      @settings.defaultCountry.toUpperCase()
    ].join '-'

  getLocaleFolderName: (lang) ->
    if @getDefaultLanguage() is lang then 'en' else lang

  ###*
   * @function Validates if a country code is supported.
   * @param    {String} code Country code
   * @returns  {Boolean} True if supported
  ###
  isSupportedCountry: (code) ->
    return code in @settings.supportedCountries

  ###*
   * @function Get countries codes.
   * @return {Array} Codes.
  ###
  getCountries: ->
    @settings.supportedCountries

  ###*
   * @function Get countries names.
   * @return   {Array} Names.
  ###
  getCountriesNames: ->
    for code in @getCountries()
      @getStringResource "app.countries.#{code}"

  ###*
   * @function Get languages names.
   * @return   {Array} Names.
  ###
  getLanguagesNames: ->
    for code in @getLanguages()
      @getStringResource "app.languages.#{code.toUpperCase()}"

  ###*
   * @function Validates if a language code is supported.
   * @param    {String} code Language code
   * @returns  {Boolean} True if supported
  ###
  isSupportedLanguage: (code) ->
    code in @settings.supportedLanguages.indexOf

  ###*
   * @function Gets default country code.
   * @return   {String} Names.
  ###
  getDefaultCountry: -> @settings.defaultCountry

  getLanguages: -> @settings.supportedLanguages

  getDefaultLanguage: -> @settings.defaultLanguage

  ###*
   * @function Get string resource
   * @param    {String} key The key
   * @param    {Object} [placeholders] The placeholders
   * @param    {Boolean} asObject As object tree
  ###
  getStringResource: (key, returnObjectTrees, placeholders) ->
    i18n.t key, Object.assign {returnObjectTrees}, placeholders

  getCountryLocation: (countryCode) ->
    CountryLocations[countryCode.toUpperCase()] || CountryLocations.Default

  translateEnum: (enumeration) ->

    resourceKey = enumeration[Keys.string]
    result = {}

    for key, value in enumeration
      continue unless key isnt Keys.string and typeof value is 'number'
      result[value] = i18n.t "#{resourceKey}.#{value}"

    result

  sameOrValidLanguage: (lang) ->
    return lang if lang in @settings.supportedLanguages
    @settings.defaultLanguage

  sameOrValidCountry: (country) ->
    if country in @settings.supportedCountries
      country
    else
      @settings.defaultCountry

  setLocale: (locale) ->
    locale = @getLocale locale
    new Promise (resolve, reject) ->
      i18n.setLng locale.locale, fixLng: on
      resolve locale

  ###*
  * @function Get locale from language or current i18n or default locale
  * @param {String} [language] The language
  ###
  getLocale: (language) ->

    [language, country] = (language ? i18n.lng() ? defaultLocale).split '-'

    switch

      when not language? and not country?
        lng = defaultLocale.split '-'

      when not country?
        lng = [language, @settings.defaultCountry]

      else
        lng = [language, country]

    {
      language, country,
      locale : lng.join '-'
      folder : i18n.detectLanguage()
    }

module.exports = {Manager}
