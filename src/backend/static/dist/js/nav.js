// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (modules, entry, mainEntry, parcelRequireName, globalName) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        this
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });

      // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }
})({"k9vAE":[function(require,module,exports) {
"use strict"; // Start of use strict
// Toggle the side navigation
$("#sidebarToggle, #sidebarToggleTop").on("click", function(e) {
    $("body").toggleClass("sidebar-toggled");
    $(".sidebar").toggleClass("toggled");
    $(".sidebar").hasClass("toggled");
});
// Close any open menu accordions when window is resized below 768px
$(window).resize(function() {
    $(window).width();
    // Toggle the side navigation when window is resized below 480px
    if ($(window).width() < 480 && !$(".sidebar").hasClass("toggled")) {
        $("body").addClass("sidebar-toggled");
        $(".sidebar").addClass("toggled");
    }
});
// Prevent the content wrapper from scrolling when the fixed side navigation hovered over
$("body.fixed-nav .sidebar").on("mousewheel DOMMouseScroll wheel", function(e) {
    if ($(window).width() > 768) {
        var e0 = e.originalEvent, delta = e0.wheelDelta || -e0.detail;
        this.scrollTop += (delta < 0 ? 1 : -1) * 30;
        e.preventDefault();
    }
});
// Scroll to top button appear
$(document).on("scroll", function() {
    var scrollDistance = $(this).scrollTop();
    if (scrollDistance > 100) $(".scroll-to-top").fadeIn();
    else $(".scroll-to-top").fadeOut();
});
// Smooth scrolling using jQuery easing
$(document).on("click", "a.scroll-to-top", function(e) {
    var $anchor = $(this);
    $("html, body").stop().animate({
        scrollTop: $($anchor.attr("href")).offset().top
    }, 1000, "easeInOutExpo");
    e.preventDefault();
});
const links = [
    {
        name: "Activos | Plaqueados",
        href: "/plaqueados/"
    },
    {
        name: "Activos | No Plaqueados",
        href: "/no-plaqueados/"
    },
    {
        name: "Activos | Tipos",
        href: "/tipo/"
    },
    {
        name: "Activos | Subtipos",
        href: "/subtipo/"
    },
    {
        name: "Activos | Compra",
        href: "/compra/"
    },
    {
        name: "Tr\xe1mites | Traslado",
        href: "/generar/traslados"
    },
    {
        name: "Tr\xe1mites | Deshecho",
        href: "/generar/desecho"
    },
    {
        name: "Tr\xe1mites | Ver Tr\xe1mites",
        href: "/tramites"
    },
    {
        name: "Reportes | Plaqueados",
        href: "/reportes/plaqueados"
    },
    {
        name: "Reportes | No Plaqueados",
        href: "/reportes/no-plaqueados"
    },
    {
        name: "Reportes | Plaqueados 2 a\xf1os",
        href: "/reportes/plaqueados/2-old"
    },
    {
        name: "Reportes | Plaqueados 4 a\xf1os",
        href: "/reportes/plaqueados/4-old"
    },
    {
        name: "Reportes | No Plaqueados 2 a\xf1os",
        href: "/reportes/no-plaqueados/2-old"
    },
    {
        name: "Reportes | No Plaqueados 4 a\xf1os",
        href: "/reportes/no-plaqueados/4-old"
    },
    {
        name: "Gesti\xf3n | Funcionarios",
        href: "/funcionarios"
    },
    {
        name: "Gesti\xf3n | Ubicaciones",
        href: "/ubicaciones"
    },
    {
        name: "Gesti\xf3n | Usuarios",
        href: "/users"
    },
    {
        name: "Importar | Plaqueados",
        href: "/importar/activos"
    },
    {
        name: "Importar | No Plaqueados",
        href: "/importar/no-plaqueados"
    },
    {
        name: "Importar | Reporte Plaqueados",
        href: "/importar/reporte-plaqueados"
    }
];
$(".content").not($("#nav-search-input")).on("click", ()=>{
    $(".search-result-container").toggleClass("hidden", true);
});
$("#nav-search-input").on("click", (event)=>{
    if ($(".search-result-list").children(".search-result-item").length > 0) $(".search-result-container").toggleClass("hidden", false);
});
$("#nav-search-input").on("keyup", (event)=>{
    const value = event.target.value.trim().toLowerCase();
    const container = $(".search-result-container");
    const similarLinks = links.filter((link)=>link.name.toLowerCase().includes(value)).slice(0, 4);
    if (value === "" || similarLinks.length === 0) {
        container.toggleClass("hidden", true);
        return;
    }
    const template = $("#search-item-template");
    const list = $(".search-result-list");
    const children = list.children(".search-result-item");
    children.remove();
    similarLinks.forEach((link)=>{
        const content = template[0].content.cloneNode(true);
        const a = content.querySelector(".result-link");
        a.text = link.name;
        a.href = link.href;
        list.append(content);
    });
    container.toggleClass("hidden", false);
});

},{}]},["k9vAE"], "k9vAE", "parcelRequire9763")

//# sourceMappingURL=nav.js.map
