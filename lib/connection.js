'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _promisify2 = require('./util/promisify');

var _promisify3 = _interopRequireDefault(_promisify2);

var _httpErrors = require('http-errors');

var _httpErrors2 = _interopRequireDefault(_httpErrors);

var _querystring = require('querystring');

var _querystring2 = _interopRequireDefault(_querystring);

var _request = require('./util/request');

var _request2 = _interopRequireDefault(_request);

var _error = require('./error');

var _error2 = _interopRequireDefault(_error);

var _route = require('./route');

var _route2 = _interopRequireDefault(_route);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var byteLength = Buffer.byteLength || require('utf8-length');

var MIME_JSON = /\/(json|javascript)(\W|$)/;

var Connection = function () {
  function Connection(config) {
    _classCallCheck(this, Connection);

    if (typeof config === 'string') {
      config = { url: config };
    }
    this.config = _extends({}, Connection.defaults, config);
    this.config.agentOptions = _extends({}, Connection.agentDefaults, this.config.agentOptions);
    if (!this.config.headers) this.config.headers = {};
    if (!this.config.headers['x-arango-version']) {
      this.config.headers['x-arango-version'] = this.config.arangoVersion;
    }
    this.arangoMajor = Math.floor(this.config.arangoVersion / 10000);
    this._request = (0, _request2.default)(this.config.url, this.config.agentOptions, this.config.agent);
    this._databasePath = '/_db/' + this.config.databaseName;
    this.promisify = (0, _promisify3.default)(this.config.promise);
  }

  _createClass(Connection, [{
    key: '_buildUrl',
    value: function _buildUrl(opts) {
      var pathname = '';
      var search = void 0;
      if (!opts.absolutePath) {
        pathname = this._databasePath;
        if (opts.basePath) pathname += opts.basePath;
      }
      if (opts.path) pathname += opts.path;
      if (opts.qs) {
        if (typeof opts.qs === 'string') search = '?' + opts.qs;else search = '?' + _querystring2.default.stringify(opts.qs);
      }
      return search ? { pathname: pathname, search: search } : { pathname: pathname };
    }
  }, {
    key: 'route',
    value: function route(path, headers) {
      return new _route2.default(this, path, headers);
    }
  }, {
    key: 'request',
    value: function request(opts, cb) {
      var _promisify = this.promisify(cb);

      var promise = _promisify.promise;
      var callback = _promisify.callback;

      var contentType = 'text/plain';
      var body = opts.body;

      if (body) {
        if ((typeof body === 'undefined' ? 'undefined' : _typeof(body)) === 'object') {
          if (opts.ld) {
            body = body.map(function (obj) {
              return JSON.stringify(obj);
            }).join('\r\n') + '\r\n';
            contentType = 'application/x-ldjson';
          } else {
            body = JSON.stringify(body);
            contentType = 'application/json';
          }
        } else {
          body = String(body);
        }
      }

      if (!opts.headers.hasOwnProperty('content-type')) {
        opts.headers['content-type'] = contentType;
      }

      if (typeof window === "undefined" && !opts.headers.hasOwnProperty('content-length')) {
        opts.headers['content-length'] = body ? byteLength(body, 'utf-8') : 0;
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Object.keys(this.config.headers)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var key = _step.value;

          if (!opts.headers.hasOwnProperty(key)) {
            opts.headers[key] = this.config.headers[key];
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this._request({
        url: this._buildUrl(opts),
        headers: opts.headers,
        method: opts.method,
        body: body
      }, function (err, res) {
        if (err) callback(err);else {
          res.rawBody = res.body;
          if (res.headers['content-type'].match(MIME_JSON)) {
            try {
              res.body = JSON.parse(res.rawBody);
            } catch (e) {
              e.response = res;
              return callback(e);
            }
          }
          if (res.body && res.body.error && res.body.hasOwnProperty('code') && res.body.hasOwnProperty('errorMessage') && res.body.hasOwnProperty('errorNum')) {
            err = new _error2.default(res.body);
            err.response = res;
            callback(err);
          } else if (res.statusCode >= 400) {
            err = (0, _httpErrors2.default)(res.statusCode);
            err.response = res;
            callback(err);
          } else callback(null, res);
        }
      });
      return promise;
    }
  }]);

  return Connection;
}();

exports.default = Connection;


Connection.defaults = {
  url: 'http://localhost:8529',
  databaseName: '_system',
  arangoVersion: 30000
};

Connection.agentDefaults = {
  maxSockets: 3,
  keepAlive: true,
  keepAliveMsecs: 1000
};