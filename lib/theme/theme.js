#!/usr/bin/env node

module.exports = function(nico) {

  var exports = {};

  var path = require('path');
  var fs = require('fs');
  var util = require('util');
  var SEA_MODULES = 'sea-modules';
  var file = nico.sdk.file;
  var glob = nico.sdk.file.glob;
  var BaseWriter = nico.BaseWriter;

  function MochaWriter() {}
  util.inherits(MochaWriter, BaseWriter);

  MochaWriter.prototype.run = function() {
    var option = nico.sdk.option;
    var dest = path.join(option.get('outputdir'), 'tests-runner.html');
    this.render({
      destination: dest,
      template: 'mocha-runner.html'
    });
  }
  nico.MochaWriter = MochaWriter;

  exports.name = 'cmd';
  exports.version = '1.0';
  exports.lang = 'zh';

  exports.reader = function(post) {
    var filename = post.meta.filepath.toLowerCase();
    if (filename === 'history.md') {
      post.template = post.meta.template = 'history';
    } else {
      post.template = post.meta.template = (post.meta.template || 'post');
    }
    if (filename === 'readme.md') {
      post.filename = post.meta.filename = 'index';
      post.meta.category = 'docs';
    }
    if (!post.meta.category) {
      post.meta.category = post.meta.directory;
    }
    return post;
  }

  var pkg = require(path.join(process.cwd(), 'package.json'))

  exports.filters = {
    find: function(pages, cat) {
      var ret = findCategory(pages, cat);
      if (ret.length) return ret[0];
      return null;
    },
    find_category: findCategory,
    replace_code: function(content) {
      var main = pkg.spm.main;
      main = main.replace(/\.js$/, '');
      value = util.format('%s/%s/%s', pkg.name, pkg.version, main.slice(main.lastIndexOf('/') + 1));
      var regex = new RegExp(
        '<span class="string">(\'|\")' + (main || 'index') + '(\'|\")</span>', 'g'
      );
      content = content.replace(regex, '<span class="string">$1' + value + '$2</span>');
      return content;
    },
    clean_alias: function(alias) {
      Object.keys(alias).forEach(function(key) {
        if (key === alias[key]) {
          delete alias[key];
        }
      });
      return alias;
    },
    is_runtime_handlebars: function(pkg) {
      var src = findSrc();
      for (var key in src) {
        if (/\.handlebars$/.test(src[key])) {
          return true;
        }
      }
      return false;
    },
    // 有 .tpl 的要插入 plugin-text
    is_plugin_text: function(pkg) {
      var src = findSrc();
      for (var key in src) {
        if (/\.tpl$/.test(src[key])) {
          return true;
        }
      }
      return false;
    },
    add_anchor: function(content) {
      for (var i = 1; i <= 6; i++) {
        var reg = new RegExp('(<h' + i + '\\sid="(.*?)">.*?)(<\/h' + i + '>)', 'g');
        content = content.replace(reg, '$1<a href="#$2" class="anchor">¶</a>$3');
      }
      return content;
    },
    gitRepoUrl: function(url) {
      url = url.replace(/\.git$/, '');
      if (url.match(/^http/)) {
        return url;
      }
      var matcher = url.match(/^git@(.*)\:(.*)/);
      if (matcher) {
        return 'http://' + matcher[1] + '/' + matcher[2];
      } else {
        return url;
      }
    },
    fixlink: function(html) {
      // format permalink, ends without .html
      html = html.replace(/(href="[^"]+)\.md(">)/ig, "$1.html$2");
      return html;
    },
    fixIssues: function(html) {
      // format permalink, ends without .html
      html = html.replace(/\s#([0-9]+)/ig, '<a href="'+pkg.bugs.url+'/$1">#$1</a>');
      return html;
    },
    getNickName: function(html) {
      if (typeof html === 'string') {
        var reg = /^(.*) (.*)$/;
        var m = html.match(reg);
        return m ? m[1] : '';
      } else if (html.name) {
        return html.name;
      }
    }
  };

  exports.functions = {

    specFiles: function() {
     var spec = pkg.spm.tests || '**/*-spec.js';
     var ret = glob.sync(spec);
      return ret.filter(function(item) {
        return item.indexOf('_site') < 0;
      });
    },

    dependencies: function() {
      var deps = getDependencies();
      var ret = {};
      for (var d in deps) {
        ret[d] = findEntryPoint(deps[d]);
      }
      return ret;
    },

    // load all css files in dependencies
    cssDependencies: function() {
      var deps = mergeDeps();
      var ret = {};
      for (var d in deps) {
        var item = deps[d];
        item = findEntryPoint(item);
        if (/\.css$/.test(item)) {
          ret[d] = item;
        }
      }
      return ret;

      function mergeDeps(deps, pkg) {
        deps = deps || {};
        var newDeps = getDependencies(pkg);
        for (var d in newDeps) {
          deps[d] = deps[d] || newDeps[d];
          deps = mergeDeps(deps, path.join(process.cwd(), newDeps[d], 'package.json'));
        }
        return deps;
      }
    },

    engines: function() {
      var ret = [];
      if (pkg.spm && pkg.spm.engines) {
        var engines = pkg.spm.engines;
        Object.keys(engines).forEach(function(key) {
          ret.push(findEntryPoint(SEA_MODULES + '/' + key + '/' + engines[key]));
        });
      }
      return ret;
    },

    sourceFiles: function() {
      var main = pkg.spm.main || 'index.js';
      var ret = lookupFiles(main).map(function(item) {
        if (fs.statSync(item + '.js')) {
          return item + '.js';
        }
      });
      return ret.concat(main);

      function lookupFiles(main) {
        path.extname(main) || (main = main + '.js');

        var req = requires(fs.readFileSync(path.join(process.cwd(), main))).map(function(item) {
          return item.path.replace('.js', '');
        });
        req =req.slice().filter(function(item) {
          return item.charAt(0) === '.';
        });
        req = req.map(function(item) {
          return path.join(path.dirname(main), item);
        });
        req.forEach(function(item) {
          req = req.concat(lookupFiles(item));
        });
        return req;
      }
    }
  }

  exports.hasHistory = file.exists(path.join(process.cwd(), 'HISTORY.md'));
  exports.hasTest = pkg.spm.tests || file.exists(path.join(process.cwd(), 'tests'));

  exports.isCssModule = (function() {
    var main = pkg.spm && pkg.spm.main
    if (main) {
      if (/\.css$/.test(main)) return true
      else return false
    }
    return false
  })()

  function findCategory(pages, cat) {
    var ret = [];
    Object.keys(pages).forEach(function(key) {
      var item = nico.sdk.post.read(key);
      if (item.meta.category === cat) {
        ret.push(item);
      }
    });
    ret = ret.sort(function(a, b) {
      if (/index$/i.test(a.filename)) {
        a.meta.order = 1;
      }
      if (/index$/i.test(b.filename)) {
        b.meta.order = 1;
      }
      a = a.meta.order || 10;
      b = b.meta.order || 10;
      return parseInt(a, 10) - parseInt(b, 10);
    });
    return ret;
  }

  function findEntryPoint(filePath) {
    var pkgFile = path.join(process.cwd(), filePath + '/package.json');
    var pkg = JSON.parse(fs.readFileSync(pkgFile));
    if (pkg && pkg.spm && pkg.spm.main) {
      return filePath + '/' +  pkg.spm.main;
    }
    return filePath + '/index.js';
  }

  function getDependencies(pkg) {
    pkg = pkg || 'package.json';
    if (typeof pkg === 'string') {
      pkg = file.readJSON(pkg);
    }
    var ret = {};
    if (pkg.spm) {
      var dependencies = pkg.spm.dependencies || {};
      var devDependencies = pkg.spm.devDependencies || {};
      Object.keys(dependencies).forEach(function(key) {
        ret[key] = SEA_MODULES + '/' + key + '/' + dependencies[key];
      });
      Object.keys(devDependencies).forEach(function(key) {
        ret[key] = SEA_MODULES + '/' + key + '/' + devDependencies[key];
      });
    }
    return ret;
  }

  /**
   * Parse requires in `str`.
   *
   * @param {String} str
   * @param {Function} [fn]
   * @return {Array}
   * @api public
   */

  function requires(str, fn) {
    if (fn) return map(str, fn);
    var re = /require *\(['"]([^'"]+)['"]\)/g;
    var ret = [];
    var m;

    while (m = re.exec(str)) {
      ret.push({
        string: m[0],
        path: m[1],
        index: m.index
      });
    }
    return ret;
  }

  function map(str, fn) {
    requires(str).forEach(function(r){
      str = str.replace(r.string, fn(r));
    });

    return str;
  }

  return exports;
};