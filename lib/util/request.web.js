'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = function (baseUrl, options) {
  if (!options) options = {};
  var baseUrlParts = (0, _url.parse)(baseUrl);
  var i = baseUrlParts.auth ? baseUrlParts.auth.indexOf(':') : -1;
  var username = i !== -1 ? baseUrlParts.auth.slice(0, i) : baseUrlParts.auth || undefined;
  var password = i !== -1 ? baseUrlParts.auth.slice(i + 1) : baseUrlParts.auth ? '' : undefined;
  delete baseUrlParts.auth;

  var queue = [];
  var maxTasks = typeof options.maxSockets === 'number' ? options.maxSockets * 2 : Infinity;
  var activeTasks = 0;

  function drainQueue() {
    if (!queue.length || activeTasks >= maxTasks) return;
    var task = queue.shift();
    activeTasks += 1;
    task(function () {
      activeTasks -= 1;
      drainQueue();
    });
  }

  return function request(_ref, cb) {
    var method = _ref.method;
    var url = _ref.url;
    var headers = _ref.headers;
    var body = _ref.body;

    if (typeof username === 'string' && !headers.authorization) {
      headers.authorizaton = 'Basic ' + window.btoa(username + ':' + (password || ''));
    }

    var urlParts = _extends({}, baseUrlParts, {
      pathname: url.pathname ? baseUrlParts.pathname ? joinPath(baseUrlParts.pathname, url.pathname) : url.pathname : baseUrlParts.pathname,
      search: url.search ? baseUrlParts.search ? baseUrlParts.search + '&' + url.search.slice(1) : url.search : baseUrlParts.search
    });

    queue.push(function (next) {
      var _callback = function callback() {
        _callback = function callback() {
          return undefined;
        };
        next();
        cb.apply(undefined, arguments);
      };
      var req = (0, _xhr2.default)(_extends({
        responseType: 'text'
      }, options, {
        url: (0, _url.format)(urlParts),
        body: body,
        method: method,
        headers: headers
      }), function (err, res) {
        if (!err) _callback(null, res);else {
          err.request = req;
          _callback(err);
        }
      });
    });

    drainQueue();
  };
};

var _xhr = require('xhr');

var _xhr2 = _interopRequireDefault(_xhr);

var _url = require('url');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function joinPath() {
  var a = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
  var b = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

  if (!a && !b) return '';
  var leadingSlash = a.charAt(0) === '/';
  var trailingSlash = b.charAt(b.length - 1) === '/';
  var tokens = (a + '/' + b).split('/').filter(Boolean);
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    if (token === '..') {
      tokens.splice(i - 1, 2);
      i--;
    } else if (token === '.') {
      tokens.splice(i, 1);
      i--;
    }
  }
  var path = tokens.join('/');
  if (leadingSlash) path = '/' + path;
  if (trailingSlash) path = path + '/';
  return path;
}