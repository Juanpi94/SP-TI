(()=>{var e,t;("undefined"!=typeof globalThis?globalThis:"undefined"!=typeof self?self:"undefined"!=typeof window?window:"undefined"!=typeof global?global:{}).parcelRequire9763.register("8Wkn8",(function(e,t){
/*! @license DOMPurify 2.3.8 | (c) Cure53 and other contributors | Released under the Apache license 2.0 and Mozilla Public License 2.0 | github.com/cure53/DOMPurify/blob/2.3.8/LICENSE */!function(t,n){e.exports=n()}(e.exports,(function(){"use strict";function e(t){return e="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},e(t)}function t(e,n){return t=Object.setPrototypeOf||function e(t,n){return t.__proto__=n,t},t(e,n)}function n(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}function r(e,o,a){return r=n()?Reflect.construct:function e(n,r,o){var a=[null];a.push.apply(a,r);var i,l=new(Function.bind.apply(n,a));return o&&t(l,o.prototype),l},r.apply(null,arguments)}function o(e){return a(e)||i(e)||l(e)||u()}function a(e){if(Array.isArray(e))return c(e)}function i(e){if("undefined"!=typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}function l(e,t){if(e){if("string"==typeof e)return c(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?c(e,t):void 0}}function c(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function u(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var s=Object.hasOwnProperty,m=Object.setPrototypeOf,f=Object.isFrozen,p=Object.getPrototypeOf,d=Object.getOwnPropertyDescriptor,h=Object.freeze,g=Object.seal,y=Object.create,b="undefined"!=typeof Reflect&&Reflect,v=b.apply,T=b.construct;v||(v=function e(t,n,r){return t.apply(n,r)}),h||(h=function e(t){return t}),g||(g=function e(t){return t}),T||(T=function e(t,n){return r(t,o(n))});var N=C(Array.prototype.forEach),E=C(Array.prototype.pop),A=C(Array.prototype.push),w=C(String.prototype.toLowerCase),x=C(String.prototype.match),k=C(String.prototype.replace),S=C(String.prototype.indexOf),_=C(String.prototype.trim),O=C(RegExp.prototype.test),D=R(TypeError);function C(e){return function(t){for(var n=arguments.length,r=new Array(n>1?n-1:0),o=1;o<n;o++)r[o-1]=arguments[o];return v(e,t,r)}}function R(e){return function(){for(var t=arguments.length,n=new Array(t),r=0;r<t;r++)n[r]=arguments[r];return T(e,n)}}function M(e,t){m&&m(e,null);for(var n=t.length;n--;){var r=t[n];if("string"==typeof r){var o=w(r);o!==r&&(f(t)||(t[n]=o),r=o)}e[r]=!0}return e}function L(e){var t=y(null),n;for(n in e)v(s,e,[n])&&(t[n]=e[n]);return t}function I(e,t){for(;null!==e;){var n=d(e,t);if(n){if(n.get)return C(n.get);if("function"==typeof n.value)return C(n.value)}e=p(e)}function r(e){return console.warn("fallback value for",e),null}return r}var F=h(["a","abbr","acronym","address","area","article","aside","audio","b","bdi","bdo","big","blink","blockquote","body","br","button","canvas","caption","center","cite","code","col","colgroup","content","data","datalist","dd","decorator","del","details","dfn","dialog","dir","div","dl","dt","element","em","fieldset","figcaption","figure","font","footer","form","h1","h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","img","input","ins","kbd","label","legend","li","main","map","mark","marquee","menu","menuitem","meter","nav","nobr","ol","optgroup","option","output","p","picture","pre","progress","q","rp","rt","ruby","s","samp","section","select","shadow","small","source","spacer","span","strike","strong","style","sub","summary","sup","table","tbody","td","template","textarea","tfoot","th","thead","time","tr","track","tt","u","ul","var","video","wbr"]),H=h(["svg","a","altglyph","altglyphdef","altglyphitem","animatecolor","animatemotion","animatetransform","circle","clippath","defs","desc","ellipse","filter","font","g","glyph","glyphref","hkern","image","line","lineargradient","marker","mask","metadata","mpath","path","pattern","polygon","polyline","radialgradient","rect","stop","style","switch","symbol","text","textpath","title","tref","tspan","view","vkern"]),U=h(["feBlend","feColorMatrix","feComponentTransfer","feComposite","feConvolveMatrix","feDiffuseLighting","feDisplacementMap","feDistantLight","feFlood","feFuncA","feFuncB","feFuncG","feFuncR","feGaussianBlur","feImage","feMerge","feMergeNode","feMorphology","feOffset","fePointLight","feSpecularLighting","feSpotLight","feTile","feTurbulence"]),z=h(["animate","color-profile","cursor","discard","fedropshadow","font-face","font-face-format","font-face-name","font-face-src","font-face-uri","foreignobject","hatch","hatchpath","mesh","meshgradient","meshpatch","meshrow","missing-glyph","script","set","solidcolor","unknown","use"]),B=h(["math","menclose","merror","mfenced","mfrac","mglyph","mi","mlabeledtr","mmultiscripts","mn","mo","mover","mpadded","mphantom","mroot","mrow","ms","mspace","msqrt","mstyle","msub","msup","msubsup","mtable","mtd","mtext","mtr","munder","munderover"]),j=h(["maction","maligngroup","malignmark","mlongdiv","mscarries","mscarry","msgroup","mstack","msline","msrow","semantics","annotation","annotation-xml","mprescripts","none"]),P=h(["#text"]),G=h(["accept","action","align","alt","autocapitalize","autocomplete","autopictureinpicture","autoplay","background","bgcolor","border","capture","cellpadding","cellspacing","checked","cite","class","clear","color","cols","colspan","controls","controlslist","coords","crossorigin","datetime","decoding","default","dir","disabled","disablepictureinpicture","disableremoteplayback","download","draggable","enctype","enterkeyhint","face","for","headers","height","hidden","high","href","hreflang","id","inputmode","integrity","ismap","kind","label","lang","list","loading","loop","low","max","maxlength","media","method","min","minlength","multiple","muted","name","nonce","noshade","novalidate","nowrap","open","optimum","pattern","placeholder","playsinline","poster","preload","pubdate","radiogroup","readonly","rel","required","rev","reversed","role","rows","rowspan","spellcheck","scope","selected","shape","size","sizes","span","srclang","start","src","srcset","step","style","summary","tabindex","title","translate","type","usemap","valign","value","width","xmlns","slot"]),W=h(["accent-height","accumulate","additive","alignment-baseline","ascent","attributename","attributetype","azimuth","basefrequency","baseline-shift","begin","bias","by","class","clip","clippathunits","clip-path","clip-rule","color","color-interpolation","color-interpolation-filters","color-profile","color-rendering","cx","cy","d","dx","dy","diffuseconstant","direction","display","divisor","dur","edgemode","elevation","end","fill","fill-opacity","fill-rule","filter","filterunits","flood-color","flood-opacity","font-family","font-size","font-size-adjust","font-stretch","font-style","font-variant","font-weight","fx","fy","g1","g2","glyph-name","glyphref","gradientunits","gradienttransform","height","href","id","image-rendering","in","in2","k","k1","k2","k3","k4","kerning","keypoints","keysplines","keytimes","lang","lengthadjust","letter-spacing","kernelmatrix","kernelunitlength","lighting-color","local","marker-end","marker-mid","marker-start","markerheight","markerunits","markerwidth","maskcontentunits","maskunits","max","mask","media","method","mode","min","name","numoctaves","offset","operator","opacity","order","orient","orientation","origin","overflow","paint-order","path","pathlength","patterncontentunits","patterntransform","patternunits","points","preservealpha","preserveaspectratio","primitiveunits","r","rx","ry","radius","refx","refy","repeatcount","repeatdur","restart","result","rotate","scale","seed","shape-rendering","specularconstant","specularexponent","spreadmethod","startoffset","stddeviation","stitchtiles","stop-color","stop-opacity","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke","stroke-width","style","surfacescale","systemlanguage","tabindex","targetx","targety","transform","transform-origin","text-anchor","text-decoration","text-rendering","textlength","type","u1","u2","unicode","values","viewbox","visibility","version","vert-adv-y","vert-origin-x","vert-origin-y","width","word-spacing","wrap","writing-mode","xchannelselector","ychannelselector","x","x1","x2","xmlns","y","y1","y2","z","zoomandpan"]),q=h(["accent","accentunder","align","bevelled","close","columnsalign","columnlines","columnspan","denomalign","depth","dir","display","displaystyle","encoding","fence","frame","height","href","id","largeop","length","linethickness","lspace","lquote","mathbackground","mathcolor","mathsize","mathvariant","maxsize","minsize","movablelimits","notation","numalign","open","rowalign","rowlines","rowspacing","rowspan","rspace","rquote","scriptlevel","scriptminsize","scriptsizemultiplier","selection","separator","separators","stretchy","subscriptshift","supscriptshift","symmetric","voffset","width","xmlns"]),Y=h(["xlink:href","xml:id","xlink:title","xml:space","xmlns:xlink"]),K=g(/\{\{[\w\W]*|[\w\W]*\}\}/gm),V=g(/<%[\w\W]*|[\w\W]*%>/gm),$=g(/^data-[\-\w.\u00B7-\uFFFF]/),X=g(/^aria-[\-\w]+$/),Z=g(/^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i),J=g(/^(?:\w+script|data):/i),Q=g(/[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]/g),ee=g(/^html$/i),te=function e(){return"undefined"==typeof window?null:window},ne=function t(n,r){if("object"!==e(n)||"function"!=typeof n.createPolicy)return null;var o=null,a="data-tt-policy-suffix";r.currentScript&&r.currentScript.hasAttribute(a)&&(o=r.currentScript.getAttribute(a));var i="dompurify"+(o?"#"+o:"");try{return n.createPolicy(i,{createHTML:function e(t){return t}})}catch(e){return console.warn("TrustedTypes policy "+i+" could not be created."),null}},re;function oe(){var t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:te(),n=function e(t){return oe(t)};if(n.version="2.3.8",n.removed=[],!t||!t.document||9!==t.document.nodeType)return n.isSupported=!1,n;var r=t.document,a=t.document,i=t.DocumentFragment,l=t.HTMLTemplateElement,c=t.Node,u=t.Element,s=t.NodeFilter,m=t.NamedNodeMap,f=void 0===m?t.NamedNodeMap||t.MozNamedAttrMap:m,p=t.HTMLFormElement,d=t.DOMParser,g=t.trustedTypes,y=u.prototype,b=I(y,"cloneNode"),v=I(y,"nextSibling"),T=I(y,"childNodes"),C=I(y,"parentNode");if("function"==typeof l){var R=a.createElement("template");R.content&&R.content.ownerDocument&&(a=R.content.ownerDocument)}var re=ne(g,r),ae=re?re.createHTML(""):"",ie=a,le=ie.implementation,ce=ie.createNodeIterator,ue=ie.createDocumentFragment,se=ie.getElementsByTagName,me=r.importNode,fe={};try{fe=L(a).documentMode?a.documentMode:{}}catch(e){}var pe={};n.isSupported="function"==typeof C&&le&&void 0!==le.createHTMLDocument&&9!==fe;var de=K,he=V,ge=$,ye=X,be=J,ve=Q,Te=Z,Ne=null,Ee=M({},[].concat(o(F),o(H),o(U),o(B),o(P))),Ae=null,we=M({},[].concat(o(G),o(W),o(q),o(Y))),xe=Object.seal(Object.create(null,{tagNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},attributeNameCheck:{writable:!0,configurable:!1,enumerable:!0,value:null},allowCustomizedBuiltInElements:{writable:!0,configurable:!1,enumerable:!0,value:!1}})),ke=null,Se=null,_e=!0,Oe=!0,De=!1,Ce=!1,Re=!1,Me=!1,Le=!1,Ie=!1,Fe=!1,He=!1,Ue=!0,ze=!0,Be=!1,je={},Pe=null,Ge=M({},["annotation-xml","audio","colgroup","desc","foreignobject","head","iframe","math","mi","mn","mo","ms","mtext","noembed","noframes","noscript","plaintext","script","style","svg","template","thead","title","video","xmp"]),We=null,qe=M({},["audio","video","img","source","image","track"]),Ye=null,Ke=M({},["alt","class","for","id","label","name","pattern","placeholder","role","summary","title","value","style","xmlns"]),Ve="http://www.w3.org/1998/Math/MathML",$e="http://www.w3.org/2000/svg",Xe="http://www.w3.org/1999/xhtml",Ze=Xe,Je=!1,Qe,et=["application/xhtml+xml","text/html"],tt="text/html",nt,rt=null,ot=a.createElement("form"),at=function e(t){return t instanceof RegExp||t instanceof Function},it=function t(n){rt&&rt===n||(n&&"object"===e(n)||(n={}),n=L(n),Ne="ALLOWED_TAGS"in n?M({},n.ALLOWED_TAGS):Ee,Ae="ALLOWED_ATTR"in n?M({},n.ALLOWED_ATTR):we,Ye="ADD_URI_SAFE_ATTR"in n?M(L(Ke),n.ADD_URI_SAFE_ATTR):Ke,We="ADD_DATA_URI_TAGS"in n?M(L(qe),n.ADD_DATA_URI_TAGS):qe,Pe="FORBID_CONTENTS"in n?M({},n.FORBID_CONTENTS):Ge,ke="FORBID_TAGS"in n?M({},n.FORBID_TAGS):{},Se="FORBID_ATTR"in n?M({},n.FORBID_ATTR):{},je="USE_PROFILES"in n&&n.USE_PROFILES,_e=!1!==n.ALLOW_ARIA_ATTR,Oe=!1!==n.ALLOW_DATA_ATTR,De=n.ALLOW_UNKNOWN_PROTOCOLS||!1,Ce=n.SAFE_FOR_TEMPLATES||!1,Re=n.WHOLE_DOCUMENT||!1,Ie=n.RETURN_DOM||!1,Fe=n.RETURN_DOM_FRAGMENT||!1,He=n.RETURN_TRUSTED_TYPE||!1,Le=n.FORCE_BODY||!1,Ue=!1!==n.SANITIZE_DOM,ze=!1!==n.KEEP_CONTENT,Be=n.IN_PLACE||!1,Te=n.ALLOWED_URI_REGEXP||Te,Ze=n.NAMESPACE||Xe,n.CUSTOM_ELEMENT_HANDLING&&at(n.CUSTOM_ELEMENT_HANDLING.tagNameCheck)&&(xe.tagNameCheck=n.CUSTOM_ELEMENT_HANDLING.tagNameCheck),n.CUSTOM_ELEMENT_HANDLING&&at(n.CUSTOM_ELEMENT_HANDLING.attributeNameCheck)&&(xe.attributeNameCheck=n.CUSTOM_ELEMENT_HANDLING.attributeNameCheck),n.CUSTOM_ELEMENT_HANDLING&&"boolean"==typeof n.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements&&(xe.allowCustomizedBuiltInElements=n.CUSTOM_ELEMENT_HANDLING.allowCustomizedBuiltInElements),Qe=Qe=-1===et.indexOf(n.PARSER_MEDIA_TYPE)?tt:n.PARSER_MEDIA_TYPE,nt="application/xhtml+xml"===Qe?function(e){return e}:w,Ce&&(Oe=!1),Fe&&(Ie=!0),je&&(Ne=M({},o(P)),Ae=[],!0===je.html&&(M(Ne,F),M(Ae,G)),!0===je.svg&&(M(Ne,H),M(Ae,W),M(Ae,Y)),!0===je.svgFilters&&(M(Ne,U),M(Ae,W),M(Ae,Y)),!0===je.mathMl&&(M(Ne,B),M(Ae,q),M(Ae,Y))),n.ADD_TAGS&&(Ne===Ee&&(Ne=L(Ne)),M(Ne,n.ADD_TAGS)),n.ADD_ATTR&&(Ae===we&&(Ae=L(Ae)),M(Ae,n.ADD_ATTR)),n.ADD_URI_SAFE_ATTR&&M(Ye,n.ADD_URI_SAFE_ATTR),n.FORBID_CONTENTS&&(Pe===Ge&&(Pe=L(Pe)),M(Pe,n.FORBID_CONTENTS)),ze&&(Ne["#text"]=!0),Re&&M(Ne,["html","head","body"]),Ne.table&&(M(Ne,["tbody"]),delete ke.tbody),h&&h(n),rt=n)},lt=M({},["mi","mo","mn","ms","mtext"]),ct=M({},["foreignobject","desc","title","annotation-xml"]),ut=M({},["title","style","font","a","script"]),st=M({},H);M(st,U),M(st,z);var mt=M({},B);M(mt,j);var ft=function e(t){var n=C(t);n&&n.tagName||(n={namespaceURI:Xe,tagName:"template"});var r=w(t.tagName),o=w(n.tagName);return t.namespaceURI===$e?n.namespaceURI===Xe?"svg"===r:n.namespaceURI===Ve?"svg"===r&&("annotation-xml"===o||lt[o]):Boolean(st[r]):t.namespaceURI===Ve?n.namespaceURI===Xe?"math"===r:n.namespaceURI===$e?"math"===r&&ct[o]:Boolean(mt[r]):t.namespaceURI===Xe&&(!(n.namespaceURI===$e&&!ct[o])&&(!(n.namespaceURI===Ve&&!lt[o])&&(!mt[r]&&(ut[r]||!st[r]))))},pt=function e(t){A(n.removed,{element:t});try{t.parentNode.removeChild(t)}catch(e){try{t.outerHTML=ae}catch(e){t.remove()}}},dt=function e(t,r){try{A(n.removed,{attribute:r.getAttributeNode(t),from:r})}catch(e){A(n.removed,{attribute:null,from:r})}if(r.removeAttribute(t),"is"===t&&!Ae[t])if(Ie||Fe)try{pt(r)}catch(e){}else try{r.setAttribute(t,"")}catch(e){}},ht=function e(t){var n,r;if(Le)t="<remove></remove>"+t;else{var o=x(t,/^[\r\n\t ]+/);r=o&&o[0]}"application/xhtml+xml"===Qe&&(t='<html xmlns="http://www.w3.org/1999/xhtml"><head></head><body>'+t+"</body></html>");var i=re?re.createHTML(t):t;if(Ze===Xe)try{n=(new d).parseFromString(i,Qe)}catch(e){}if(!n||!n.documentElement){n=le.createDocument(Ze,"template",null);try{n.documentElement.innerHTML=Je?"":i}catch(e){}}var l=n.body||n.documentElement;return t&&r&&l.insertBefore(a.createTextNode(r),l.childNodes[0]||null),Ze===Xe?se.call(n,Re?"html":"body")[0]:Re?n.documentElement:l},gt=function e(t){return ce.call(t.ownerDocument||t,t,s.SHOW_ELEMENT|s.SHOW_COMMENT|s.SHOW_TEXT,null,!1)},yt=function e(t){return t instanceof p&&("string"!=typeof t.nodeName||"string"!=typeof t.textContent||"function"!=typeof t.removeChild||!(t.attributes instanceof f)||"function"!=typeof t.removeAttribute||"function"!=typeof t.setAttribute||"string"!=typeof t.namespaceURI||"function"!=typeof t.insertBefore)},bt=function t(n){return"object"===e(c)?n instanceof c:n&&"object"===e(n)&&"number"==typeof n.nodeType&&"string"==typeof n.nodeName},vt=function e(t,r,o){pe[t]&&N(pe[t],(function(e){e.call(n,r,o,rt)}))},Tt=function e(t){var r;if(vt("beforeSanitizeElements",t,null),yt(t))return pt(t),!0;if(O(/[\u0080-\uFFFF]/,t.nodeName))return pt(t),!0;var o=nt(t.nodeName);if(vt("uponSanitizeElement",t,{tagName:o,allowedTags:Ne}),t.hasChildNodes()&&!bt(t.firstElementChild)&&(!bt(t.content)||!bt(t.content.firstElementChild))&&O(/<[/\w]/g,t.innerHTML)&&O(/<[/\w]/g,t.textContent))return pt(t),!0;if("select"===o&&O(/<template/i,t.innerHTML))return pt(t),!0;if(!Ne[o]||ke[o]){if(!ke[o]&&Et(o)){if(xe.tagNameCheck instanceof RegExp&&O(xe.tagNameCheck,o))return!1;if(xe.tagNameCheck instanceof Function&&xe.tagNameCheck(o))return!1}if(ze&&!Pe[o]){var a=C(t)||t.parentNode,i=T(t)||t.childNodes;if(i&&a)for(var l,c=i.length-1;c>=0;--c)a.insertBefore(b(i[c],!0),v(t))}return pt(t),!0}return t instanceof u&&!ft(t)?(pt(t),!0):"noscript"!==o&&"noembed"!==o||!O(/<\/no(script|embed)/i,t.innerHTML)?(Ce&&3===t.nodeType&&(r=t.textContent,r=k(r,de," "),r=k(r,he," "),t.textContent!==r&&(A(n.removed,{element:t.cloneNode()}),t.textContent=r)),vt("afterSanitizeElements",t,null),!1):(pt(t),!0)},Nt=function e(t,n,r){if(Ue&&("id"===n||"name"===n)&&(r in a||r in ot))return!1;if(Oe&&!Se[n]&&O(ge,n));else if(_e&&O(ye,n));else if(!Ae[n]||Se[n]){if(!(Et(t)&&(xe.tagNameCheck instanceof RegExp&&O(xe.tagNameCheck,t)||xe.tagNameCheck instanceof Function&&xe.tagNameCheck(t))&&(xe.attributeNameCheck instanceof RegExp&&O(xe.attributeNameCheck,n)||xe.attributeNameCheck instanceof Function&&xe.attributeNameCheck(n))||"is"===n&&xe.allowCustomizedBuiltInElements&&(xe.tagNameCheck instanceof RegExp&&O(xe.tagNameCheck,r)||xe.tagNameCheck instanceof Function&&xe.tagNameCheck(r))))return!1}else if(Ye[n]);else if(O(Te,k(r,ve,"")));else if("src"!==n&&"xlink:href"!==n&&"href"!==n||"script"===t||0!==S(r,"data:")||!We[t]){if(De&&!O(be,k(r,ve,"")));else if(r)return!1}else;return!0},Et=function e(t){return t.indexOf("-")>0},At=function e(t){var r,o,a,i;vt("beforeSanitizeAttributes",t,null);var l=t.attributes;if(l){var c={attrName:"",attrValue:"",keepAttr:!0,allowedAttributes:Ae};for(i=l.length;i--;){var u=r=l[i],s=u.name,m=u.namespaceURI;if(o="value"===s?r.value:_(r.value),a=nt(s),c.attrName=a,c.attrValue=o,c.keepAttr=!0,c.forceKeepAttr=void 0,vt("uponSanitizeAttribute",t,c),o=c.attrValue,!c.forceKeepAttr&&(dt(s,t),c.keepAttr))if(O(/\/>/i,o))dt(s,t);else{Ce&&(o=k(o,de," "),o=k(o,he," "));var f=nt(t.nodeName);if(Nt(f,a,o))try{m?t.setAttributeNS(m,s,o):t.setAttribute(s,o),E(n.removed)}catch(e){}}}vt("afterSanitizeAttributes",t,null)}},wt=function e(t){var n,r=gt(t);for(vt("beforeSanitizeShadowDOM",t,null);n=r.nextNode();)vt("uponSanitizeShadowNode",n,null),Tt(n)||(n.content instanceof i&&e(n.content),At(n));vt("afterSanitizeShadowDOM",t,null)};return n.sanitize=function(o,a){var l,u,s,m,f;if((Je=!o)&&(o="\x3c!--\x3e"),"string"!=typeof o&&!bt(o)){if("function"!=typeof o.toString)throw D("toString is not a function");if("string"!=typeof(o=o.toString()))throw D("dirty is not a string, aborting")}if(!n.isSupported){if("object"===e(t.toStaticHTML)||"function"==typeof t.toStaticHTML){if("string"==typeof o)return t.toStaticHTML(o);if(bt(o))return t.toStaticHTML(o.outerHTML)}return o}if(Me||it(a),n.removed=[],"string"==typeof o&&(Be=!1),Be){if(o.nodeName){var p=nt(o.nodeName);if(!Ne[p]||ke[p])throw D("root node is forbidden and cannot be sanitized in-place")}}else if(o instanceof c)1===(u=(l=ht("\x3c!----\x3e")).ownerDocument.importNode(o,!0)).nodeType&&"BODY"===u.nodeName||"HTML"===u.nodeName?l=u:l.appendChild(u);else{if(!Ie&&!Ce&&!Re&&-1===o.indexOf("<"))return re&&He?re.createHTML(o):o;if(!(l=ht(o)))return Ie?null:He?ae:""}l&&Le&&pt(l.firstChild);for(var d=gt(Be?o:l);s=d.nextNode();)3===s.nodeType&&s===m||Tt(s)||(s.content instanceof i&&wt(s.content),At(s),m=s);if(m=null,Be)return o;if(Ie){if(Fe)for(f=ue.call(l.ownerDocument);l.firstChild;)f.appendChild(l.firstChild);else f=l;return Ae.shadowroot&&(f=me.call(r,f,!0)),f}var h=Re?l.outerHTML:l.innerHTML;return Re&&Ne["!doctype"]&&l.ownerDocument&&l.ownerDocument.doctype&&l.ownerDocument.doctype.name&&O(ee,l.ownerDocument.doctype.name)&&(h="<!DOCTYPE "+l.ownerDocument.doctype.name+">\n"+h),Ce&&(h=k(h,de," "),h=k(h,he," ")),re&&He?re.createHTML(h):h},n.setConfig=function(e){it(e),Me=!0},n.clearConfig=function(){rt=null,Me=!1},n.isValidAttribute=function(e,t,n){rt||it({});var r=nt(e),o=nt(t);return Nt(r,o,n)},n.addHook=function(e,t){"function"==typeof t&&(pe[e]=pe[e]||[],A(pe[e],t))},n.removeHook=function(e){if(pe[e])return E(pe[e])},n.removeHooks=function(e){pe[e]&&(pe[e]=[])},n.removeAllHooks=function(){pe={}},n}return oe()}))}))})();
//# sourceMappingURL=purify.5b82c49b.js.map
