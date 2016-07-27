###*
 * @file   Source file application
 * @author Alvaro Juste
###

'use strict'

# _.defaults
{defaults}  = require 'lodash'

# Koa server
{App} = require './koa-server'

# Attribute name for process describing type of environment
EnvType = 'type'

# Development environment type
EnvTypeDev = 'development'

# Production environment type
EnvTypeProd = 'production'

###*
 * @class Jaune Application
###
class App

  ###*
  * @constructor Builds a new Jaune App.
  * @param {Object} env Environment
  * @param {Object} engine The engine
  ###
  constructor: (@env, @engine) ->

    defaults process, env: type: EnvTypeProd

    @handlers = {}
    @parseArguments()
    @startServer()

  ###*
   * @function Get environment
  ###
  getEnvironment: -> @env

  ###*
   * @function Get engine
  ###
  getEngine: -> @engine

  ###*
   * @function Get handlers
  ###
  getHandlers: -> @handlers

  ###*
   * @function Parses arguments from command line that are directed to this class.
  ###
  parseArguments: ->
    for arg in process.argv
      switch arg
        when '--develop'
          @env.setProcessProperty EnvType, EnvTypeDev

  ###*
   * @function Starts the server.
  ###
  startServer: ->
    throw new Erro 'Already started' if (@server)
    @server = new App @env, @engine

  ###*
   * @function Unload application
  ###
  unload: ->
    process.env = null
    process.app = null

module.exports = {App}
