true&&(function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(link) {
    const fetchOpts = {};
    if (link.integrity) fetchOpts.integrity = link.integrity;
    if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
    if (link.crossOrigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
    else fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
}());

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var jsxRuntime = {exports: {}};

var reactJsxRuntime_production_min = {};

var react = {exports: {}};

var react_production_min = {};

/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var l$1=Symbol.for("react.element"),n$1=Symbol.for("react.portal"),p$2=Symbol.for("react.fragment"),q$1=Symbol.for("react.strict_mode"),r=Symbol.for("react.profiler"),t=Symbol.for("react.provider"),u=Symbol.for("react.context"),v$1=Symbol.for("react.forward_ref"),w=Symbol.for("react.suspense"),x=Symbol.for("react.memo"),y=Symbol.for("react.lazy"),z$1=Symbol.iterator;function A$1(a){if(null===a||"object"!==typeof a)return null;a=z$1&&a[z$1]||a["@@iterator"];return "function"===typeof a?a:null}
var B$1={isMounted:function(){return  false},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},C$1=Object.assign,D$1={};function E$1(a,b,e){this.props=a;this.context=b;this.refs=D$1;this.updater=e||B$1;}E$1.prototype.isReactComponent={};
E$1.prototype.setState=function(a,b){if("object"!==typeof a&&"function"!==typeof a&&null!=a)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,a,b,"setState");};E$1.prototype.forceUpdate=function(a){this.updater.enqueueForceUpdate(this,a,"forceUpdate");};function F(){}F.prototype=E$1.prototype;function G$1(a,b,e){this.props=a;this.context=b;this.refs=D$1;this.updater=e||B$1;}var H$1=G$1.prototype=new F;
H$1.constructor=G$1;C$1(H$1,E$1.prototype);H$1.isPureReactComponent=true;var I$1=Array.isArray,J=Object.prototype.hasOwnProperty,K$1={current:null},L$1={key:true,ref:true,__self:true,__source:true};
function M$1(a,b,e){var d,c={},k=null,h=null;if(null!=b)for(d in void 0!==b.ref&&(h=b.ref),void 0!==b.key&&(k=""+b.key),b)J.call(b,d)&&!L$1.hasOwnProperty(d)&&(c[d]=b[d]);var g=arguments.length-2;if(1===g)c.children=e;else if(1<g){for(var f=Array(g),m=0;m<g;m++)f[m]=arguments[m+2];c.children=f;}if(a&&a.defaultProps)for(d in g=a.defaultProps,g) void 0===c[d]&&(c[d]=g[d]);return {$$typeof:l$1,type:a,key:k,ref:h,props:c,_owner:K$1.current}}
function N$1(a,b){return {$$typeof:l$1,type:a.type,key:b,ref:a.ref,props:a.props,_owner:a._owner}}function O$1(a){return "object"===typeof a&&null!==a&&a.$$typeof===l$1}function escape(a){var b={"=":"=0",":":"=2"};return "$"+a.replace(/[=:]/g,function(a){return b[a]})}var P$1=/\/+/g;function Q$1(a,b){return "object"===typeof a&&null!==a&&null!=a.key?escape(""+a.key):b.toString(36)}
function R$1(a,b,e,d,c){var k=typeof a;if("undefined"===k||"boolean"===k)a=null;var h=false;if(null===a)h=true;else switch(k){case "string":case "number":h=true;break;case "object":switch(a.$$typeof){case l$1:case n$1:h=true;}}if(h)return h=a,c=c(h),a=""===d?"."+Q$1(h,0):d,I$1(c)?(e="",null!=a&&(e=a.replace(P$1,"$&/")+"/"),R$1(c,b,e,"",function(a){return a})):null!=c&&(O$1(c)&&(c=N$1(c,e+(!c.key||h&&h.key===c.key?"":(""+c.key).replace(P$1,"$&/")+"/")+a)),b.push(c)),1;h=0;d=""===d?".":d+":";if(I$1(a))for(var g=0;g<a.length;g++){k=
a[g];var f=d+Q$1(k,g);h+=R$1(k,b,e,f,c);}else if(f=A$1(a),"function"===typeof f)for(a=f.call(a),g=0;!(k=a.next()).done;)k=k.value,f=d+Q$1(k,g++),h+=R$1(k,b,e,f,c);else if("object"===k)throw b=String(a),Error("Objects are not valid as a React child (found: "+("[object Object]"===b?"object with keys {"+Object.keys(a).join(", ")+"}":b)+"). If you meant to render a collection of children, use an array instead.");return h}
function S$1(a,b,e){if(null==a)return a;var d=[],c=0;R$1(a,d,"","",function(a){return b.call(e,a,c++)});return d}function T$1(a){if(-1===a._status){var b=a._result;b=b();b.then(function(b){if(0===a._status||-1===a._status)a._status=1,a._result=b;},function(b){if(0===a._status||-1===a._status)a._status=2,a._result=b;});-1===a._status&&(a._status=0,a._result=b);}if(1===a._status)return a._result.default;throw a._result;}
var U$1={current:null},V$1={transition:null},W$1={ReactCurrentDispatcher:U$1,ReactCurrentBatchConfig:V$1,ReactCurrentOwner:K$1};function X$1(){throw Error("act(...) is not supported in production builds of React.");}
react_production_min.Children={map:S$1,forEach:function(a,b,e){S$1(a,function(){b.apply(this,arguments);},e);},count:function(a){var b=0;S$1(a,function(){b++;});return b},toArray:function(a){return S$1(a,function(a){return a})||[]},only:function(a){if(!O$1(a))throw Error("React.Children.only expected to receive a single React element child.");return a}};react_production_min.Component=E$1;react_production_min.Fragment=p$2;react_production_min.Profiler=r;react_production_min.PureComponent=G$1;react_production_min.StrictMode=q$1;react_production_min.Suspense=w;
react_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=W$1;react_production_min.act=X$1;
react_production_min.cloneElement=function(a,b,e){if(null===a||void 0===a)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+a+".");var d=C$1({},a.props),c=a.key,k=a.ref,h=a._owner;if(null!=b){ void 0!==b.ref&&(k=b.ref,h=K$1.current);void 0!==b.key&&(c=""+b.key);if(a.type&&a.type.defaultProps)var g=a.type.defaultProps;for(f in b)J.call(b,f)&&!L$1.hasOwnProperty(f)&&(d[f]=void 0===b[f]&&void 0!==g?g[f]:b[f]);}var f=arguments.length-2;if(1===f)d.children=e;else if(1<f){g=Array(f);
for(var m=0;m<f;m++)g[m]=arguments[m+2];d.children=g;}return {$$typeof:l$1,type:a.type,key:c,ref:k,props:d,_owner:h}};react_production_min.createContext=function(a){a={$$typeof:u,_currentValue:a,_currentValue2:a,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null};a.Provider={$$typeof:t,_context:a};return a.Consumer=a};react_production_min.createElement=M$1;react_production_min.createFactory=function(a){var b=M$1.bind(null,a);b.type=a;return b};react_production_min.createRef=function(){return {current:null}};
react_production_min.forwardRef=function(a){return {$$typeof:v$1,render:a}};react_production_min.isValidElement=O$1;react_production_min.lazy=function(a){return {$$typeof:y,_payload:{_status:-1,_result:a},_init:T$1}};react_production_min.memo=function(a,b){return {$$typeof:x,type:a,compare:void 0===b?null:b}};react_production_min.startTransition=function(a){var b=V$1.transition;V$1.transition={};try{a();}finally{V$1.transition=b;}};react_production_min.unstable_act=X$1;react_production_min.useCallback=function(a,b){return U$1.current.useCallback(a,b)};react_production_min.useContext=function(a){return U$1.current.useContext(a)};
react_production_min.useDebugValue=function(){};react_production_min.useDeferredValue=function(a){return U$1.current.useDeferredValue(a)};react_production_min.useEffect=function(a,b){return U$1.current.useEffect(a,b)};react_production_min.useId=function(){return U$1.current.useId()};react_production_min.useImperativeHandle=function(a,b,e){return U$1.current.useImperativeHandle(a,b,e)};react_production_min.useInsertionEffect=function(a,b){return U$1.current.useInsertionEffect(a,b)};react_production_min.useLayoutEffect=function(a,b){return U$1.current.useLayoutEffect(a,b)};
react_production_min.useMemo=function(a,b){return U$1.current.useMemo(a,b)};react_production_min.useReducer=function(a,b,e){return U$1.current.useReducer(a,b,e)};react_production_min.useRef=function(a){return U$1.current.useRef(a)};react_production_min.useState=function(a){return U$1.current.useState(a)};react_production_min.useSyncExternalStore=function(a,b,e){return U$1.current.useSyncExternalStore(a,b,e)};react_production_min.useTransition=function(){return U$1.current.useTransition()};react_production_min.version="18.3.1";

{
  react.exports = react_production_min;
}

var reactExports = react.exports;
const React$2 = /*@__PURE__*/getDefaultExportFromCjs(reactExports);

/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var f=reactExports,k=Symbol.for("react.element"),l=Symbol.for("react.fragment"),m$1=Object.prototype.hasOwnProperty,n=f.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,p$1={key:true,ref:true,__self:true,__source:true};
function q(c,a,g){var b,d={},e=null,h=null;void 0!==g&&(e=""+g);void 0!==a.key&&(e=""+a.key);void 0!==a.ref&&(h=a.ref);for(b in a)m$1.call(a,b)&&!p$1.hasOwnProperty(b)&&(d[b]=a[b]);if(c&&c.defaultProps)for(b in a=c.defaultProps,a) void 0===d[b]&&(d[b]=a[b]);return {$$typeof:k,type:c,key:e,ref:h,props:d,_owner:n.current}}reactJsxRuntime_production_min.Fragment=l;reactJsxRuntime_production_min.jsx=q;reactJsxRuntime_production_min.jsxs=q;

{
  jsxRuntime.exports = reactJsxRuntime_production_min;
}

var jsxRuntimeExports = jsxRuntime.exports;

var reactDom = {exports: {}};

var reactDom_production_min = {};

var scheduler = {exports: {}};

var scheduler_production_min = {};

/**
 * @license React
 * scheduler.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

(function (exports$1) {
function f(a,b){var c=a.length;a.push(b);a:for(;0<c;){var d=c-1>>>1,e=a[d];if(0<g(e,b))a[d]=b,a[c]=e,c=d;else break a}}function h(a){return 0===a.length?null:a[0]}function k(a){if(0===a.length)return null;var b=a[0],c=a.pop();if(c!==b){a[0]=c;a:for(var d=0,e=a.length,w=e>>>1;d<w;){var m=2*(d+1)-1,C=a[m],n=m+1,x=a[n];if(0>g(C,c))n<e&&0>g(x,C)?(a[d]=x,a[n]=c,d=n):(a[d]=C,a[m]=c,d=m);else if(n<e&&0>g(x,c))a[d]=x,a[n]=c,d=n;else break a}}return b}
	function g(a,b){var c=a.sortIndex-b.sortIndex;return 0!==c?c:a.id-b.id}if("object"===typeof performance&&"function"===typeof performance.now){var l=performance;exports$1.unstable_now=function(){return l.now()};}else {var p=Date,q=p.now();exports$1.unstable_now=function(){return p.now()-q};}var r=[],t=[],u=1,v=null,y=3,z=false,A=false,B=false,D="function"===typeof setTimeout?setTimeout:null,E="function"===typeof clearTimeout?clearTimeout:null,F="undefined"!==typeof setImmediate?setImmediate:null;
	"undefined"!==typeof navigator&&void 0!==navigator.scheduling&&void 0!==navigator.scheduling.isInputPending&&navigator.scheduling.isInputPending.bind(navigator.scheduling);function G(a){for(var b=h(t);null!==b;){if(null===b.callback)k(t);else if(b.startTime<=a)k(t),b.sortIndex=b.expirationTime,f(r,b);else break;b=h(t);}}function H(a){B=false;G(a);if(!A)if(null!==h(r))A=true,I(J);else {var b=h(t);null!==b&&K(H,b.startTime-a);}}
	function J(a,b){A=false;B&&(B=false,E(L),L=-1);z=true;var c=y;try{G(b);for(v=h(r);null!==v&&(!(v.expirationTime>b)||a&&!M());){var d=v.callback;if("function"===typeof d){v.callback=null;y=v.priorityLevel;var e=d(v.expirationTime<=b);b=exports$1.unstable_now();"function"===typeof e?v.callback=e:v===h(r)&&k(r);G(b);}else k(r);v=h(r);}if(null!==v)var w=!0;else {var m=h(t);null!==m&&K(H,m.startTime-b);w=!1;}return w}finally{v=null,y=c,z=false;}}var N=false,O=null,L=-1,P=5,Q=-1;
	function M(){return exports$1.unstable_now()-Q<P?false:true}function R(){if(null!==O){var a=exports$1.unstable_now();Q=a;var b=true;try{b=O(!0,a);}finally{b?S():(N=false,O=null);}}else N=false;}var S;if("function"===typeof F)S=function(){F(R);};else if("undefined"!==typeof MessageChannel){var T=new MessageChannel,U=T.port2;T.port1.onmessage=R;S=function(){U.postMessage(null);};}else S=function(){D(R,0);};function I(a){O=a;N||(N=true,S());}function K(a,b){L=D(function(){a(exports$1.unstable_now());},b);}
	exports$1.unstable_IdlePriority=5;exports$1.unstable_ImmediatePriority=1;exports$1.unstable_LowPriority=4;exports$1.unstable_NormalPriority=3;exports$1.unstable_Profiling=null;exports$1.unstable_UserBlockingPriority=2;exports$1.unstable_cancelCallback=function(a){a.callback=null;};exports$1.unstable_continueExecution=function(){A||z||(A=true,I(J));};
	exports$1.unstable_forceFrameRate=function(a){0>a||125<a?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):P=0<a?Math.floor(1E3/a):5;};exports$1.unstable_getCurrentPriorityLevel=function(){return y};exports$1.unstable_getFirstCallbackNode=function(){return h(r)};exports$1.unstable_next=function(a){switch(y){case 1:case 2:case 3:var b=3;break;default:b=y;}var c=y;y=b;try{return a()}finally{y=c;}};exports$1.unstable_pauseExecution=function(){};
	exports$1.unstable_requestPaint=function(){};exports$1.unstable_runWithPriority=function(a,b){switch(a){case 1:case 2:case 3:case 4:case 5:break;default:a=3;}var c=y;y=a;try{return b()}finally{y=c;}};
	exports$1.unstable_scheduleCallback=function(a,b,c){var d=exports$1.unstable_now();"object"===typeof c&&null!==c?(c=c.delay,c="number"===typeof c&&0<c?d+c:d):c=d;switch(a){case 1:var e=-1;break;case 2:e=250;break;case 5:e=1073741823;break;case 4:e=1E4;break;default:e=5E3;}e=c+e;a={id:u++,callback:b,priorityLevel:a,startTime:c,expirationTime:e,sortIndex:-1};c>d?(a.sortIndex=c,f(t,a),null===h(r)&&a===h(t)&&(B?(E(L),L=-1):B=true,K(H,c-d))):(a.sortIndex=e,f(r,a),A||z||(A=true,I(J)));return a};
	exports$1.unstable_shouldYield=M;exports$1.unstable_wrapCallback=function(a){var b=y;return function(){var c=y;y=b;try{return a.apply(this,arguments)}finally{y=c;}}}; 
} (scheduler_production_min));

{
  scheduler.exports = scheduler_production_min;
}

var schedulerExports = scheduler.exports;

/**
 * @license React
 * react-dom.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var aa=reactExports,ca=schedulerExports;function p(a){for(var b="https://reactjs.org/docs/error-decoder.html?invariant="+a,c=1;c<arguments.length;c++)b+="&args[]="+encodeURIComponent(arguments[c]);return "Minified React error #"+a+"; visit "+b+" for the full message or use the non-minified dev environment for full errors and additional helpful warnings."}var da=new Set,ea={};function fa(a,b){ha(a,b);ha(a+"Capture",b);}
function ha(a,b){ea[a]=b;for(a=0;a<b.length;a++)da.add(b[a]);}
var ia=!("undefined"===typeof window||"undefined"===typeof window.document||"undefined"===typeof window.document.createElement),ja=Object.prototype.hasOwnProperty,ka=/^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,la=
{},ma={};function oa(a){if(ja.call(ma,a))return  true;if(ja.call(la,a))return  false;if(ka.test(a))return ma[a]=true;la[a]=true;return  false}function pa(a,b,c,d){if(null!==c&&0===c.type)return  false;switch(typeof b){case "function":case "symbol":return  true;case "boolean":if(d)return  false;if(null!==c)return !c.acceptsBooleans;a=a.toLowerCase().slice(0,5);return "data-"!==a&&"aria-"!==a;default:return  false}}
function qa(a,b,c,d){if(null===b||"undefined"===typeof b||pa(a,b,c,d))return  true;if(d)return  false;if(null!==c)switch(c.type){case 3:return !b;case 4:return  false===b;case 5:return isNaN(b);case 6:return isNaN(b)||1>b}return  false}function v(a,b,c,d,e,f,g){this.acceptsBooleans=2===b||3===b||4===b;this.attributeName=d;this.attributeNamespace=e;this.mustUseProperty=c;this.propertyName=a;this.type=b;this.sanitizeURL=f;this.removeEmptyString=g;}var z={};
"children dangerouslySetInnerHTML defaultValue defaultChecked innerHTML suppressContentEditableWarning suppressHydrationWarning style".split(" ").forEach(function(a){z[a]=new v(a,0,false,a,null,false,false);});[["acceptCharset","accept-charset"],["className","class"],["htmlFor","for"],["httpEquiv","http-equiv"]].forEach(function(a){var b=a[0];z[b]=new v(b,1,false,a[1],null,false,false);});["contentEditable","draggable","spellCheck","value"].forEach(function(a){z[a]=new v(a,2,false,a.toLowerCase(),null,false,false);});
["autoReverse","externalResourcesRequired","focusable","preserveAlpha"].forEach(function(a){z[a]=new v(a,2,false,a,null,false,false);});"allowFullScreen async autoFocus autoPlay controls default defer disabled disablePictureInPicture disableRemotePlayback formNoValidate hidden loop noModule noValidate open playsInline readOnly required reversed scoped seamless itemScope".split(" ").forEach(function(a){z[a]=new v(a,3,false,a.toLowerCase(),null,false,false);});
["checked","multiple","muted","selected"].forEach(function(a){z[a]=new v(a,3,true,a,null,false,false);});["capture","download"].forEach(function(a){z[a]=new v(a,4,false,a,null,false,false);});["cols","rows","size","span"].forEach(function(a){z[a]=new v(a,6,false,a,null,false,false);});["rowSpan","start"].forEach(function(a){z[a]=new v(a,5,false,a.toLowerCase(),null,false,false);});var ra=/[\-:]([a-z])/g;function sa(a){return a[1].toUpperCase()}
"accent-height alignment-baseline arabic-form baseline-shift cap-height clip-path clip-rule color-interpolation color-interpolation-filters color-profile color-rendering dominant-baseline enable-background fill-opacity fill-rule flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight glyph-name glyph-orientation-horizontal glyph-orientation-vertical horiz-adv-x horiz-origin-x image-rendering letter-spacing lighting-color marker-end marker-mid marker-start overline-position overline-thickness paint-order panose-1 pointer-events rendering-intent shape-rendering stop-color stop-opacity strikethrough-position strikethrough-thickness stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width text-anchor text-decoration text-rendering underline-position underline-thickness unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical vector-effect vert-adv-y vert-origin-x vert-origin-y word-spacing writing-mode xmlns:xlink x-height".split(" ").forEach(function(a){var b=a.replace(ra,
sa);z[b]=new v(b,1,false,a,null,false,false);});"xlink:actuate xlink:arcrole xlink:role xlink:show xlink:title xlink:type".split(" ").forEach(function(a){var b=a.replace(ra,sa);z[b]=new v(b,1,false,a,"http://www.w3.org/1999/xlink",false,false);});["xml:base","xml:lang","xml:space"].forEach(function(a){var b=a.replace(ra,sa);z[b]=new v(b,1,false,a,"http://www.w3.org/XML/1998/namespace",false,false);});["tabIndex","crossOrigin"].forEach(function(a){z[a]=new v(a,1,false,a.toLowerCase(),null,false,false);});
z.xlinkHref=new v("xlinkHref",1,false,"xlink:href","http://www.w3.org/1999/xlink",true,false);["src","href","action","formAction"].forEach(function(a){z[a]=new v(a,1,false,a.toLowerCase(),null,true,true);});
function ta(a,b,c,d){var e=z.hasOwnProperty(b)?z[b]:null;if(null!==e?0!==e.type:d||!(2<b.length)||"o"!==b[0]&&"O"!==b[0]||"n"!==b[1]&&"N"!==b[1])qa(b,c,e,d)&&(c=null),d||null===e?oa(b)&&(null===c?a.removeAttribute(b):a.setAttribute(b,""+c)):e.mustUseProperty?a[e.propertyName]=null===c?3===e.type?false:"":c:(b=e.attributeName,d=e.attributeNamespace,null===c?a.removeAttribute(b):(e=e.type,c=3===e||4===e&&true===c?"":""+c,d?a.setAttributeNS(d,b,c):a.setAttribute(b,c)));}
var ua=aa.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED,va=Symbol.for("react.element"),wa=Symbol.for("react.portal"),ya=Symbol.for("react.fragment"),za=Symbol.for("react.strict_mode"),Aa=Symbol.for("react.profiler"),Ba=Symbol.for("react.provider"),Ca=Symbol.for("react.context"),Da=Symbol.for("react.forward_ref"),Ea=Symbol.for("react.suspense"),Fa=Symbol.for("react.suspense_list"),Ga=Symbol.for("react.memo"),Ha=Symbol.for("react.lazy");var Ia=Symbol.for("react.offscreen");var Ja=Symbol.iterator;function Ka(a){if(null===a||"object"!==typeof a)return null;a=Ja&&a[Ja]||a["@@iterator"];return "function"===typeof a?a:null}var A=Object.assign,La;function Ma(a){if(void 0===La)try{throw Error();}catch(c){var b=c.stack.trim().match(/\n( *(at )?)/);La=b&&b[1]||"";}return "\n"+La+a}var Na=false;
function Oa(a,b){if(!a||Na)return "";Na=true;var c=Error.prepareStackTrace;Error.prepareStackTrace=void 0;try{if(b)if(b=function(){throw Error();},Object.defineProperty(b.prototype,"props",{set:function(){throw Error();}}),"object"===typeof Reflect&&Reflect.construct){try{Reflect.construct(b,[]);}catch(l){var d=l;}Reflect.construct(a,[],b);}else {try{b.call();}catch(l){d=l;}a.call(b.prototype);}else {try{throw Error();}catch(l){d=l;}a();}}catch(l){if(l&&d&&"string"===typeof l.stack){for(var e=l.stack.split("\n"),
f=d.stack.split("\n"),g=e.length-1,h=f.length-1;1<=g&&0<=h&&e[g]!==f[h];)h--;for(;1<=g&&0<=h;g--,h--)if(e[g]!==f[h]){if(1!==g||1!==h){do if(g--,h--,0>h||e[g]!==f[h]){var k="\n"+e[g].replace(" at new "," at ");a.displayName&&k.includes("<anonymous>")&&(k=k.replace("<anonymous>",a.displayName));return k}while(1<=g&&0<=h)}break}}}finally{Na=false,Error.prepareStackTrace=c;}return (a=a?a.displayName||a.name:"")?Ma(a):""}
function Pa(a){switch(a.tag){case 5:return Ma(a.type);case 16:return Ma("Lazy");case 13:return Ma("Suspense");case 19:return Ma("SuspenseList");case 0:case 2:case 15:return a=Oa(a.type,false),a;case 11:return a=Oa(a.type.render,false),a;case 1:return a=Oa(a.type,true),a;default:return ""}}
function Qa(a){if(null==a)return null;if("function"===typeof a)return a.displayName||a.name||null;if("string"===typeof a)return a;switch(a){case ya:return "Fragment";case wa:return "Portal";case Aa:return "Profiler";case za:return "StrictMode";case Ea:return "Suspense";case Fa:return "SuspenseList"}if("object"===typeof a)switch(a.$$typeof){case Ca:return (a.displayName||"Context")+".Consumer";case Ba:return (a._context.displayName||"Context")+".Provider";case Da:var b=a.render;a=a.displayName;a||(a=b.displayName||
b.name||"",a=""!==a?"ForwardRef("+a+")":"ForwardRef");return a;case Ga:return b=a.displayName||null,null!==b?b:Qa(a.type)||"Memo";case Ha:b=a._payload;a=a._init;try{return Qa(a(b))}catch(c){}}return null}
function Ra(a){var b=a.type;switch(a.tag){case 24:return "Cache";case 9:return (b.displayName||"Context")+".Consumer";case 10:return (b._context.displayName||"Context")+".Provider";case 18:return "DehydratedFragment";case 11:return a=b.render,a=a.displayName||a.name||"",b.displayName||(""!==a?"ForwardRef("+a+")":"ForwardRef");case 7:return "Fragment";case 5:return b;case 4:return "Portal";case 3:return "Root";case 6:return "Text";case 16:return Qa(b);case 8:return b===za?"StrictMode":"Mode";case 22:return "Offscreen";
case 12:return "Profiler";case 21:return "Scope";case 13:return "Suspense";case 19:return "SuspenseList";case 25:return "TracingMarker";case 1:case 0:case 17:case 2:case 14:case 15:if("function"===typeof b)return b.displayName||b.name||null;if("string"===typeof b)return b}return null}function Sa(a){switch(typeof a){case "boolean":case "number":case "string":case "undefined":return a;case "object":return a;default:return ""}}
function Ta(a){var b=a.type;return (a=a.nodeName)&&"input"===a.toLowerCase()&&("checkbox"===b||"radio"===b)}
function Ua(a){var b=Ta(a)?"checked":"value",c=Object.getOwnPropertyDescriptor(a.constructor.prototype,b),d=""+a[b];if(!a.hasOwnProperty(b)&&"undefined"!==typeof c&&"function"===typeof c.get&&"function"===typeof c.set){var e=c.get,f=c.set;Object.defineProperty(a,b,{configurable:true,get:function(){return e.call(this)},set:function(a){d=""+a;f.call(this,a);}});Object.defineProperty(a,b,{enumerable:c.enumerable});return {getValue:function(){return d},setValue:function(a){d=""+a;},stopTracking:function(){a._valueTracker=
null;delete a[b];}}}}function Va(a){a._valueTracker||(a._valueTracker=Ua(a));}function Wa(a){if(!a)return  false;var b=a._valueTracker;if(!b)return  true;var c=b.getValue();var d="";a&&(d=Ta(a)?a.checked?"true":"false":a.value);a=d;return a!==c?(b.setValue(a),true):false}function Xa(a){a=a||("undefined"!==typeof document?document:void 0);if("undefined"===typeof a)return null;try{return a.activeElement||a.body}catch(b){return a.body}}
function Ya(a,b){var c=b.checked;return A({},b,{defaultChecked:void 0,defaultValue:void 0,value:void 0,checked:null!=c?c:a._wrapperState.initialChecked})}function Za(a,b){var c=null==b.defaultValue?"":b.defaultValue,d=null!=b.checked?b.checked:b.defaultChecked;c=Sa(null!=b.value?b.value:c);a._wrapperState={initialChecked:d,initialValue:c,controlled:"checkbox"===b.type||"radio"===b.type?null!=b.checked:null!=b.value};}function ab(a,b){b=b.checked;null!=b&&ta(a,"checked",b,false);}
function bb(a,b){ab(a,b);var c=Sa(b.value),d=b.type;if(null!=c)if("number"===d){if(0===c&&""===a.value||a.value!=c)a.value=""+c;}else a.value!==""+c&&(a.value=""+c);else if("submit"===d||"reset"===d){a.removeAttribute("value");return}b.hasOwnProperty("value")?cb(a,b.type,c):b.hasOwnProperty("defaultValue")&&cb(a,b.type,Sa(b.defaultValue));null==b.checked&&null!=b.defaultChecked&&(a.defaultChecked=!!b.defaultChecked);}
function db(a,b,c){if(b.hasOwnProperty("value")||b.hasOwnProperty("defaultValue")){var d=b.type;if(!("submit"!==d&&"reset"!==d||void 0!==b.value&&null!==b.value))return;b=""+a._wrapperState.initialValue;c||b===a.value||(a.value=b);a.defaultValue=b;}c=a.name;""!==c&&(a.name="");a.defaultChecked=!!a._wrapperState.initialChecked;""!==c&&(a.name=c);}
function cb(a,b,c){if("number"!==b||Xa(a.ownerDocument)!==a)null==c?a.defaultValue=""+a._wrapperState.initialValue:a.defaultValue!==""+c&&(a.defaultValue=""+c);}var eb=Array.isArray;
function fb(a,b,c,d){a=a.options;if(b){b={};for(var e=0;e<c.length;e++)b["$"+c[e]]=true;for(c=0;c<a.length;c++)e=b.hasOwnProperty("$"+a[c].value),a[c].selected!==e&&(a[c].selected=e),e&&d&&(a[c].defaultSelected=true);}else {c=""+Sa(c);b=null;for(e=0;e<a.length;e++){if(a[e].value===c){a[e].selected=true;d&&(a[e].defaultSelected=true);return}null!==b||a[e].disabled||(b=a[e]);}null!==b&&(b.selected=true);}}
function gb(a,b){if(null!=b.dangerouslySetInnerHTML)throw Error(p(91));return A({},b,{value:void 0,defaultValue:void 0,children:""+a._wrapperState.initialValue})}function hb(a,b){var c=b.value;if(null==c){c=b.children;b=b.defaultValue;if(null!=c){if(null!=b)throw Error(p(92));if(eb(c)){if(1<c.length)throw Error(p(93));c=c[0];}b=c;}null==b&&(b="");c=b;}a._wrapperState={initialValue:Sa(c)};}
function ib(a,b){var c=Sa(b.value),d=Sa(b.defaultValue);null!=c&&(c=""+c,c!==a.value&&(a.value=c),null==b.defaultValue&&a.defaultValue!==c&&(a.defaultValue=c));null!=d&&(a.defaultValue=""+d);}function jb(a){var b=a.textContent;b===a._wrapperState.initialValue&&""!==b&&null!==b&&(a.value=b);}function kb(a){switch(a){case "svg":return "http://www.w3.org/2000/svg";case "math":return "http://www.w3.org/1998/Math/MathML";default:return "http://www.w3.org/1999/xhtml"}}
function lb(a,b){return null==a||"http://www.w3.org/1999/xhtml"===a?kb(b):"http://www.w3.org/2000/svg"===a&&"foreignObject"===b?"http://www.w3.org/1999/xhtml":a}
var mb,nb=function(a){return "undefined"!==typeof MSApp&&MSApp.execUnsafeLocalFunction?function(b,c,d,e){MSApp.execUnsafeLocalFunction(function(){return a(b,c,d,e)});}:a}(function(a,b){if("http://www.w3.org/2000/svg"!==a.namespaceURI||"innerHTML"in a)a.innerHTML=b;else {mb=mb||document.createElement("div");mb.innerHTML="<svg>"+b.valueOf().toString()+"</svg>";for(b=mb.firstChild;a.firstChild;)a.removeChild(a.firstChild);for(;b.firstChild;)a.appendChild(b.firstChild);}});
function ob(a,b){if(b){var c=a.firstChild;if(c&&c===a.lastChild&&3===c.nodeType){c.nodeValue=b;return}}a.textContent=b;}
var pb={animationIterationCount:true,aspectRatio:true,borderImageOutset:true,borderImageSlice:true,borderImageWidth:true,boxFlex:true,boxFlexGroup:true,boxOrdinalGroup:true,columnCount:true,columns:true,flex:true,flexGrow:true,flexPositive:true,flexShrink:true,flexNegative:true,flexOrder:true,gridArea:true,gridRow:true,gridRowEnd:true,gridRowSpan:true,gridRowStart:true,gridColumn:true,gridColumnEnd:true,gridColumnSpan:true,gridColumnStart:true,fontWeight:true,lineClamp:true,lineHeight:true,opacity:true,order:true,orphans:true,tabSize:true,widows:true,zIndex:true,
zoom:true,fillOpacity:true,floodOpacity:true,stopOpacity:true,strokeDasharray:true,strokeDashoffset:true,strokeMiterlimit:true,strokeOpacity:true,strokeWidth:true},qb=["Webkit","ms","Moz","O"];Object.keys(pb).forEach(function(a){qb.forEach(function(b){b=b+a.charAt(0).toUpperCase()+a.substring(1);pb[b]=pb[a];});});function rb(a,b,c){return null==b||"boolean"===typeof b||""===b?"":c||"number"!==typeof b||0===b||pb.hasOwnProperty(a)&&pb[a]?(""+b).trim():b+"px"}
function sb(a,b){a=a.style;for(var c in b)if(b.hasOwnProperty(c)){var d=0===c.indexOf("--"),e=rb(c,b[c],d);"float"===c&&(c="cssFloat");d?a.setProperty(c,e):a[c]=e;}}var tb=A({menuitem:true},{area:true,base:true,br:true,col:true,embed:true,hr:true,img:true,input:true,keygen:true,link:true,meta:true,param:true,source:true,track:true,wbr:true});
function ub(a,b){if(b){if(tb[a]&&(null!=b.children||null!=b.dangerouslySetInnerHTML))throw Error(p(137,a));if(null!=b.dangerouslySetInnerHTML){if(null!=b.children)throw Error(p(60));if("object"!==typeof b.dangerouslySetInnerHTML||!("__html"in b.dangerouslySetInnerHTML))throw Error(p(61));}if(null!=b.style&&"object"!==typeof b.style)throw Error(p(62));}}
function vb(a,b){if(-1===a.indexOf("-"))return "string"===typeof b.is;switch(a){case "annotation-xml":case "color-profile":case "font-face":case "font-face-src":case "font-face-uri":case "font-face-format":case "font-face-name":case "missing-glyph":return  false;default:return  true}}var wb=null;function xb(a){a=a.target||a.srcElement||window;a.correspondingUseElement&&(a=a.correspondingUseElement);return 3===a.nodeType?a.parentNode:a}var yb=null,zb=null,Ab=null;
function Bb(a){if(a=Cb(a)){if("function"!==typeof yb)throw Error(p(280));var b=a.stateNode;b&&(b=Db(b),yb(a.stateNode,a.type,b));}}function Eb(a){zb?Ab?Ab.push(a):Ab=[a]:zb=a;}function Fb(){if(zb){var a=zb,b=Ab;Ab=zb=null;Bb(a);if(b)for(a=0;a<b.length;a++)Bb(b[a]);}}function Gb(a,b){return a(b)}function Hb(){}var Ib=false;function Jb(a,b,c){if(Ib)return a(b,c);Ib=true;try{return Gb(a,b,c)}finally{if(Ib=false,null!==zb||null!==Ab)Hb(),Fb();}}
function Kb(a,b){var c=a.stateNode;if(null===c)return null;var d=Db(c);if(null===d)return null;c=d[b];a:switch(b){case "onClick":case "onClickCapture":case "onDoubleClick":case "onDoubleClickCapture":case "onMouseDown":case "onMouseDownCapture":case "onMouseMove":case "onMouseMoveCapture":case "onMouseUp":case "onMouseUpCapture":case "onMouseEnter":(d=!d.disabled)||(a=a.type,d=!("button"===a||"input"===a||"select"===a||"textarea"===a));a=!d;break a;default:a=false;}if(a)return null;if(c&&"function"!==
typeof c)throw Error(p(231,b,typeof c));return c}var Lb=false;if(ia)try{var Mb={};Object.defineProperty(Mb,"passive",{get:function(){Lb=!0;}});window.addEventListener("test",Mb,Mb);window.removeEventListener("test",Mb,Mb);}catch(a){Lb=false;}function Nb(a,b,c,d,e,f,g,h,k){var l=Array.prototype.slice.call(arguments,3);try{b.apply(c,l);}catch(m){this.onError(m);}}var Ob=false,Pb=null,Qb=false,Rb=null,Sb={onError:function(a){Ob=true;Pb=a;}};function Tb(a,b,c,d,e,f,g,h,k){Ob=false;Pb=null;Nb.apply(Sb,arguments);}
function Ub(a,b,c,d,e,f,g,h,k){Tb.apply(this,arguments);if(Ob){if(Ob){var l=Pb;Ob=false;Pb=null;}else throw Error(p(198));Qb||(Qb=true,Rb=l);}}function Vb(a){var b=a,c=a;if(a.alternate)for(;b.return;)b=b.return;else {a=b;do b=a,0!==(b.flags&4098)&&(c=b.return),a=b.return;while(a)}return 3===b.tag?c:null}function Wb(a){if(13===a.tag){var b=a.memoizedState;null===b&&(a=a.alternate,null!==a&&(b=a.memoizedState));if(null!==b)return b.dehydrated}return null}function Xb(a){if(Vb(a)!==a)throw Error(p(188));}
function Yb(a){var b=a.alternate;if(!b){b=Vb(a);if(null===b)throw Error(p(188));return b!==a?null:a}for(var c=a,d=b;;){var e=c.return;if(null===e)break;var f=e.alternate;if(null===f){d=e.return;if(null!==d){c=d;continue}break}if(e.child===f.child){for(f=e.child;f;){if(f===c)return Xb(e),a;if(f===d)return Xb(e),b;f=f.sibling;}throw Error(p(188));}if(c.return!==d.return)c=e,d=f;else {for(var g=false,h=e.child;h;){if(h===c){g=true;c=e;d=f;break}if(h===d){g=true;d=e;c=f;break}h=h.sibling;}if(!g){for(h=f.child;h;){if(h===
c){g=true;c=f;d=e;break}if(h===d){g=true;d=f;c=e;break}h=h.sibling;}if(!g)throw Error(p(189));}}if(c.alternate!==d)throw Error(p(190));}if(3!==c.tag)throw Error(p(188));return c.stateNode.current===c?a:b}function Zb(a){a=Yb(a);return null!==a?$b(a):null}function $b(a){if(5===a.tag||6===a.tag)return a;for(a=a.child;null!==a;){var b=$b(a);if(null!==b)return b;a=a.sibling;}return null}
var ac=ca.unstable_scheduleCallback,bc=ca.unstable_cancelCallback,cc=ca.unstable_shouldYield,dc=ca.unstable_requestPaint,B=ca.unstable_now,ec=ca.unstable_getCurrentPriorityLevel,fc=ca.unstable_ImmediatePriority,gc=ca.unstable_UserBlockingPriority,hc=ca.unstable_NormalPriority,ic=ca.unstable_LowPriority,jc=ca.unstable_IdlePriority,kc=null,lc=null;function mc(a){if(lc&&"function"===typeof lc.onCommitFiberRoot)try{lc.onCommitFiberRoot(kc,a,void 0,128===(a.current.flags&128));}catch(b){}}
var oc=Math.clz32?Math.clz32:nc,pc=Math.log,qc=Math.LN2;function nc(a){a>>>=0;return 0===a?32:31-(pc(a)/qc|0)|0}var rc=64,sc=4194304;
function tc(a){switch(a&-a){case 1:return 1;case 2:return 2;case 4:return 4;case 8:return 8;case 16:return 16;case 32:return 32;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return a&4194240;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return a&130023424;case 134217728:return 134217728;case 268435456:return 268435456;case 536870912:return 536870912;case 1073741824:return 1073741824;
default:return a}}function uc(a,b){var c=a.pendingLanes;if(0===c)return 0;var d=0,e=a.suspendedLanes,f=a.pingedLanes,g=c&268435455;if(0!==g){var h=g&~e;0!==h?d=tc(h):(f&=g,0!==f&&(d=tc(f)));}else g=c&~e,0!==g?d=tc(g):0!==f&&(d=tc(f));if(0===d)return 0;if(0!==b&&b!==d&&0===(b&e)&&(e=d&-d,f=b&-b,e>=f||16===e&&0!==(f&4194240)))return b;0!==(d&4)&&(d|=c&16);b=a.entangledLanes;if(0!==b)for(a=a.entanglements,b&=d;0<b;)c=31-oc(b),e=1<<c,d|=a[c],b&=~e;return d}
function vc(a,b){switch(a){case 1:case 2:case 4:return b+250;case 8:case 16:case 32:case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:return b+5E3;case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:return  -1;case 134217728:case 268435456:case 536870912:case 1073741824:return  -1;default:return  -1}}
function wc(a,b){for(var c=a.suspendedLanes,d=a.pingedLanes,e=a.expirationTimes,f=a.pendingLanes;0<f;){var g=31-oc(f),h=1<<g,k=e[g];if(-1===k){if(0===(h&c)||0!==(h&d))e[g]=vc(h,b);}else k<=b&&(a.expiredLanes|=h);f&=~h;}}function xc(a){a=a.pendingLanes&-1073741825;return 0!==a?a:a&1073741824?1073741824:0}function yc(){var a=rc;rc<<=1;0===(rc&4194240)&&(rc=64);return a}function zc(a){for(var b=[],c=0;31>c;c++)b.push(a);return b}
function Ac(a,b,c){a.pendingLanes|=b;536870912!==b&&(a.suspendedLanes=0,a.pingedLanes=0);a=a.eventTimes;b=31-oc(b);a[b]=c;}function Bc(a,b){var c=a.pendingLanes&~b;a.pendingLanes=b;a.suspendedLanes=0;a.pingedLanes=0;a.expiredLanes&=b;a.mutableReadLanes&=b;a.entangledLanes&=b;b=a.entanglements;var d=a.eventTimes;for(a=a.expirationTimes;0<c;){var e=31-oc(c),f=1<<e;b[e]=0;d[e]=-1;a[e]=-1;c&=~f;}}
function Cc(a,b){var c=a.entangledLanes|=b;for(a=a.entanglements;c;){var d=31-oc(c),e=1<<d;e&b|a[d]&b&&(a[d]|=b);c&=~e;}}var C=0;function Dc(a){a&=-a;return 1<a?4<a?0!==(a&268435455)?16:536870912:4:1}var Ec,Fc,Gc,Hc,Ic,Jc=false,Kc=[],Lc=null,Mc=null,Nc=null,Oc=new Map,Pc=new Map,Qc=[],Rc="mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset submit".split(" ");
function Sc(a,b){switch(a){case "focusin":case "focusout":Lc=null;break;case "dragenter":case "dragleave":Mc=null;break;case "mouseover":case "mouseout":Nc=null;break;case "pointerover":case "pointerout":Oc.delete(b.pointerId);break;case "gotpointercapture":case "lostpointercapture":Pc.delete(b.pointerId);}}
function Tc(a,b,c,d,e,f){if(null===a||a.nativeEvent!==f)return a={blockedOn:b,domEventName:c,eventSystemFlags:d,nativeEvent:f,targetContainers:[e]},null!==b&&(b=Cb(b),null!==b&&Fc(b)),a;a.eventSystemFlags|=d;b=a.targetContainers;null!==e&&-1===b.indexOf(e)&&b.push(e);return a}
function Uc(a,b,c,d,e){switch(b){case "focusin":return Lc=Tc(Lc,a,b,c,d,e),true;case "dragenter":return Mc=Tc(Mc,a,b,c,d,e),true;case "mouseover":return Nc=Tc(Nc,a,b,c,d,e),true;case "pointerover":var f=e.pointerId;Oc.set(f,Tc(Oc.get(f)||null,a,b,c,d,e));return  true;case "gotpointercapture":return f=e.pointerId,Pc.set(f,Tc(Pc.get(f)||null,a,b,c,d,e)),true}return  false}
function Vc(a){var b=Wc(a.target);if(null!==b){var c=Vb(b);if(null!==c)if(b=c.tag,13===b){if(b=Wb(c),null!==b){a.blockedOn=b;Ic(a.priority,function(){Gc(c);});return}}else if(3===b&&c.stateNode.current.memoizedState.isDehydrated){a.blockedOn=3===c.tag?c.stateNode.containerInfo:null;return}}a.blockedOn=null;}
function Xc(a){if(null!==a.blockedOn)return  false;for(var b=a.targetContainers;0<b.length;){var c=Yc(a.domEventName,a.eventSystemFlags,b[0],a.nativeEvent);if(null===c){c=a.nativeEvent;var d=new c.constructor(c.type,c);wb=d;c.target.dispatchEvent(d);wb=null;}else return b=Cb(c),null!==b&&Fc(b),a.blockedOn=c,false;b.shift();}return  true}function Zc(a,b,c){Xc(a)&&c.delete(b);}function $c(){Jc=false;null!==Lc&&Xc(Lc)&&(Lc=null);null!==Mc&&Xc(Mc)&&(Mc=null);null!==Nc&&Xc(Nc)&&(Nc=null);Oc.forEach(Zc);Pc.forEach(Zc);}
function ad(a,b){a.blockedOn===b&&(a.blockedOn=null,Jc||(Jc=true,ca.unstable_scheduleCallback(ca.unstable_NormalPriority,$c)));}
function bd(a){function b(b){return ad(b,a)}if(0<Kc.length){ad(Kc[0],a);for(var c=1;c<Kc.length;c++){var d=Kc[c];d.blockedOn===a&&(d.blockedOn=null);}}null!==Lc&&ad(Lc,a);null!==Mc&&ad(Mc,a);null!==Nc&&ad(Nc,a);Oc.forEach(b);Pc.forEach(b);for(c=0;c<Qc.length;c++)d=Qc[c],d.blockedOn===a&&(d.blockedOn=null);for(;0<Qc.length&&(c=Qc[0],null===c.blockedOn);)Vc(c),null===c.blockedOn&&Qc.shift();}var cd=ua.ReactCurrentBatchConfig,dd=true;
function ed(a,b,c,d){var e=C,f=cd.transition;cd.transition=null;try{C=1,fd(a,b,c,d);}finally{C=e,cd.transition=f;}}function gd(a,b,c,d){var e=C,f=cd.transition;cd.transition=null;try{C=4,fd(a,b,c,d);}finally{C=e,cd.transition=f;}}
function fd(a,b,c,d){if(dd){var e=Yc(a,b,c,d);if(null===e)hd(a,b,d,id,c),Sc(a,d);else if(Uc(e,a,b,c,d))d.stopPropagation();else if(Sc(a,d),b&4&&-1<Rc.indexOf(a)){for(;null!==e;){var f=Cb(e);null!==f&&Ec(f);f=Yc(a,b,c,d);null===f&&hd(a,b,d,id,c);if(f===e)break;e=f;}null!==e&&d.stopPropagation();}else hd(a,b,d,null,c);}}var id=null;
function Yc(a,b,c,d){id=null;a=xb(d);a=Wc(a);if(null!==a)if(b=Vb(a),null===b)a=null;else if(c=b.tag,13===c){a=Wb(b);if(null!==a)return a;a=null;}else if(3===c){if(b.stateNode.current.memoizedState.isDehydrated)return 3===b.tag?b.stateNode.containerInfo:null;a=null;}else b!==a&&(a=null);id=a;return null}
function jd(a){switch(a){case "cancel":case "click":case "close":case "contextmenu":case "copy":case "cut":case "auxclick":case "dblclick":case "dragend":case "dragstart":case "drop":case "focusin":case "focusout":case "input":case "invalid":case "keydown":case "keypress":case "keyup":case "mousedown":case "mouseup":case "paste":case "pause":case "play":case "pointercancel":case "pointerdown":case "pointerup":case "ratechange":case "reset":case "resize":case "seeked":case "submit":case "touchcancel":case "touchend":case "touchstart":case "volumechange":case "change":case "selectionchange":case "textInput":case "compositionstart":case "compositionend":case "compositionupdate":case "beforeblur":case "afterblur":case "beforeinput":case "blur":case "fullscreenchange":case "focus":case "hashchange":case "popstate":case "select":case "selectstart":return 1;case "drag":case "dragenter":case "dragexit":case "dragleave":case "dragover":case "mousemove":case "mouseout":case "mouseover":case "pointermove":case "pointerout":case "pointerover":case "scroll":case "toggle":case "touchmove":case "wheel":case "mouseenter":case "mouseleave":case "pointerenter":case "pointerleave":return 4;
case "message":switch(ec()){case fc:return 1;case gc:return 4;case hc:case ic:return 16;case jc:return 536870912;default:return 16}default:return 16}}var kd=null,ld=null,md=null;function nd(){if(md)return md;var a,b=ld,c=b.length,d,e="value"in kd?kd.value:kd.textContent,f=e.length;for(a=0;a<c&&b[a]===e[a];a++);var g=c-a;for(d=1;d<=g&&b[c-d]===e[f-d];d++);return md=e.slice(a,1<d?1-d:void 0)}
function od(a){var b=a.keyCode;"charCode"in a?(a=a.charCode,0===a&&13===b&&(a=13)):a=b;10===a&&(a=13);return 32<=a||13===a?a:0}function pd(){return  true}function qd(){return  false}
function rd(a){function b(b,d,e,f,g){this._reactName=b;this._targetInst=e;this.type=d;this.nativeEvent=f;this.target=g;this.currentTarget=null;for(var c in a)a.hasOwnProperty(c)&&(b=a[c],this[c]=b?b(f):f[c]);this.isDefaultPrevented=(null!=f.defaultPrevented?f.defaultPrevented:false===f.returnValue)?pd:qd;this.isPropagationStopped=qd;return this}A(b.prototype,{preventDefault:function(){this.defaultPrevented=true;var a=this.nativeEvent;a&&(a.preventDefault?a.preventDefault():"unknown"!==typeof a.returnValue&&
(a.returnValue=false),this.isDefaultPrevented=pd);},stopPropagation:function(){var a=this.nativeEvent;a&&(a.stopPropagation?a.stopPropagation():"unknown"!==typeof a.cancelBubble&&(a.cancelBubble=true),this.isPropagationStopped=pd);},persist:function(){},isPersistent:pd});return b}
var sd={eventPhase:0,bubbles:0,cancelable:0,timeStamp:function(a){return a.timeStamp||Date.now()},defaultPrevented:0,isTrusted:0},td=rd(sd),ud=A({},sd,{view:0,detail:0}),vd=rd(ud),wd,xd,yd,Ad=A({},ud,{screenX:0,screenY:0,clientX:0,clientY:0,pageX:0,pageY:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,getModifierState:zd,button:0,buttons:0,relatedTarget:function(a){return void 0===a.relatedTarget?a.fromElement===a.srcElement?a.toElement:a.fromElement:a.relatedTarget},movementX:function(a){if("movementX"in
a)return a.movementX;a!==yd&&(yd&&"mousemove"===a.type?(wd=a.screenX-yd.screenX,xd=a.screenY-yd.screenY):xd=wd=0,yd=a);return wd},movementY:function(a){return "movementY"in a?a.movementY:xd}}),Bd=rd(Ad),Cd=A({},Ad,{dataTransfer:0}),Dd=rd(Cd),Ed=A({},ud,{relatedTarget:0}),Fd=rd(Ed),Gd=A({},sd,{animationName:0,elapsedTime:0,pseudoElement:0}),Hd=rd(Gd),Id=A({},sd,{clipboardData:function(a){return "clipboardData"in a?a.clipboardData:window.clipboardData}}),Jd=rd(Id),Kd=A({},sd,{data:0}),Ld=rd(Kd),Md={Esc:"Escape",
Spacebar:" ",Left:"ArrowLeft",Up:"ArrowUp",Right:"ArrowRight",Down:"ArrowDown",Del:"Delete",Win:"OS",Menu:"ContextMenu",Apps:"ContextMenu",Scroll:"ScrollLock",MozPrintableKey:"Unidentified"},Nd={8:"Backspace",9:"Tab",12:"Clear",13:"Enter",16:"Shift",17:"Control",18:"Alt",19:"Pause",20:"CapsLock",27:"Escape",32:" ",33:"PageUp",34:"PageDown",35:"End",36:"Home",37:"ArrowLeft",38:"ArrowUp",39:"ArrowRight",40:"ArrowDown",45:"Insert",46:"Delete",112:"F1",113:"F2",114:"F3",115:"F4",116:"F5",117:"F6",118:"F7",
119:"F8",120:"F9",121:"F10",122:"F11",123:"F12",144:"NumLock",145:"ScrollLock",224:"Meta"},Od={Alt:"altKey",Control:"ctrlKey",Meta:"metaKey",Shift:"shiftKey"};function Pd(a){var b=this.nativeEvent;return b.getModifierState?b.getModifierState(a):(a=Od[a])?!!b[a]:false}function zd(){return Pd}
var Qd=A({},ud,{key:function(a){if(a.key){var b=Md[a.key]||a.key;if("Unidentified"!==b)return b}return "keypress"===a.type?(a=od(a),13===a?"Enter":String.fromCharCode(a)):"keydown"===a.type||"keyup"===a.type?Nd[a.keyCode]||"Unidentified":""},code:0,location:0,ctrlKey:0,shiftKey:0,altKey:0,metaKey:0,repeat:0,locale:0,getModifierState:zd,charCode:function(a){return "keypress"===a.type?od(a):0},keyCode:function(a){return "keydown"===a.type||"keyup"===a.type?a.keyCode:0},which:function(a){return "keypress"===
a.type?od(a):"keydown"===a.type||"keyup"===a.type?a.keyCode:0}}),Rd=rd(Qd),Sd=A({},Ad,{pointerId:0,width:0,height:0,pressure:0,tangentialPressure:0,tiltX:0,tiltY:0,twist:0,pointerType:0,isPrimary:0}),Td=rd(Sd),Ud=A({},ud,{touches:0,targetTouches:0,changedTouches:0,altKey:0,metaKey:0,ctrlKey:0,shiftKey:0,getModifierState:zd}),Vd=rd(Ud),Wd=A({},sd,{propertyName:0,elapsedTime:0,pseudoElement:0}),Xd=rd(Wd),Yd=A({},Ad,{deltaX:function(a){return "deltaX"in a?a.deltaX:"wheelDeltaX"in a?-a.wheelDeltaX:0},
deltaY:function(a){return "deltaY"in a?a.deltaY:"wheelDeltaY"in a?-a.wheelDeltaY:"wheelDelta"in a?-a.wheelDelta:0},deltaZ:0,deltaMode:0}),Zd=rd(Yd),$d=[9,13,27,32],ae=ia&&"CompositionEvent"in window,be=null;ia&&"documentMode"in document&&(be=document.documentMode);var ce=ia&&"TextEvent"in window&&!be,de=ia&&(!ae||be&&8<be&&11>=be),ee=String.fromCharCode(32),fe=false;
function ge(a,b){switch(a){case "keyup":return  -1!==$d.indexOf(b.keyCode);case "keydown":return 229!==b.keyCode;case "keypress":case "mousedown":case "focusout":return  true;default:return  false}}function he(a){a=a.detail;return "object"===typeof a&&"data"in a?a.data:null}var ie=false;function je(a,b){switch(a){case "compositionend":return he(b);case "keypress":if(32!==b.which)return null;fe=true;return ee;case "textInput":return a=b.data,a===ee&&fe?null:a;default:return null}}
function ke(a,b){if(ie)return "compositionend"===a||!ae&&ge(a,b)?(a=nd(),md=ld=kd=null,ie=false,a):null;switch(a){case "paste":return null;case "keypress":if(!(b.ctrlKey||b.altKey||b.metaKey)||b.ctrlKey&&b.altKey){if(b.char&&1<b.char.length)return b.char;if(b.which)return String.fromCharCode(b.which)}return null;case "compositionend":return de&&"ko"!==b.locale?null:b.data;default:return null}}
var le={color:true,date:true,datetime:true,"datetime-local":true,email:true,month:true,number:true,password:true,range:true,search:true,tel:true,text:true,time:true,url:true,week:true};function me(a){var b=a&&a.nodeName&&a.nodeName.toLowerCase();return "input"===b?!!le[a.type]:"textarea"===b?true:false}function ne(a,b,c,d){Eb(d);b=oe(b,"onChange");0<b.length&&(c=new td("onChange","change",null,c,d),a.push({event:c,listeners:b}));}var pe=null,qe=null;function re(a){se(a,0);}function te(a){var b=ue(a);if(Wa(b))return a}
function ve(a,b){if("change"===a)return b}var we=false;if(ia){var xe;if(ia){var ye="oninput"in document;if(!ye){var ze=document.createElement("div");ze.setAttribute("oninput","return;");ye="function"===typeof ze.oninput;}xe=ye;}else xe=false;we=xe&&(!document.documentMode||9<document.documentMode);}function Ae(){pe&&(pe.detachEvent("onpropertychange",Be),qe=pe=null);}function Be(a){if("value"===a.propertyName&&te(qe)){var b=[];ne(b,qe,a,xb(a));Jb(re,b);}}
function Ce(a,b,c){"focusin"===a?(Ae(),pe=b,qe=c,pe.attachEvent("onpropertychange",Be)):"focusout"===a&&Ae();}function De(a){if("selectionchange"===a||"keyup"===a||"keydown"===a)return te(qe)}function Ee(a,b){if("click"===a)return te(b)}function Fe(a,b){if("input"===a||"change"===a)return te(b)}function Ge(a,b){return a===b&&(0!==a||1/a===1/b)||a!==a&&b!==b}var He="function"===typeof Object.is?Object.is:Ge;
function Ie(a,b){if(He(a,b))return  true;if("object"!==typeof a||null===a||"object"!==typeof b||null===b)return  false;var c=Object.keys(a),d=Object.keys(b);if(c.length!==d.length)return  false;for(d=0;d<c.length;d++){var e=c[d];if(!ja.call(b,e)||!He(a[e],b[e]))return  false}return  true}function Je(a){for(;a&&a.firstChild;)a=a.firstChild;return a}
function Ke(a,b){var c=Je(a);a=0;for(var d;c;){if(3===c.nodeType){d=a+c.textContent.length;if(a<=b&&d>=b)return {node:c,offset:b-a};a=d;}a:{for(;c;){if(c.nextSibling){c=c.nextSibling;break a}c=c.parentNode;}c=void 0;}c=Je(c);}}function Le(a,b){return a&&b?a===b?true:a&&3===a.nodeType?false:b&&3===b.nodeType?Le(a,b.parentNode):"contains"in a?a.contains(b):a.compareDocumentPosition?!!(a.compareDocumentPosition(b)&16):false:false}
function Me(){for(var a=window,b=Xa();b instanceof a.HTMLIFrameElement;){try{var c="string"===typeof b.contentWindow.location.href;}catch(d){c=false;}if(c)a=b.contentWindow;else break;b=Xa(a.document);}return b}function Ne(a){var b=a&&a.nodeName&&a.nodeName.toLowerCase();return b&&("input"===b&&("text"===a.type||"search"===a.type||"tel"===a.type||"url"===a.type||"password"===a.type)||"textarea"===b||"true"===a.contentEditable)}
function Oe(a){var b=Me(),c=a.focusedElem,d=a.selectionRange;if(b!==c&&c&&c.ownerDocument&&Le(c.ownerDocument.documentElement,c)){if(null!==d&&Ne(c))if(b=d.start,a=d.end,void 0===a&&(a=b),"selectionStart"in c)c.selectionStart=b,c.selectionEnd=Math.min(a,c.value.length);else if(a=(b=c.ownerDocument||document)&&b.defaultView||window,a.getSelection){a=a.getSelection();var e=c.textContent.length,f=Math.min(d.start,e);d=void 0===d.end?f:Math.min(d.end,e);!a.extend&&f>d&&(e=d,d=f,f=e);e=Ke(c,f);var g=Ke(c,
d);e&&g&&(1!==a.rangeCount||a.anchorNode!==e.node||a.anchorOffset!==e.offset||a.focusNode!==g.node||a.focusOffset!==g.offset)&&(b=b.createRange(),b.setStart(e.node,e.offset),a.removeAllRanges(),f>d?(a.addRange(b),a.extend(g.node,g.offset)):(b.setEnd(g.node,g.offset),a.addRange(b)));}b=[];for(a=c;a=a.parentNode;)1===a.nodeType&&b.push({element:a,left:a.scrollLeft,top:a.scrollTop});"function"===typeof c.focus&&c.focus();for(c=0;c<b.length;c++)a=b[c],a.element.scrollLeft=a.left,a.element.scrollTop=a.top;}}
var Pe=ia&&"documentMode"in document&&11>=document.documentMode,Qe=null,Re=null,Se=null,Te=false;
function Ue(a,b,c){var d=c.window===c?c.document:9===c.nodeType?c:c.ownerDocument;Te||null==Qe||Qe!==Xa(d)||(d=Qe,"selectionStart"in d&&Ne(d)?d={start:d.selectionStart,end:d.selectionEnd}:(d=(d.ownerDocument&&d.ownerDocument.defaultView||window).getSelection(),d={anchorNode:d.anchorNode,anchorOffset:d.anchorOffset,focusNode:d.focusNode,focusOffset:d.focusOffset}),Se&&Ie(Se,d)||(Se=d,d=oe(Re,"onSelect"),0<d.length&&(b=new td("onSelect","select",null,b,c),a.push({event:b,listeners:d}),b.target=Qe)));}
function Ve(a,b){var c={};c[a.toLowerCase()]=b.toLowerCase();c["Webkit"+a]="webkit"+b;c["Moz"+a]="moz"+b;return c}var We={animationend:Ve("Animation","AnimationEnd"),animationiteration:Ve("Animation","AnimationIteration"),animationstart:Ve("Animation","AnimationStart"),transitionend:Ve("Transition","TransitionEnd")},Xe={},Ye={};
ia&&(Ye=document.createElement("div").style,"AnimationEvent"in window||(delete We.animationend.animation,delete We.animationiteration.animation,delete We.animationstart.animation),"TransitionEvent"in window||delete We.transitionend.transition);function Ze(a){if(Xe[a])return Xe[a];if(!We[a])return a;var b=We[a],c;for(c in b)if(b.hasOwnProperty(c)&&c in Ye)return Xe[a]=b[c];return a}var $e=Ze("animationend"),af=Ze("animationiteration"),bf=Ze("animationstart"),cf=Ze("transitionend"),df=new Map,ef="abort auxClick cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel".split(" ");
function ff(a,b){df.set(a,b);fa(b,[a]);}for(var gf=0;gf<ef.length;gf++){var hf=ef[gf],jf=hf.toLowerCase(),kf=hf[0].toUpperCase()+hf.slice(1);ff(jf,"on"+kf);}ff($e,"onAnimationEnd");ff(af,"onAnimationIteration");ff(bf,"onAnimationStart");ff("dblclick","onDoubleClick");ff("focusin","onFocus");ff("focusout","onBlur");ff(cf,"onTransitionEnd");ha("onMouseEnter",["mouseout","mouseover"]);ha("onMouseLeave",["mouseout","mouseover"]);ha("onPointerEnter",["pointerout","pointerover"]);
ha("onPointerLeave",["pointerout","pointerover"]);fa("onChange","change click focusin focusout input keydown keyup selectionchange".split(" "));fa("onSelect","focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange".split(" "));fa("onBeforeInput",["compositionend","keypress","textInput","paste"]);fa("onCompositionEnd","compositionend focusout keydown keypress keyup mousedown".split(" "));fa("onCompositionStart","compositionstart focusout keydown keypress keyup mousedown".split(" "));
fa("onCompositionUpdate","compositionupdate focusout keydown keypress keyup mousedown".split(" "));var lf="abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting".split(" "),mf=new Set("cancel close invalid load scroll toggle".split(" ").concat(lf));
function nf(a,b,c){var d=a.type||"unknown-event";a.currentTarget=c;Ub(d,b,void 0,a);a.currentTarget=null;}
function se(a,b){b=0!==(b&4);for(var c=0;c<a.length;c++){var d=a[c],e=d.event;d=d.listeners;a:{var f=void 0;if(b)for(var g=d.length-1;0<=g;g--){var h=d[g],k=h.instance,l=h.currentTarget;h=h.listener;if(k!==f&&e.isPropagationStopped())break a;nf(e,h,l);f=k;}else for(g=0;g<d.length;g++){h=d[g];k=h.instance;l=h.currentTarget;h=h.listener;if(k!==f&&e.isPropagationStopped())break a;nf(e,h,l);f=k;}}}if(Qb)throw a=Rb,Qb=false,Rb=null,a;}
function D(a,b){var c=b[of];void 0===c&&(c=b[of]=new Set);var d=a+"__bubble";c.has(d)||(pf(b,a,2,false),c.add(d));}function qf(a,b,c){var d=0;b&&(d|=4);pf(c,a,d,b);}var rf="_reactListening"+Math.random().toString(36).slice(2);function sf(a){if(!a[rf]){a[rf]=true;da.forEach(function(b){"selectionchange"!==b&&(mf.has(b)||qf(b,false,a),qf(b,true,a));});var b=9===a.nodeType?a:a.ownerDocument;null===b||b[rf]||(b[rf]=true,qf("selectionchange",false,b));}}
function pf(a,b,c,d){switch(jd(b)){case 1:var e=ed;break;case 4:e=gd;break;default:e=fd;}c=e.bind(null,b,c,a);e=void 0;!Lb||"touchstart"!==b&&"touchmove"!==b&&"wheel"!==b||(e=true);d?void 0!==e?a.addEventListener(b,c,{capture:true,passive:e}):a.addEventListener(b,c,true):void 0!==e?a.addEventListener(b,c,{passive:e}):a.addEventListener(b,c,false);}
function hd(a,b,c,d,e){var f=d;if(0===(b&1)&&0===(b&2)&&null!==d)a:for(;;){if(null===d)return;var g=d.tag;if(3===g||4===g){var h=d.stateNode.containerInfo;if(h===e||8===h.nodeType&&h.parentNode===e)break;if(4===g)for(g=d.return;null!==g;){var k=g.tag;if(3===k||4===k)if(k=g.stateNode.containerInfo,k===e||8===k.nodeType&&k.parentNode===e)return;g=g.return;}for(;null!==h;){g=Wc(h);if(null===g)return;k=g.tag;if(5===k||6===k){d=f=g;continue a}h=h.parentNode;}}d=d.return;}Jb(function(){var d=f,e=xb(c),g=[];
a:{var h=df.get(a);if(void 0!==h){var k=td,n=a;switch(a){case "keypress":if(0===od(c))break a;case "keydown":case "keyup":k=Rd;break;case "focusin":n="focus";k=Fd;break;case "focusout":n="blur";k=Fd;break;case "beforeblur":case "afterblur":k=Fd;break;case "click":if(2===c.button)break a;case "auxclick":case "dblclick":case "mousedown":case "mousemove":case "mouseup":case "mouseout":case "mouseover":case "contextmenu":k=Bd;break;case "drag":case "dragend":case "dragenter":case "dragexit":case "dragleave":case "dragover":case "dragstart":case "drop":k=
Dd;break;case "touchcancel":case "touchend":case "touchmove":case "touchstart":k=Vd;break;case $e:case af:case bf:k=Hd;break;case cf:k=Xd;break;case "scroll":k=vd;break;case "wheel":k=Zd;break;case "copy":case "cut":case "paste":k=Jd;break;case "gotpointercapture":case "lostpointercapture":case "pointercancel":case "pointerdown":case "pointermove":case "pointerout":case "pointerover":case "pointerup":k=Td;}var t=0!==(b&4),J=!t&&"scroll"===a,x=t?null!==h?h+"Capture":null:h;t=[];for(var w=d,u;null!==
w;){u=w;var F=u.stateNode;5===u.tag&&null!==F&&(u=F,null!==x&&(F=Kb(w,x),null!=F&&t.push(tf(w,F,u))));if(J)break;w=w.return;}0<t.length&&(h=new k(h,n,null,c,e),g.push({event:h,listeners:t}));}}if(0===(b&7)){a:{h="mouseover"===a||"pointerover"===a;k="mouseout"===a||"pointerout"===a;if(h&&c!==wb&&(n=c.relatedTarget||c.fromElement)&&(Wc(n)||n[uf]))break a;if(k||h){h=e.window===e?e:(h=e.ownerDocument)?h.defaultView||h.parentWindow:window;if(k){if(n=c.relatedTarget||c.toElement,k=d,n=n?Wc(n):null,null!==
n&&(J=Vb(n),n!==J||5!==n.tag&&6!==n.tag))n=null;}else k=null,n=d;if(k!==n){t=Bd;F="onMouseLeave";x="onMouseEnter";w="mouse";if("pointerout"===a||"pointerover"===a)t=Td,F="onPointerLeave",x="onPointerEnter",w="pointer";J=null==k?h:ue(k);u=null==n?h:ue(n);h=new t(F,w+"leave",k,c,e);h.target=J;h.relatedTarget=u;F=null;Wc(e)===d&&(t=new t(x,w+"enter",n,c,e),t.target=u,t.relatedTarget=J,F=t);J=F;if(k&&n)b:{t=k;x=n;w=0;for(u=t;u;u=vf(u))w++;u=0;for(F=x;F;F=vf(F))u++;for(;0<w-u;)t=vf(t),w--;for(;0<u-w;)x=
vf(x),u--;for(;w--;){if(t===x||null!==x&&t===x.alternate)break b;t=vf(t);x=vf(x);}t=null;}else t=null;null!==k&&wf(g,h,k,t,false);null!==n&&null!==J&&wf(g,J,n,t,true);}}}a:{h=d?ue(d):window;k=h.nodeName&&h.nodeName.toLowerCase();if("select"===k||"input"===k&&"file"===h.type)var na=ve;else if(me(h))if(we)na=Fe;else {na=De;var xa=Ce;}else (k=h.nodeName)&&"input"===k.toLowerCase()&&("checkbox"===h.type||"radio"===h.type)&&(na=Ee);if(na&&(na=na(a,d))){ne(g,na,c,e);break a}xa&&xa(a,h,d);"focusout"===a&&(xa=h._wrapperState)&&
xa.controlled&&"number"===h.type&&cb(h,"number",h.value);}xa=d?ue(d):window;switch(a){case "focusin":if(me(xa)||"true"===xa.contentEditable)Qe=xa,Re=d,Se=null;break;case "focusout":Se=Re=Qe=null;break;case "mousedown":Te=true;break;case "contextmenu":case "mouseup":case "dragend":Te=false;Ue(g,c,e);break;case "selectionchange":if(Pe)break;case "keydown":case "keyup":Ue(g,c,e);}var $a;if(ae)b:{switch(a){case "compositionstart":var ba="onCompositionStart";break b;case "compositionend":ba="onCompositionEnd";
break b;case "compositionupdate":ba="onCompositionUpdate";break b}ba=void 0;}else ie?ge(a,c)&&(ba="onCompositionEnd"):"keydown"===a&&229===c.keyCode&&(ba="onCompositionStart");ba&&(de&&"ko"!==c.locale&&(ie||"onCompositionStart"!==ba?"onCompositionEnd"===ba&&ie&&($a=nd()):(kd=e,ld="value"in kd?kd.value:kd.textContent,ie=true)),xa=oe(d,ba),0<xa.length&&(ba=new Ld(ba,a,null,c,e),g.push({event:ba,listeners:xa}),$a?ba.data=$a:($a=he(c),null!==$a&&(ba.data=$a))));if($a=ce?je(a,c):ke(a,c))d=oe(d,"onBeforeInput"),
0<d.length&&(e=new Ld("onBeforeInput","beforeinput",null,c,e),g.push({event:e,listeners:d}),e.data=$a);}se(g,b);});}function tf(a,b,c){return {instance:a,listener:b,currentTarget:c}}function oe(a,b){for(var c=b+"Capture",d=[];null!==a;){var e=a,f=e.stateNode;5===e.tag&&null!==f&&(e=f,f=Kb(a,c),null!=f&&d.unshift(tf(a,f,e)),f=Kb(a,b),null!=f&&d.push(tf(a,f,e)));a=a.return;}return d}function vf(a){if(null===a)return null;do a=a.return;while(a&&5!==a.tag);return a?a:null}
function wf(a,b,c,d,e){for(var f=b._reactName,g=[];null!==c&&c!==d;){var h=c,k=h.alternate,l=h.stateNode;if(null!==k&&k===d)break;5===h.tag&&null!==l&&(h=l,e?(k=Kb(c,f),null!=k&&g.unshift(tf(c,k,h))):e||(k=Kb(c,f),null!=k&&g.push(tf(c,k,h))));c=c.return;}0!==g.length&&a.push({event:b,listeners:g});}var xf=/\r\n?/g,yf=/\u0000|\uFFFD/g;function zf(a){return ("string"===typeof a?a:""+a).replace(xf,"\n").replace(yf,"")}function Af(a,b,c){b=zf(b);if(zf(a)!==b&&c)throw Error(p(425));}function Bf(){}
var Cf=null,Df=null;function Ef(a,b){return "textarea"===a||"noscript"===a||"string"===typeof b.children||"number"===typeof b.children||"object"===typeof b.dangerouslySetInnerHTML&&null!==b.dangerouslySetInnerHTML&&null!=b.dangerouslySetInnerHTML.__html}
var Ff="function"===typeof setTimeout?setTimeout:void 0,Gf="function"===typeof clearTimeout?clearTimeout:void 0,Hf="function"===typeof Promise?Promise:void 0,Jf="function"===typeof queueMicrotask?queueMicrotask:"undefined"!==typeof Hf?function(a){return Hf.resolve(null).then(a).catch(If)}:Ff;function If(a){setTimeout(function(){throw a;});}
function Kf(a,b){var c=b,d=0;do{var e=c.nextSibling;a.removeChild(c);if(e&&8===e.nodeType)if(c=e.data,"/$"===c){if(0===d){a.removeChild(e);bd(b);return}d--;}else "$"!==c&&"$?"!==c&&"$!"!==c||d++;c=e;}while(c);bd(b);}function Lf(a){for(;null!=a;a=a.nextSibling){var b=a.nodeType;if(1===b||3===b)break;if(8===b){b=a.data;if("$"===b||"$!"===b||"$?"===b)break;if("/$"===b)return null}}return a}
function Mf(a){a=a.previousSibling;for(var b=0;a;){if(8===a.nodeType){var c=a.data;if("$"===c||"$!"===c||"$?"===c){if(0===b)return a;b--;}else "/$"===c&&b++;}a=a.previousSibling;}return null}var Nf=Math.random().toString(36).slice(2),Of="__reactFiber$"+Nf,Pf="__reactProps$"+Nf,uf="__reactContainer$"+Nf,of="__reactEvents$"+Nf,Qf="__reactListeners$"+Nf,Rf="__reactHandles$"+Nf;
function Wc(a){var b=a[Of];if(b)return b;for(var c=a.parentNode;c;){if(b=c[uf]||c[Of]){c=b.alternate;if(null!==b.child||null!==c&&null!==c.child)for(a=Mf(a);null!==a;){if(c=a[Of])return c;a=Mf(a);}return b}a=c;c=a.parentNode;}return null}function Cb(a){a=a[Of]||a[uf];return !a||5!==a.tag&&6!==a.tag&&13!==a.tag&&3!==a.tag?null:a}function ue(a){if(5===a.tag||6===a.tag)return a.stateNode;throw Error(p(33));}function Db(a){return a[Pf]||null}var Sf=[],Tf=-1;function Uf(a){return {current:a}}
function E(a){0>Tf||(a.current=Sf[Tf],Sf[Tf]=null,Tf--);}function G(a,b){Tf++;Sf[Tf]=a.current;a.current=b;}var Vf={},H=Uf(Vf),Wf=Uf(false),Xf=Vf;function Yf(a,b){var c=a.type.contextTypes;if(!c)return Vf;var d=a.stateNode;if(d&&d.__reactInternalMemoizedUnmaskedChildContext===b)return d.__reactInternalMemoizedMaskedChildContext;var e={},f;for(f in c)e[f]=b[f];d&&(a=a.stateNode,a.__reactInternalMemoizedUnmaskedChildContext=b,a.__reactInternalMemoizedMaskedChildContext=e);return e}
function Zf(a){a=a.childContextTypes;return null!==a&&void 0!==a}function $f(){E(Wf);E(H);}function ag(a,b,c){if(H.current!==Vf)throw Error(p(168));G(H,b);G(Wf,c);}function bg(a,b,c){var d=a.stateNode;b=b.childContextTypes;if("function"!==typeof d.getChildContext)return c;d=d.getChildContext();for(var e in d)if(!(e in b))throw Error(p(108,Ra(a)||"Unknown",e));return A({},c,d)}
function cg(a){a=(a=a.stateNode)&&a.__reactInternalMemoizedMergedChildContext||Vf;Xf=H.current;G(H,a);G(Wf,Wf.current);return  true}function dg(a,b,c){var d=a.stateNode;if(!d)throw Error(p(169));c?(a=bg(a,b,Xf),d.__reactInternalMemoizedMergedChildContext=a,E(Wf),E(H),G(H,a)):E(Wf);G(Wf,c);}var eg=null,fg=false,gg=false;function hg(a){null===eg?eg=[a]:eg.push(a);}function ig(a){fg=true;hg(a);}
function jg(){if(!gg&&null!==eg){gg=true;var a=0,b=C;try{var c=eg;for(C=1;a<c.length;a++){var d=c[a];do d=d(!0);while(null!==d)}eg=null;fg=!1;}catch(e){throw null!==eg&&(eg=eg.slice(a+1)),ac(fc,jg),e;}finally{C=b,gg=false;}}return null}var kg=[],lg=0,mg=null,ng=0,og=[],pg=0,qg=null,rg=1,sg="";function tg(a,b){kg[lg++]=ng;kg[lg++]=mg;mg=a;ng=b;}
function ug(a,b,c){og[pg++]=rg;og[pg++]=sg;og[pg++]=qg;qg=a;var d=rg;a=sg;var e=32-oc(d)-1;d&=~(1<<e);c+=1;var f=32-oc(b)+e;if(30<f){var g=e-e%5;f=(d&(1<<g)-1).toString(32);d>>=g;e-=g;rg=1<<32-oc(b)+e|c<<e|d;sg=f+a;}else rg=1<<f|c<<e|d,sg=a;}function vg(a){null!==a.return&&(tg(a,1),ug(a,1,0));}function wg(a){for(;a===mg;)mg=kg[--lg],kg[lg]=null,ng=kg[--lg],kg[lg]=null;for(;a===qg;)qg=og[--pg],og[pg]=null,sg=og[--pg],og[pg]=null,rg=og[--pg],og[pg]=null;}var xg=null,yg=null,I=false,zg=null;
function Ag(a,b){var c=Bg(5,null,null,0);c.elementType="DELETED";c.stateNode=b;c.return=a;b=a.deletions;null===b?(a.deletions=[c],a.flags|=16):b.push(c);}
function Cg(a,b){switch(a.tag){case 5:var c=a.type;b=1!==b.nodeType||c.toLowerCase()!==b.nodeName.toLowerCase()?null:b;return null!==b?(a.stateNode=b,xg=a,yg=Lf(b.firstChild),true):false;case 6:return b=""===a.pendingProps||3!==b.nodeType?null:b,null!==b?(a.stateNode=b,xg=a,yg=null,true):false;case 13:return b=8!==b.nodeType?null:b,null!==b?(c=null!==qg?{id:rg,overflow:sg}:null,a.memoizedState={dehydrated:b,treeContext:c,retryLane:1073741824},c=Bg(18,null,null,0),c.stateNode=b,c.return=a,a.child=c,xg=a,yg=
null,true):false;default:return  false}}function Dg(a){return 0!==(a.mode&1)&&0===(a.flags&128)}function Eg(a){if(I){var b=yg;if(b){var c=b;if(!Cg(a,b)){if(Dg(a))throw Error(p(418));b=Lf(c.nextSibling);var d=xg;b&&Cg(a,b)?Ag(d,c):(a.flags=a.flags&-4097|2,I=false,xg=a);}}else {if(Dg(a))throw Error(p(418));a.flags=a.flags&-4097|2;I=false;xg=a;}}}function Fg(a){for(a=a.return;null!==a&&5!==a.tag&&3!==a.tag&&13!==a.tag;)a=a.return;xg=a;}
function Gg(a){if(a!==xg)return  false;if(!I)return Fg(a),I=true,false;var b;(b=3!==a.tag)&&!(b=5!==a.tag)&&(b=a.type,b="head"!==b&&"body"!==b&&!Ef(a.type,a.memoizedProps));if(b&&(b=yg)){if(Dg(a))throw Hg(),Error(p(418));for(;b;)Ag(a,b),b=Lf(b.nextSibling);}Fg(a);if(13===a.tag){a=a.memoizedState;a=null!==a?a.dehydrated:null;if(!a)throw Error(p(317));a:{a=a.nextSibling;for(b=0;a;){if(8===a.nodeType){var c=a.data;if("/$"===c){if(0===b){yg=Lf(a.nextSibling);break a}b--;}else "$"!==c&&"$!"!==c&&"$?"!==c||b++;}a=a.nextSibling;}yg=
null;}}else yg=xg?Lf(a.stateNode.nextSibling):null;return  true}function Hg(){for(var a=yg;a;)a=Lf(a.nextSibling);}function Ig(){yg=xg=null;I=false;}function Jg(a){null===zg?zg=[a]:zg.push(a);}var Kg=ua.ReactCurrentBatchConfig;
function Lg(a,b,c){a=c.ref;if(null!==a&&"function"!==typeof a&&"object"!==typeof a){if(c._owner){c=c._owner;if(c){if(1!==c.tag)throw Error(p(309));var d=c.stateNode;}if(!d)throw Error(p(147,a));var e=d,f=""+a;if(null!==b&&null!==b.ref&&"function"===typeof b.ref&&b.ref._stringRef===f)return b.ref;b=function(a){var b=e.refs;null===a?delete b[f]:b[f]=a;};b._stringRef=f;return b}if("string"!==typeof a)throw Error(p(284));if(!c._owner)throw Error(p(290,a));}return a}
function Mg(a,b){a=Object.prototype.toString.call(b);throw Error(p(31,"[object Object]"===a?"object with keys {"+Object.keys(b).join(", ")+"}":a));}function Ng(a){var b=a._init;return b(a._payload)}
function Og(a){function b(b,c){if(a){var d=b.deletions;null===d?(b.deletions=[c],b.flags|=16):d.push(c);}}function c(c,d){if(!a)return null;for(;null!==d;)b(c,d),d=d.sibling;return null}function d(a,b){for(a=new Map;null!==b;)null!==b.key?a.set(b.key,b):a.set(b.index,b),b=b.sibling;return a}function e(a,b){a=Pg(a,b);a.index=0;a.sibling=null;return a}function f(b,c,d){b.index=d;if(!a)return b.flags|=1048576,c;d=b.alternate;if(null!==d)return d=d.index,d<c?(b.flags|=2,c):d;b.flags|=2;return c}function g(b){a&&
null===b.alternate&&(b.flags|=2);return b}function h(a,b,c,d){if(null===b||6!==b.tag)return b=Qg(c,a.mode,d),b.return=a,b;b=e(b,c);b.return=a;return b}function k(a,b,c,d){var f=c.type;if(f===ya)return m(a,b,c.props.children,d,c.key);if(null!==b&&(b.elementType===f||"object"===typeof f&&null!==f&&f.$$typeof===Ha&&Ng(f)===b.type))return d=e(b,c.props),d.ref=Lg(a,b,c),d.return=a,d;d=Rg(c.type,c.key,c.props,null,a.mode,d);d.ref=Lg(a,b,c);d.return=a;return d}function l(a,b,c,d){if(null===b||4!==b.tag||
b.stateNode.containerInfo!==c.containerInfo||b.stateNode.implementation!==c.implementation)return b=Sg(c,a.mode,d),b.return=a,b;b=e(b,c.children||[]);b.return=a;return b}function m(a,b,c,d,f){if(null===b||7!==b.tag)return b=Tg(c,a.mode,d,f),b.return=a,b;b=e(b,c);b.return=a;return b}function q(a,b,c){if("string"===typeof b&&""!==b||"number"===typeof b)return b=Qg(""+b,a.mode,c),b.return=a,b;if("object"===typeof b&&null!==b){switch(b.$$typeof){case va:return c=Rg(b.type,b.key,b.props,null,a.mode,c),
c.ref=Lg(a,null,b),c.return=a,c;case wa:return b=Sg(b,a.mode,c),b.return=a,b;case Ha:var d=b._init;return q(a,d(b._payload),c)}if(eb(b)||Ka(b))return b=Tg(b,a.mode,c,null),b.return=a,b;Mg(a,b);}return null}function r(a,b,c,d){var e=null!==b?b.key:null;if("string"===typeof c&&""!==c||"number"===typeof c)return null!==e?null:h(a,b,""+c,d);if("object"===typeof c&&null!==c){switch(c.$$typeof){case va:return c.key===e?k(a,b,c,d):null;case wa:return c.key===e?l(a,b,c,d):null;case Ha:return e=c._init,r(a,
b,e(c._payload),d)}if(eb(c)||Ka(c))return null!==e?null:m(a,b,c,d,null);Mg(a,c);}return null}function y(a,b,c,d,e){if("string"===typeof d&&""!==d||"number"===typeof d)return a=a.get(c)||null,h(b,a,""+d,e);if("object"===typeof d&&null!==d){switch(d.$$typeof){case va:return a=a.get(null===d.key?c:d.key)||null,k(b,a,d,e);case wa:return a=a.get(null===d.key?c:d.key)||null,l(b,a,d,e);case Ha:var f=d._init;return y(a,b,c,f(d._payload),e)}if(eb(d)||Ka(d))return a=a.get(c)||null,m(b,a,d,e,null);Mg(b,d);}return null}
function n(e,g,h,k){for(var l=null,m=null,u=g,w=g=0,x=null;null!==u&&w<h.length;w++){u.index>w?(x=u,u=null):x=u.sibling;var n=r(e,u,h[w],k);if(null===n){null===u&&(u=x);break}a&&u&&null===n.alternate&&b(e,u);g=f(n,g,w);null===m?l=n:m.sibling=n;m=n;u=x;}if(w===h.length)return c(e,u),I&&tg(e,w),l;if(null===u){for(;w<h.length;w++)u=q(e,h[w],k),null!==u&&(g=f(u,g,w),null===m?l=u:m.sibling=u,m=u);I&&tg(e,w);return l}for(u=d(e,u);w<h.length;w++)x=y(u,e,w,h[w],k),null!==x&&(a&&null!==x.alternate&&u.delete(null===
x.key?w:x.key),g=f(x,g,w),null===m?l=x:m.sibling=x,m=x);a&&u.forEach(function(a){return b(e,a)});I&&tg(e,w);return l}function t(e,g,h,k){var l=Ka(h);if("function"!==typeof l)throw Error(p(150));h=l.call(h);if(null==h)throw Error(p(151));for(var u=l=null,m=g,w=g=0,x=null,n=h.next();null!==m&&!n.done;w++,n=h.next()){m.index>w?(x=m,m=null):x=m.sibling;var t=r(e,m,n.value,k);if(null===t){null===m&&(m=x);break}a&&m&&null===t.alternate&&b(e,m);g=f(t,g,w);null===u?l=t:u.sibling=t;u=t;m=x;}if(n.done)return c(e,
m),I&&tg(e,w),l;if(null===m){for(;!n.done;w++,n=h.next())n=q(e,n.value,k),null!==n&&(g=f(n,g,w),null===u?l=n:u.sibling=n,u=n);I&&tg(e,w);return l}for(m=d(e,m);!n.done;w++,n=h.next())n=y(m,e,w,n.value,k),null!==n&&(a&&null!==n.alternate&&m.delete(null===n.key?w:n.key),g=f(n,g,w),null===u?l=n:u.sibling=n,u=n);a&&m.forEach(function(a){return b(e,a)});I&&tg(e,w);return l}function J(a,d,f,h){"object"===typeof f&&null!==f&&f.type===ya&&null===f.key&&(f=f.props.children);if("object"===typeof f&&null!==f){switch(f.$$typeof){case va:a:{for(var k=
f.key,l=d;null!==l;){if(l.key===k){k=f.type;if(k===ya){if(7===l.tag){c(a,l.sibling);d=e(l,f.props.children);d.return=a;a=d;break a}}else if(l.elementType===k||"object"===typeof k&&null!==k&&k.$$typeof===Ha&&Ng(k)===l.type){c(a,l.sibling);d=e(l,f.props);d.ref=Lg(a,l,f);d.return=a;a=d;break a}c(a,l);break}else b(a,l);l=l.sibling;}f.type===ya?(d=Tg(f.props.children,a.mode,h,f.key),d.return=a,a=d):(h=Rg(f.type,f.key,f.props,null,a.mode,h),h.ref=Lg(a,d,f),h.return=a,a=h);}return g(a);case wa:a:{for(l=f.key;null!==
d;){if(d.key===l)if(4===d.tag&&d.stateNode.containerInfo===f.containerInfo&&d.stateNode.implementation===f.implementation){c(a,d.sibling);d=e(d,f.children||[]);d.return=a;a=d;break a}else {c(a,d);break}else b(a,d);d=d.sibling;}d=Sg(f,a.mode,h);d.return=a;a=d;}return g(a);case Ha:return l=f._init,J(a,d,l(f._payload),h)}if(eb(f))return n(a,d,f,h);if(Ka(f))return t(a,d,f,h);Mg(a,f);}return "string"===typeof f&&""!==f||"number"===typeof f?(f=""+f,null!==d&&6===d.tag?(c(a,d.sibling),d=e(d,f),d.return=a,a=d):
(c(a,d),d=Qg(f,a.mode,h),d.return=a,a=d),g(a)):c(a,d)}return J}var Ug=Og(true),Vg=Og(false),Wg=Uf(null),Xg=null,Yg=null,Zg=null;function $g(){Zg=Yg=Xg=null;}function ah(a){var b=Wg.current;E(Wg);a._currentValue=b;}function bh(a,b,c){for(;null!==a;){var d=a.alternate;(a.childLanes&b)!==b?(a.childLanes|=b,null!==d&&(d.childLanes|=b)):null!==d&&(d.childLanes&b)!==b&&(d.childLanes|=b);if(a===c)break;a=a.return;}}
function ch(a,b){Xg=a;Zg=Yg=null;a=a.dependencies;null!==a&&null!==a.firstContext&&(0!==(a.lanes&b)&&(dh=true),a.firstContext=null);}function eh(a){var b=a._currentValue;if(Zg!==a)if(a={context:a,memoizedValue:b,next:null},null===Yg){if(null===Xg)throw Error(p(308));Yg=a;Xg.dependencies={lanes:0,firstContext:a};}else Yg=Yg.next=a;return b}var fh=null;function gh(a){null===fh?fh=[a]:fh.push(a);}
function hh(a,b,c,d){var e=b.interleaved;null===e?(c.next=c,gh(b)):(c.next=e.next,e.next=c);b.interleaved=c;return ih(a,d)}function ih(a,b){a.lanes|=b;var c=a.alternate;null!==c&&(c.lanes|=b);c=a;for(a=a.return;null!==a;)a.childLanes|=b,c=a.alternate,null!==c&&(c.childLanes|=b),c=a,a=a.return;return 3===c.tag?c.stateNode:null}var jh=false;function kh(a){a.updateQueue={baseState:a.memoizedState,firstBaseUpdate:null,lastBaseUpdate:null,shared:{pending:null,interleaved:null,lanes:0},effects:null};}
function lh(a,b){a=a.updateQueue;b.updateQueue===a&&(b.updateQueue={baseState:a.baseState,firstBaseUpdate:a.firstBaseUpdate,lastBaseUpdate:a.lastBaseUpdate,shared:a.shared,effects:a.effects});}function mh(a,b){return {eventTime:a,lane:b,tag:0,payload:null,callback:null,next:null}}
function nh(a,b,c){var d=a.updateQueue;if(null===d)return null;d=d.shared;if(0!==(K&2)){var e=d.pending;null===e?b.next=b:(b.next=e.next,e.next=b);d.pending=b;return ih(a,c)}e=d.interleaved;null===e?(b.next=b,gh(d)):(b.next=e.next,e.next=b);d.interleaved=b;return ih(a,c)}function oh(a,b,c){b=b.updateQueue;if(null!==b&&(b=b.shared,0!==(c&4194240))){var d=b.lanes;d&=a.pendingLanes;c|=d;b.lanes=c;Cc(a,c);}}
function ph(a,b){var c=a.updateQueue,d=a.alternate;if(null!==d&&(d=d.updateQueue,c===d)){var e=null,f=null;c=c.firstBaseUpdate;if(null!==c){do{var g={eventTime:c.eventTime,lane:c.lane,tag:c.tag,payload:c.payload,callback:c.callback,next:null};null===f?e=f=g:f=f.next=g;c=c.next;}while(null!==c);null===f?e=f=b:f=f.next=b;}else e=f=b;c={baseState:d.baseState,firstBaseUpdate:e,lastBaseUpdate:f,shared:d.shared,effects:d.effects};a.updateQueue=c;return}a=c.lastBaseUpdate;null===a?c.firstBaseUpdate=b:a.next=
b;c.lastBaseUpdate=b;}
function qh(a,b,c,d){var e=a.updateQueue;jh=false;var f=e.firstBaseUpdate,g=e.lastBaseUpdate,h=e.shared.pending;if(null!==h){e.shared.pending=null;var k=h,l=k.next;k.next=null;null===g?f=l:g.next=l;g=k;var m=a.alternate;null!==m&&(m=m.updateQueue,h=m.lastBaseUpdate,h!==g&&(null===h?m.firstBaseUpdate=l:h.next=l,m.lastBaseUpdate=k));}if(null!==f){var q=e.baseState;g=0;m=l=k=null;h=f;do{var r=h.lane,y=h.eventTime;if((d&r)===r){null!==m&&(m=m.next={eventTime:y,lane:0,tag:h.tag,payload:h.payload,callback:h.callback,
next:null});a:{var n=a,t=h;r=b;y=c;switch(t.tag){case 1:n=t.payload;if("function"===typeof n){q=n.call(y,q,r);break a}q=n;break a;case 3:n.flags=n.flags&-65537|128;case 0:n=t.payload;r="function"===typeof n?n.call(y,q,r):n;if(null===r||void 0===r)break a;q=A({},q,r);break a;case 2:jh=true;}}null!==h.callback&&0!==h.lane&&(a.flags|=64,r=e.effects,null===r?e.effects=[h]:r.push(h));}else y={eventTime:y,lane:r,tag:h.tag,payload:h.payload,callback:h.callback,next:null},null===m?(l=m=y,k=q):m=m.next=y,g|=r;
h=h.next;if(null===h)if(h=e.shared.pending,null===h)break;else r=h,h=r.next,r.next=null,e.lastBaseUpdate=r,e.shared.pending=null;}while(1);null===m&&(k=q);e.baseState=k;e.firstBaseUpdate=l;e.lastBaseUpdate=m;b=e.shared.interleaved;if(null!==b){e=b;do g|=e.lane,e=e.next;while(e!==b)}else null===f&&(e.shared.lanes=0);rh|=g;a.lanes=g;a.memoizedState=q;}}
function sh(a,b,c){a=b.effects;b.effects=null;if(null!==a)for(b=0;b<a.length;b++){var d=a[b],e=d.callback;if(null!==e){d.callback=null;d=c;if("function"!==typeof e)throw Error(p(191,e));e.call(d);}}}var th={},uh=Uf(th),vh=Uf(th),wh=Uf(th);function xh(a){if(a===th)throw Error(p(174));return a}
function yh(a,b){G(wh,b);G(vh,a);G(uh,th);a=b.nodeType;switch(a){case 9:case 11:b=(b=b.documentElement)?b.namespaceURI:lb(null,"");break;default:a=8===a?b.parentNode:b,b=a.namespaceURI||null,a=a.tagName,b=lb(b,a);}E(uh);G(uh,b);}function zh(){E(uh);E(vh);E(wh);}function Ah(a){xh(wh.current);var b=xh(uh.current);var c=lb(b,a.type);b!==c&&(G(vh,a),G(uh,c));}function Bh(a){vh.current===a&&(E(uh),E(vh));}var L=Uf(0);
function Ch(a){for(var b=a;null!==b;){if(13===b.tag){var c=b.memoizedState;if(null!==c&&(c=c.dehydrated,null===c||"$?"===c.data||"$!"===c.data))return b}else if(19===b.tag&&void 0!==b.memoizedProps.revealOrder){if(0!==(b.flags&128))return b}else if(null!==b.child){b.child.return=b;b=b.child;continue}if(b===a)break;for(;null===b.sibling;){if(null===b.return||b.return===a)return null;b=b.return;}b.sibling.return=b.return;b=b.sibling;}return null}var Dh=[];
function Eh(){for(var a=0;a<Dh.length;a++)Dh[a]._workInProgressVersionPrimary=null;Dh.length=0;}var Fh=ua.ReactCurrentDispatcher,Gh=ua.ReactCurrentBatchConfig,Hh=0,M=null,N=null,O=null,Ih=false,Jh=false,Kh=0,Lh=0;function P(){throw Error(p(321));}function Mh(a,b){if(null===b)return  false;for(var c=0;c<b.length&&c<a.length;c++)if(!He(a[c],b[c]))return  false;return  true}
function Nh(a,b,c,d,e,f){Hh=f;M=b;b.memoizedState=null;b.updateQueue=null;b.lanes=0;Fh.current=null===a||null===a.memoizedState?Oh:Ph;a=c(d,e);if(Jh){f=0;do{Jh=false;Kh=0;if(25<=f)throw Error(p(301));f+=1;O=N=null;b.updateQueue=null;Fh.current=Qh;a=c(d,e);}while(Jh)}Fh.current=Rh;b=null!==N&&null!==N.next;Hh=0;O=N=M=null;Ih=false;if(b)throw Error(p(300));return a}function Sh(){var a=0!==Kh;Kh=0;return a}
function Th(){var a={memoizedState:null,baseState:null,baseQueue:null,queue:null,next:null};null===O?M.memoizedState=O=a:O=O.next=a;return O}function Uh(){if(null===N){var a=M.alternate;a=null!==a?a.memoizedState:null;}else a=N.next;var b=null===O?M.memoizedState:O.next;if(null!==b)O=b,N=a;else {if(null===a)throw Error(p(310));N=a;a={memoizedState:N.memoizedState,baseState:N.baseState,baseQueue:N.baseQueue,queue:N.queue,next:null};null===O?M.memoizedState=O=a:O=O.next=a;}return O}
function Vh(a,b){return "function"===typeof b?b(a):b}
function Wh(a){var b=Uh(),c=b.queue;if(null===c)throw Error(p(311));c.lastRenderedReducer=a;var d=N,e=d.baseQueue,f=c.pending;if(null!==f){if(null!==e){var g=e.next;e.next=f.next;f.next=g;}d.baseQueue=e=f;c.pending=null;}if(null!==e){f=e.next;d=d.baseState;var h=g=null,k=null,l=f;do{var m=l.lane;if((Hh&m)===m)null!==k&&(k=k.next={lane:0,action:l.action,hasEagerState:l.hasEagerState,eagerState:l.eagerState,next:null}),d=l.hasEagerState?l.eagerState:a(d,l.action);else {var q={lane:m,action:l.action,hasEagerState:l.hasEagerState,
eagerState:l.eagerState,next:null};null===k?(h=k=q,g=d):k=k.next=q;M.lanes|=m;rh|=m;}l=l.next;}while(null!==l&&l!==f);null===k?g=d:k.next=h;He(d,b.memoizedState)||(dh=true);b.memoizedState=d;b.baseState=g;b.baseQueue=k;c.lastRenderedState=d;}a=c.interleaved;if(null!==a){e=a;do f=e.lane,M.lanes|=f,rh|=f,e=e.next;while(e!==a)}else null===e&&(c.lanes=0);return [b.memoizedState,c.dispatch]}
function Xh(a){var b=Uh(),c=b.queue;if(null===c)throw Error(p(311));c.lastRenderedReducer=a;var d=c.dispatch,e=c.pending,f=b.memoizedState;if(null!==e){c.pending=null;var g=e=e.next;do f=a(f,g.action),g=g.next;while(g!==e);He(f,b.memoizedState)||(dh=true);b.memoizedState=f;null===b.baseQueue&&(b.baseState=f);c.lastRenderedState=f;}return [f,d]}function Yh(){}
function Zh(a,b){var c=M,d=Uh(),e=b(),f=!He(d.memoizedState,e);f&&(d.memoizedState=e,dh=true);d=d.queue;$h(ai.bind(null,c,d,a),[a]);if(d.getSnapshot!==b||f||null!==O&&O.memoizedState.tag&1){c.flags|=2048;bi(9,ci.bind(null,c,d,e,b),void 0,null);if(null===Q)throw Error(p(349));0!==(Hh&30)||di(c,b,e);}return e}function di(a,b,c){a.flags|=16384;a={getSnapshot:b,value:c};b=M.updateQueue;null===b?(b={lastEffect:null,stores:null},M.updateQueue=b,b.stores=[a]):(c=b.stores,null===c?b.stores=[a]:c.push(a));}
function ci(a,b,c,d){b.value=c;b.getSnapshot=d;ei(b)&&fi(a);}function ai(a,b,c){return c(function(){ei(b)&&fi(a);})}function ei(a){var b=a.getSnapshot;a=a.value;try{var c=b();return !He(a,c)}catch(d){return  true}}function fi(a){var b=ih(a,1);null!==b&&gi(b,a,1,-1);}
function hi(a){var b=Th();"function"===typeof a&&(a=a());b.memoizedState=b.baseState=a;a={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:Vh,lastRenderedState:a};b.queue=a;a=a.dispatch=ii.bind(null,M,a);return [b.memoizedState,a]}
function bi(a,b,c,d){a={tag:a,create:b,destroy:c,deps:d,next:null};b=M.updateQueue;null===b?(b={lastEffect:null,stores:null},M.updateQueue=b,b.lastEffect=a.next=a):(c=b.lastEffect,null===c?b.lastEffect=a.next=a:(d=c.next,c.next=a,a.next=d,b.lastEffect=a));return a}function ji(){return Uh().memoizedState}function ki(a,b,c,d){var e=Th();M.flags|=a;e.memoizedState=bi(1|b,c,void 0,void 0===d?null:d);}
function li(a,b,c,d){var e=Uh();d=void 0===d?null:d;var f=void 0;if(null!==N){var g=N.memoizedState;f=g.destroy;if(null!==d&&Mh(d,g.deps)){e.memoizedState=bi(b,c,f,d);return}}M.flags|=a;e.memoizedState=bi(1|b,c,f,d);}function mi(a,b){return ki(8390656,8,a,b)}function $h(a,b){return li(2048,8,a,b)}function ni(a,b){return li(4,2,a,b)}function oi(a,b){return li(4,4,a,b)}
function pi(a,b){if("function"===typeof b)return a=a(),b(a),function(){b(null);};if(null!==b&&void 0!==b)return a=a(),b.current=a,function(){b.current=null;}}function qi(a,b,c){c=null!==c&&void 0!==c?c.concat([a]):null;return li(4,4,pi.bind(null,b,a),c)}function ri(){}function si(a,b){var c=Uh();b=void 0===b?null:b;var d=c.memoizedState;if(null!==d&&null!==b&&Mh(b,d[1]))return d[0];c.memoizedState=[a,b];return a}
function ti(a,b){var c=Uh();b=void 0===b?null:b;var d=c.memoizedState;if(null!==d&&null!==b&&Mh(b,d[1]))return d[0];a=a();c.memoizedState=[a,b];return a}function ui(a,b,c){if(0===(Hh&21))return a.baseState&&(a.baseState=false,dh=true),a.memoizedState=c;He(c,b)||(c=yc(),M.lanes|=c,rh|=c,a.baseState=true);return b}function vi(a,b){var c=C;C=0!==c&&4>c?c:4;a(true);var d=Gh.transition;Gh.transition={};try{a(!1),b();}finally{C=c,Gh.transition=d;}}function wi(){return Uh().memoizedState}
function xi(a,b,c){var d=yi(a);c={lane:d,action:c,hasEagerState:false,eagerState:null,next:null};if(zi(a))Ai(b,c);else if(c=hh(a,b,c,d),null!==c){var e=R();gi(c,a,d,e);Bi(c,b,d);}}
function ii(a,b,c){var d=yi(a),e={lane:d,action:c,hasEagerState:false,eagerState:null,next:null};if(zi(a))Ai(b,e);else {var f=a.alternate;if(0===a.lanes&&(null===f||0===f.lanes)&&(f=b.lastRenderedReducer,null!==f))try{var g=b.lastRenderedState,h=f(g,c);e.hasEagerState=!0;e.eagerState=h;if(He(h,g)){var k=b.interleaved;null===k?(e.next=e,gh(b)):(e.next=k.next,k.next=e);b.interleaved=e;return}}catch(l){}finally{}c=hh(a,b,e,d);null!==c&&(e=R(),gi(c,a,d,e),Bi(c,b,d));}}
function zi(a){var b=a.alternate;return a===M||null!==b&&b===M}function Ai(a,b){Jh=Ih=true;var c=a.pending;null===c?b.next=b:(b.next=c.next,c.next=b);a.pending=b;}function Bi(a,b,c){if(0!==(c&4194240)){var d=b.lanes;d&=a.pendingLanes;c|=d;b.lanes=c;Cc(a,c);}}
var Rh={readContext:eh,useCallback:P,useContext:P,useEffect:P,useImperativeHandle:P,useInsertionEffect:P,useLayoutEffect:P,useMemo:P,useReducer:P,useRef:P,useState:P,useDebugValue:P,useDeferredValue:P,useTransition:P,useMutableSource:P,useSyncExternalStore:P,useId:P,unstable_isNewReconciler:false},Oh={readContext:eh,useCallback:function(a,b){Th().memoizedState=[a,void 0===b?null:b];return a},useContext:eh,useEffect:mi,useImperativeHandle:function(a,b,c){c=null!==c&&void 0!==c?c.concat([a]):null;return ki(4194308,
4,pi.bind(null,b,a),c)},useLayoutEffect:function(a,b){return ki(4194308,4,a,b)},useInsertionEffect:function(a,b){return ki(4,2,a,b)},useMemo:function(a,b){var c=Th();b=void 0===b?null:b;a=a();c.memoizedState=[a,b];return a},useReducer:function(a,b,c){var d=Th();b=void 0!==c?c(b):b;d.memoizedState=d.baseState=b;a={pending:null,interleaved:null,lanes:0,dispatch:null,lastRenderedReducer:a,lastRenderedState:b};d.queue=a;a=a.dispatch=xi.bind(null,M,a);return [d.memoizedState,a]},useRef:function(a){var b=
Th();a={current:a};return b.memoizedState=a},useState:hi,useDebugValue:ri,useDeferredValue:function(a){return Th().memoizedState=a},useTransition:function(){var a=hi(false),b=a[0];a=vi.bind(null,a[1]);Th().memoizedState=a;return [b,a]},useMutableSource:function(){},useSyncExternalStore:function(a,b,c){var d=M,e=Th();if(I){if(void 0===c)throw Error(p(407));c=c();}else {c=b();if(null===Q)throw Error(p(349));0!==(Hh&30)||di(d,b,c);}e.memoizedState=c;var f={value:c,getSnapshot:b};e.queue=f;mi(ai.bind(null,d,
f,a),[a]);d.flags|=2048;bi(9,ci.bind(null,d,f,c,b),void 0,null);return c},useId:function(){var a=Th(),b=Q.identifierPrefix;if(I){var c=sg;var d=rg;c=(d&~(1<<32-oc(d)-1)).toString(32)+c;b=":"+b+"R"+c;c=Kh++;0<c&&(b+="H"+c.toString(32));b+=":";}else c=Lh++,b=":"+b+"r"+c.toString(32)+":";return a.memoizedState=b},unstable_isNewReconciler:false},Ph={readContext:eh,useCallback:si,useContext:eh,useEffect:$h,useImperativeHandle:qi,useInsertionEffect:ni,useLayoutEffect:oi,useMemo:ti,useReducer:Wh,useRef:ji,useState:function(){return Wh(Vh)},
useDebugValue:ri,useDeferredValue:function(a){var b=Uh();return ui(b,N.memoizedState,a)},useTransition:function(){var a=Wh(Vh)[0],b=Uh().memoizedState;return [a,b]},useMutableSource:Yh,useSyncExternalStore:Zh,useId:wi,unstable_isNewReconciler:false},Qh={readContext:eh,useCallback:si,useContext:eh,useEffect:$h,useImperativeHandle:qi,useInsertionEffect:ni,useLayoutEffect:oi,useMemo:ti,useReducer:Xh,useRef:ji,useState:function(){return Xh(Vh)},useDebugValue:ri,useDeferredValue:function(a){var b=Uh();return null===
N?b.memoizedState=a:ui(b,N.memoizedState,a)},useTransition:function(){var a=Xh(Vh)[0],b=Uh().memoizedState;return [a,b]},useMutableSource:Yh,useSyncExternalStore:Zh,useId:wi,unstable_isNewReconciler:false};function Ci(a,b){if(a&&a.defaultProps){b=A({},b);a=a.defaultProps;for(var c in a) void 0===b[c]&&(b[c]=a[c]);return b}return b}function Di(a,b,c,d){b=a.memoizedState;c=c(d,b);c=null===c||void 0===c?b:A({},b,c);a.memoizedState=c;0===a.lanes&&(a.updateQueue.baseState=c);}
var Ei={isMounted:function(a){return (a=a._reactInternals)?Vb(a)===a:false},enqueueSetState:function(a,b,c){a=a._reactInternals;var d=R(),e=yi(a),f=mh(d,e);f.payload=b;void 0!==c&&null!==c&&(f.callback=c);b=nh(a,f,e);null!==b&&(gi(b,a,e,d),oh(b,a,e));},enqueueReplaceState:function(a,b,c){a=a._reactInternals;var d=R(),e=yi(a),f=mh(d,e);f.tag=1;f.payload=b;void 0!==c&&null!==c&&(f.callback=c);b=nh(a,f,e);null!==b&&(gi(b,a,e,d),oh(b,a,e));},enqueueForceUpdate:function(a,b){a=a._reactInternals;var c=R(),d=
yi(a),e=mh(c,d);e.tag=2;void 0!==b&&null!==b&&(e.callback=b);b=nh(a,e,d);null!==b&&(gi(b,a,d,c),oh(b,a,d));}};function Fi(a,b,c,d,e,f,g){a=a.stateNode;return "function"===typeof a.shouldComponentUpdate?a.shouldComponentUpdate(d,f,g):b.prototype&&b.prototype.isPureReactComponent?!Ie(c,d)||!Ie(e,f):true}
function Gi(a,b,c){var d=false,e=Vf;var f=b.contextType;"object"===typeof f&&null!==f?f=eh(f):(e=Zf(b)?Xf:H.current,d=b.contextTypes,f=(d=null!==d&&void 0!==d)?Yf(a,e):Vf);b=new b(c,f);a.memoizedState=null!==b.state&&void 0!==b.state?b.state:null;b.updater=Ei;a.stateNode=b;b._reactInternals=a;d&&(a=a.stateNode,a.__reactInternalMemoizedUnmaskedChildContext=e,a.__reactInternalMemoizedMaskedChildContext=f);return b}
function Hi(a,b,c,d){a=b.state;"function"===typeof b.componentWillReceiveProps&&b.componentWillReceiveProps(c,d);"function"===typeof b.UNSAFE_componentWillReceiveProps&&b.UNSAFE_componentWillReceiveProps(c,d);b.state!==a&&Ei.enqueueReplaceState(b,b.state,null);}
function Ii(a,b,c,d){var e=a.stateNode;e.props=c;e.state=a.memoizedState;e.refs={};kh(a);var f=b.contextType;"object"===typeof f&&null!==f?e.context=eh(f):(f=Zf(b)?Xf:H.current,e.context=Yf(a,f));e.state=a.memoizedState;f=b.getDerivedStateFromProps;"function"===typeof f&&(Di(a,b,f,c),e.state=a.memoizedState);"function"===typeof b.getDerivedStateFromProps||"function"===typeof e.getSnapshotBeforeUpdate||"function"!==typeof e.UNSAFE_componentWillMount&&"function"!==typeof e.componentWillMount||(b=e.state,
"function"===typeof e.componentWillMount&&e.componentWillMount(),"function"===typeof e.UNSAFE_componentWillMount&&e.UNSAFE_componentWillMount(),b!==e.state&&Ei.enqueueReplaceState(e,e.state,null),qh(a,c,e,d),e.state=a.memoizedState);"function"===typeof e.componentDidMount&&(a.flags|=4194308);}function Ji(a,b){try{var c="",d=b;do c+=Pa(d),d=d.return;while(d);var e=c;}catch(f){e="\nError generating stack: "+f.message+"\n"+f.stack;}return {value:a,source:b,stack:e,digest:null}}
function Ki(a,b,c){return {value:a,source:null,stack:null!=c?c:null,digest:null!=b?b:null}}function Li(a,b){try{console.error(b.value);}catch(c){setTimeout(function(){throw c;});}}var Mi="function"===typeof WeakMap?WeakMap:Map;function Ni(a,b,c){c=mh(-1,c);c.tag=3;c.payload={element:null};var d=b.value;c.callback=function(){Oi||(Oi=true,Pi=d);Li(a,b);};return c}
function Qi(a,b,c){c=mh(-1,c);c.tag=3;var d=a.type.getDerivedStateFromError;if("function"===typeof d){var e=b.value;c.payload=function(){return d(e)};c.callback=function(){Li(a,b);};}var f=a.stateNode;null!==f&&"function"===typeof f.componentDidCatch&&(c.callback=function(){Li(a,b);"function"!==typeof d&&(null===Ri?Ri=new Set([this]):Ri.add(this));var c=b.stack;this.componentDidCatch(b.value,{componentStack:null!==c?c:""});});return c}
function Si(a,b,c){var d=a.pingCache;if(null===d){d=a.pingCache=new Mi;var e=new Set;d.set(b,e);}else e=d.get(b),void 0===e&&(e=new Set,d.set(b,e));e.has(c)||(e.add(c),a=Ti.bind(null,a,b,c),b.then(a,a));}function Ui(a){do{var b;if(b=13===a.tag)b=a.memoizedState,b=null!==b?null!==b.dehydrated?true:false:true;if(b)return a;a=a.return;}while(null!==a);return null}
function Vi(a,b,c,d,e){if(0===(a.mode&1))return a===b?a.flags|=65536:(a.flags|=128,c.flags|=131072,c.flags&=-52805,1===c.tag&&(null===c.alternate?c.tag=17:(b=mh(-1,1),b.tag=2,nh(c,b,1))),c.lanes|=1),a;a.flags|=65536;a.lanes=e;return a}var Wi=ua.ReactCurrentOwner,dh=false;function Xi(a,b,c,d){b.child=null===a?Vg(b,null,c,d):Ug(b,a.child,c,d);}
function Yi(a,b,c,d,e){c=c.render;var f=b.ref;ch(b,e);d=Nh(a,b,c,d,f,e);c=Sh();if(null!==a&&!dh)return b.updateQueue=a.updateQueue,b.flags&=-2053,a.lanes&=~e,Zi(a,b,e);I&&c&&vg(b);b.flags|=1;Xi(a,b,d,e);return b.child}
function $i(a,b,c,d,e){if(null===a){var f=c.type;if("function"===typeof f&&!aj(f)&&void 0===f.defaultProps&&null===c.compare&&void 0===c.defaultProps)return b.tag=15,b.type=f,bj(a,b,f,d,e);a=Rg(c.type,null,d,b,b.mode,e);a.ref=b.ref;a.return=b;return b.child=a}f=a.child;if(0===(a.lanes&e)){var g=f.memoizedProps;c=c.compare;c=null!==c?c:Ie;if(c(g,d)&&a.ref===b.ref)return Zi(a,b,e)}b.flags|=1;a=Pg(f,d);a.ref=b.ref;a.return=b;return b.child=a}
function bj(a,b,c,d,e){if(null!==a){var f=a.memoizedProps;if(Ie(f,d)&&a.ref===b.ref)if(dh=false,b.pendingProps=d=f,0!==(a.lanes&e))0!==(a.flags&131072)&&(dh=true);else return b.lanes=a.lanes,Zi(a,b,e)}return cj(a,b,c,d,e)}
function dj(a,b,c){var d=b.pendingProps,e=d.children,f=null!==a?a.memoizedState:null;if("hidden"===d.mode)if(0===(b.mode&1))b.memoizedState={baseLanes:0,cachePool:null,transitions:null},G(ej,fj),fj|=c;else {if(0===(c&1073741824))return a=null!==f?f.baseLanes|c:c,b.lanes=b.childLanes=1073741824,b.memoizedState={baseLanes:a,cachePool:null,transitions:null},b.updateQueue=null,G(ej,fj),fj|=a,null;b.memoizedState={baseLanes:0,cachePool:null,transitions:null};d=null!==f?f.baseLanes:c;G(ej,fj);fj|=d;}else null!==
f?(d=f.baseLanes|c,b.memoizedState=null):d=c,G(ej,fj),fj|=d;Xi(a,b,e,c);return b.child}function gj(a,b){var c=b.ref;if(null===a&&null!==c||null!==a&&a.ref!==c)b.flags|=512,b.flags|=2097152;}function cj(a,b,c,d,e){var f=Zf(c)?Xf:H.current;f=Yf(b,f);ch(b,e);c=Nh(a,b,c,d,f,e);d=Sh();if(null!==a&&!dh)return b.updateQueue=a.updateQueue,b.flags&=-2053,a.lanes&=~e,Zi(a,b,e);I&&d&&vg(b);b.flags|=1;Xi(a,b,c,e);return b.child}
function hj(a,b,c,d,e){if(Zf(c)){var f=true;cg(b);}else f=false;ch(b,e);if(null===b.stateNode)ij(a,b),Gi(b,c,d),Ii(b,c,d,e),d=true;else if(null===a){var g=b.stateNode,h=b.memoizedProps;g.props=h;var k=g.context,l=c.contextType;"object"===typeof l&&null!==l?l=eh(l):(l=Zf(c)?Xf:H.current,l=Yf(b,l));var m=c.getDerivedStateFromProps,q="function"===typeof m||"function"===typeof g.getSnapshotBeforeUpdate;q||"function"!==typeof g.UNSAFE_componentWillReceiveProps&&"function"!==typeof g.componentWillReceiveProps||
(h!==d||k!==l)&&Hi(b,g,d,l);jh=false;var r=b.memoizedState;g.state=r;qh(b,d,g,e);k=b.memoizedState;h!==d||r!==k||Wf.current||jh?("function"===typeof m&&(Di(b,c,m,d),k=b.memoizedState),(h=jh||Fi(b,c,h,d,r,k,l))?(q||"function"!==typeof g.UNSAFE_componentWillMount&&"function"!==typeof g.componentWillMount||("function"===typeof g.componentWillMount&&g.componentWillMount(),"function"===typeof g.UNSAFE_componentWillMount&&g.UNSAFE_componentWillMount()),"function"===typeof g.componentDidMount&&(b.flags|=4194308)):
("function"===typeof g.componentDidMount&&(b.flags|=4194308),b.memoizedProps=d,b.memoizedState=k),g.props=d,g.state=k,g.context=l,d=h):("function"===typeof g.componentDidMount&&(b.flags|=4194308),d=false);}else {g=b.stateNode;lh(a,b);h=b.memoizedProps;l=b.type===b.elementType?h:Ci(b.type,h);g.props=l;q=b.pendingProps;r=g.context;k=c.contextType;"object"===typeof k&&null!==k?k=eh(k):(k=Zf(c)?Xf:H.current,k=Yf(b,k));var y=c.getDerivedStateFromProps;(m="function"===typeof y||"function"===typeof g.getSnapshotBeforeUpdate)||
"function"!==typeof g.UNSAFE_componentWillReceiveProps&&"function"!==typeof g.componentWillReceiveProps||(h!==q||r!==k)&&Hi(b,g,d,k);jh=false;r=b.memoizedState;g.state=r;qh(b,d,g,e);var n=b.memoizedState;h!==q||r!==n||Wf.current||jh?("function"===typeof y&&(Di(b,c,y,d),n=b.memoizedState),(l=jh||Fi(b,c,l,d,r,n,k)||false)?(m||"function"!==typeof g.UNSAFE_componentWillUpdate&&"function"!==typeof g.componentWillUpdate||("function"===typeof g.componentWillUpdate&&g.componentWillUpdate(d,n,k),"function"===typeof g.UNSAFE_componentWillUpdate&&
g.UNSAFE_componentWillUpdate(d,n,k)),"function"===typeof g.componentDidUpdate&&(b.flags|=4),"function"===typeof g.getSnapshotBeforeUpdate&&(b.flags|=1024)):("function"!==typeof g.componentDidUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=4),"function"!==typeof g.getSnapshotBeforeUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=1024),b.memoizedProps=d,b.memoizedState=n),g.props=d,g.state=n,g.context=k,d=l):("function"!==typeof g.componentDidUpdate||h===a.memoizedProps&&r===
a.memoizedState||(b.flags|=4),"function"!==typeof g.getSnapshotBeforeUpdate||h===a.memoizedProps&&r===a.memoizedState||(b.flags|=1024),d=false);}return jj(a,b,c,d,f,e)}
function jj(a,b,c,d,e,f){gj(a,b);var g=0!==(b.flags&128);if(!d&&!g)return e&&dg(b,c,false),Zi(a,b,f);d=b.stateNode;Wi.current=b;var h=g&&"function"!==typeof c.getDerivedStateFromError?null:d.render();b.flags|=1;null!==a&&g?(b.child=Ug(b,a.child,null,f),b.child=Ug(b,null,h,f)):Xi(a,b,h,f);b.memoizedState=d.state;e&&dg(b,c,true);return b.child}function kj(a){var b=a.stateNode;b.pendingContext?ag(a,b.pendingContext,b.pendingContext!==b.context):b.context&&ag(a,b.context,false);yh(a,b.containerInfo);}
function lj(a,b,c,d,e){Ig();Jg(e);b.flags|=256;Xi(a,b,c,d);return b.child}var mj={dehydrated:null,treeContext:null,retryLane:0};function nj(a){return {baseLanes:a,cachePool:null,transitions:null}}
function oj(a,b,c){var d=b.pendingProps,e=L.current,f=false,g=0!==(b.flags&128),h;(h=g)||(h=null!==a&&null===a.memoizedState?false:0!==(e&2));if(h)f=true,b.flags&=-129;else if(null===a||null!==a.memoizedState)e|=1;G(L,e&1);if(null===a){Eg(b);a=b.memoizedState;if(null!==a&&(a=a.dehydrated,null!==a))return 0===(b.mode&1)?b.lanes=1:"$!"===a.data?b.lanes=8:b.lanes=1073741824,null;g=d.children;a=d.fallback;return f?(d=b.mode,f=b.child,g={mode:"hidden",children:g},0===(d&1)&&null!==f?(f.childLanes=0,f.pendingProps=
g):f=pj(g,d,0,null),a=Tg(a,d,c,null),f.return=b,a.return=b,f.sibling=a,b.child=f,b.child.memoizedState=nj(c),b.memoizedState=mj,a):qj(b,g)}e=a.memoizedState;if(null!==e&&(h=e.dehydrated,null!==h))return rj(a,b,g,d,h,e,c);if(f){f=d.fallback;g=b.mode;e=a.child;h=e.sibling;var k={mode:"hidden",children:d.children};0===(g&1)&&b.child!==e?(d=b.child,d.childLanes=0,d.pendingProps=k,b.deletions=null):(d=Pg(e,k),d.subtreeFlags=e.subtreeFlags&14680064);null!==h?f=Pg(h,f):(f=Tg(f,g,c,null),f.flags|=2);f.return=
b;d.return=b;d.sibling=f;b.child=d;d=f;f=b.child;g=a.child.memoizedState;g=null===g?nj(c):{baseLanes:g.baseLanes|c,cachePool:null,transitions:g.transitions};f.memoizedState=g;f.childLanes=a.childLanes&~c;b.memoizedState=mj;return d}f=a.child;a=f.sibling;d=Pg(f,{mode:"visible",children:d.children});0===(b.mode&1)&&(d.lanes=c);d.return=b;d.sibling=null;null!==a&&(c=b.deletions,null===c?(b.deletions=[a],b.flags|=16):c.push(a));b.child=d;b.memoizedState=null;return d}
function qj(a,b){b=pj({mode:"visible",children:b},a.mode,0,null);b.return=a;return a.child=b}function sj(a,b,c,d){null!==d&&Jg(d);Ug(b,a.child,null,c);a=qj(b,b.pendingProps.children);a.flags|=2;b.memoizedState=null;return a}
function rj(a,b,c,d,e,f,g){if(c){if(b.flags&256)return b.flags&=-257,d=Ki(Error(p(422))),sj(a,b,g,d);if(null!==b.memoizedState)return b.child=a.child,b.flags|=128,null;f=d.fallback;e=b.mode;d=pj({mode:"visible",children:d.children},e,0,null);f=Tg(f,e,g,null);f.flags|=2;d.return=b;f.return=b;d.sibling=f;b.child=d;0!==(b.mode&1)&&Ug(b,a.child,null,g);b.child.memoizedState=nj(g);b.memoizedState=mj;return f}if(0===(b.mode&1))return sj(a,b,g,null);if("$!"===e.data){d=e.nextSibling&&e.nextSibling.dataset;
if(d)var h=d.dgst;d=h;f=Error(p(419));d=Ki(f,d,void 0);return sj(a,b,g,d)}h=0!==(g&a.childLanes);if(dh||h){d=Q;if(null!==d){switch(g&-g){case 4:e=2;break;case 16:e=8;break;case 64:case 128:case 256:case 512:case 1024:case 2048:case 4096:case 8192:case 16384:case 32768:case 65536:case 131072:case 262144:case 524288:case 1048576:case 2097152:case 4194304:case 8388608:case 16777216:case 33554432:case 67108864:e=32;break;case 536870912:e=268435456;break;default:e=0;}e=0!==(e&(d.suspendedLanes|g))?0:e;
0!==e&&e!==f.retryLane&&(f.retryLane=e,ih(a,e),gi(d,a,e,-1));}tj();d=Ki(Error(p(421)));return sj(a,b,g,d)}if("$?"===e.data)return b.flags|=128,b.child=a.child,b=uj.bind(null,a),e._reactRetry=b,null;a=f.treeContext;yg=Lf(e.nextSibling);xg=b;I=true;zg=null;null!==a&&(og[pg++]=rg,og[pg++]=sg,og[pg++]=qg,rg=a.id,sg=a.overflow,qg=b);b=qj(b,d.children);b.flags|=4096;return b}function vj(a,b,c){a.lanes|=b;var d=a.alternate;null!==d&&(d.lanes|=b);bh(a.return,b,c);}
function wj(a,b,c,d,e){var f=a.memoizedState;null===f?a.memoizedState={isBackwards:b,rendering:null,renderingStartTime:0,last:d,tail:c,tailMode:e}:(f.isBackwards=b,f.rendering=null,f.renderingStartTime=0,f.last=d,f.tail=c,f.tailMode=e);}
function xj(a,b,c){var d=b.pendingProps,e=d.revealOrder,f=d.tail;Xi(a,b,d.children,c);d=L.current;if(0!==(d&2))d=d&1|2,b.flags|=128;else {if(null!==a&&0!==(a.flags&128))a:for(a=b.child;null!==a;){if(13===a.tag)null!==a.memoizedState&&vj(a,c,b);else if(19===a.tag)vj(a,c,b);else if(null!==a.child){a.child.return=a;a=a.child;continue}if(a===b)break a;for(;null===a.sibling;){if(null===a.return||a.return===b)break a;a=a.return;}a.sibling.return=a.return;a=a.sibling;}d&=1;}G(L,d);if(0===(b.mode&1))b.memoizedState=
null;else switch(e){case "forwards":c=b.child;for(e=null;null!==c;)a=c.alternate,null!==a&&null===Ch(a)&&(e=c),c=c.sibling;c=e;null===c?(e=b.child,b.child=null):(e=c.sibling,c.sibling=null);wj(b,false,e,c,f);break;case "backwards":c=null;e=b.child;for(b.child=null;null!==e;){a=e.alternate;if(null!==a&&null===Ch(a)){b.child=e;break}a=e.sibling;e.sibling=c;c=e;e=a;}wj(b,true,c,null,f);break;case "together":wj(b,false,null,null,void 0);break;default:b.memoizedState=null;}return b.child}
function ij(a,b){0===(b.mode&1)&&null!==a&&(a.alternate=null,b.alternate=null,b.flags|=2);}function Zi(a,b,c){null!==a&&(b.dependencies=a.dependencies);rh|=b.lanes;if(0===(c&b.childLanes))return null;if(null!==a&&b.child!==a.child)throw Error(p(153));if(null!==b.child){a=b.child;c=Pg(a,a.pendingProps);b.child=c;for(c.return=b;null!==a.sibling;)a=a.sibling,c=c.sibling=Pg(a,a.pendingProps),c.return=b;c.sibling=null;}return b.child}
function yj(a,b,c){switch(b.tag){case 3:kj(b);Ig();break;case 5:Ah(b);break;case 1:Zf(b.type)&&cg(b);break;case 4:yh(b,b.stateNode.containerInfo);break;case 10:var d=b.type._context,e=b.memoizedProps.value;G(Wg,d._currentValue);d._currentValue=e;break;case 13:d=b.memoizedState;if(null!==d){if(null!==d.dehydrated)return G(L,L.current&1),b.flags|=128,null;if(0!==(c&b.child.childLanes))return oj(a,b,c);G(L,L.current&1);a=Zi(a,b,c);return null!==a?a.sibling:null}G(L,L.current&1);break;case 19:d=0!==(c&
b.childLanes);if(0!==(a.flags&128)){if(d)return xj(a,b,c);b.flags|=128;}e=b.memoizedState;null!==e&&(e.rendering=null,e.tail=null,e.lastEffect=null);G(L,L.current);if(d)break;else return null;case 22:case 23:return b.lanes=0,dj(a,b,c)}return Zi(a,b,c)}var zj,Aj,Bj,Cj;
zj=function(a,b){for(var c=b.child;null!==c;){if(5===c.tag||6===c.tag)a.appendChild(c.stateNode);else if(4!==c.tag&&null!==c.child){c.child.return=c;c=c.child;continue}if(c===b)break;for(;null===c.sibling;){if(null===c.return||c.return===b)return;c=c.return;}c.sibling.return=c.return;c=c.sibling;}};Aj=function(){};
Bj=function(a,b,c,d){var e=a.memoizedProps;if(e!==d){a=b.stateNode;xh(uh.current);var f=null;switch(c){case "input":e=Ya(a,e);d=Ya(a,d);f=[];break;case "select":e=A({},e,{value:void 0});d=A({},d,{value:void 0});f=[];break;case "textarea":e=gb(a,e);d=gb(a,d);f=[];break;default:"function"!==typeof e.onClick&&"function"===typeof d.onClick&&(a.onclick=Bf);}ub(c,d);var g;c=null;for(l in e)if(!d.hasOwnProperty(l)&&e.hasOwnProperty(l)&&null!=e[l])if("style"===l){var h=e[l];for(g in h)h.hasOwnProperty(g)&&
(c||(c={}),c[g]="");}else "dangerouslySetInnerHTML"!==l&&"children"!==l&&"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&"autoFocus"!==l&&(ea.hasOwnProperty(l)?f||(f=[]):(f=f||[]).push(l,null));for(l in d){var k=d[l];h=null!=e?e[l]:void 0;if(d.hasOwnProperty(l)&&k!==h&&(null!=k||null!=h))if("style"===l)if(h){for(g in h)!h.hasOwnProperty(g)||k&&k.hasOwnProperty(g)||(c||(c={}),c[g]="");for(g in k)k.hasOwnProperty(g)&&h[g]!==k[g]&&(c||(c={}),c[g]=k[g]);}else c||(f||(f=[]),f.push(l,
c)),c=k;else "dangerouslySetInnerHTML"===l?(k=k?k.__html:void 0,h=h?h.__html:void 0,null!=k&&h!==k&&(f=f||[]).push(l,k)):"children"===l?"string"!==typeof k&&"number"!==typeof k||(f=f||[]).push(l,""+k):"suppressContentEditableWarning"!==l&&"suppressHydrationWarning"!==l&&(ea.hasOwnProperty(l)?(null!=k&&"onScroll"===l&&D("scroll",a),f||h===k||(f=[])):(f=f||[]).push(l,k));}c&&(f=f||[]).push("style",c);var l=f;if(b.updateQueue=l)b.flags|=4;}};Cj=function(a,b,c,d){c!==d&&(b.flags|=4);};
function Dj(a,b){if(!I)switch(a.tailMode){case "hidden":b=a.tail;for(var c=null;null!==b;)null!==b.alternate&&(c=b),b=b.sibling;null===c?a.tail=null:c.sibling=null;break;case "collapsed":c=a.tail;for(var d=null;null!==c;)null!==c.alternate&&(d=c),c=c.sibling;null===d?b||null===a.tail?a.tail=null:a.tail.sibling=null:d.sibling=null;}}
function S(a){var b=null!==a.alternate&&a.alternate.child===a.child,c=0,d=0;if(b)for(var e=a.child;null!==e;)c|=e.lanes|e.childLanes,d|=e.subtreeFlags&14680064,d|=e.flags&14680064,e.return=a,e=e.sibling;else for(e=a.child;null!==e;)c|=e.lanes|e.childLanes,d|=e.subtreeFlags,d|=e.flags,e.return=a,e=e.sibling;a.subtreeFlags|=d;a.childLanes=c;return b}
function Ej(a,b,c){var d=b.pendingProps;wg(b);switch(b.tag){case 2:case 16:case 15:case 0:case 11:case 7:case 8:case 12:case 9:case 14:return S(b),null;case 1:return Zf(b.type)&&$f(),S(b),null;case 3:d=b.stateNode;zh();E(Wf);E(H);Eh();d.pendingContext&&(d.context=d.pendingContext,d.pendingContext=null);if(null===a||null===a.child)Gg(b)?b.flags|=4:null===a||a.memoizedState.isDehydrated&&0===(b.flags&256)||(b.flags|=1024,null!==zg&&(Fj(zg),zg=null));Aj(a,b);S(b);return null;case 5:Bh(b);var e=xh(wh.current);
c=b.type;if(null!==a&&null!=b.stateNode)Bj(a,b,c,d,e),a.ref!==b.ref&&(b.flags|=512,b.flags|=2097152);else {if(!d){if(null===b.stateNode)throw Error(p(166));S(b);return null}a=xh(uh.current);if(Gg(b)){d=b.stateNode;c=b.type;var f=b.memoizedProps;d[Of]=b;d[Pf]=f;a=0!==(b.mode&1);switch(c){case "dialog":D("cancel",d);D("close",d);break;case "iframe":case "object":case "embed":D("load",d);break;case "video":case "audio":for(e=0;e<lf.length;e++)D(lf[e],d);break;case "source":D("error",d);break;case "img":case "image":case "link":D("error",
d);D("load",d);break;case "details":D("toggle",d);break;case "input":Za(d,f);D("invalid",d);break;case "select":d._wrapperState={wasMultiple:!!f.multiple};D("invalid",d);break;case "textarea":hb(d,f),D("invalid",d);}ub(c,f);e=null;for(var g in f)if(f.hasOwnProperty(g)){var h=f[g];"children"===g?"string"===typeof h?d.textContent!==h&&(true!==f.suppressHydrationWarning&&Af(d.textContent,h,a),e=["children",h]):"number"===typeof h&&d.textContent!==""+h&&(true!==f.suppressHydrationWarning&&Af(d.textContent,
h,a),e=["children",""+h]):ea.hasOwnProperty(g)&&null!=h&&"onScroll"===g&&D("scroll",d);}switch(c){case "input":Va(d);db(d,f,true);break;case "textarea":Va(d);jb(d);break;case "select":case "option":break;default:"function"===typeof f.onClick&&(d.onclick=Bf);}d=e;b.updateQueue=d;null!==d&&(b.flags|=4);}else {g=9===e.nodeType?e:e.ownerDocument;"http://www.w3.org/1999/xhtml"===a&&(a=kb(c));"http://www.w3.org/1999/xhtml"===a?"script"===c?(a=g.createElement("div"),a.innerHTML="<script>\x3c/script>",a=a.removeChild(a.firstChild)):
"string"===typeof d.is?a=g.createElement(c,{is:d.is}):(a=g.createElement(c),"select"===c&&(g=a,d.multiple?g.multiple=true:d.size&&(g.size=d.size))):a=g.createElementNS(a,c);a[Of]=b;a[Pf]=d;zj(a,b,false,false);b.stateNode=a;a:{g=vb(c,d);switch(c){case "dialog":D("cancel",a);D("close",a);e=d;break;case "iframe":case "object":case "embed":D("load",a);e=d;break;case "video":case "audio":for(e=0;e<lf.length;e++)D(lf[e],a);e=d;break;case "source":D("error",a);e=d;break;case "img":case "image":case "link":D("error",
a);D("load",a);e=d;break;case "details":D("toggle",a);e=d;break;case "input":Za(a,d);e=Ya(a,d);D("invalid",a);break;case "option":e=d;break;case "select":a._wrapperState={wasMultiple:!!d.multiple};e=A({},d,{value:void 0});D("invalid",a);break;case "textarea":hb(a,d);e=gb(a,d);D("invalid",a);break;default:e=d;}ub(c,e);h=e;for(f in h)if(h.hasOwnProperty(f)){var k=h[f];"style"===f?sb(a,k):"dangerouslySetInnerHTML"===f?(k=k?k.__html:void 0,null!=k&&nb(a,k)):"children"===f?"string"===typeof k?("textarea"!==
c||""!==k)&&ob(a,k):"number"===typeof k&&ob(a,""+k):"suppressContentEditableWarning"!==f&&"suppressHydrationWarning"!==f&&"autoFocus"!==f&&(ea.hasOwnProperty(f)?null!=k&&"onScroll"===f&&D("scroll",a):null!=k&&ta(a,f,k,g));}switch(c){case "input":Va(a);db(a,d,false);break;case "textarea":Va(a);jb(a);break;case "option":null!=d.value&&a.setAttribute("value",""+Sa(d.value));break;case "select":a.multiple=!!d.multiple;f=d.value;null!=f?fb(a,!!d.multiple,f,false):null!=d.defaultValue&&fb(a,!!d.multiple,d.defaultValue,
true);break;default:"function"===typeof e.onClick&&(a.onclick=Bf);}switch(c){case "button":case "input":case "select":case "textarea":d=!!d.autoFocus;break a;case "img":d=true;break a;default:d=false;}}d&&(b.flags|=4);}null!==b.ref&&(b.flags|=512,b.flags|=2097152);}S(b);return null;case 6:if(a&&null!=b.stateNode)Cj(a,b,a.memoizedProps,d);else {if("string"!==typeof d&&null===b.stateNode)throw Error(p(166));c=xh(wh.current);xh(uh.current);if(Gg(b)){d=b.stateNode;c=b.memoizedProps;d[Of]=b;if(f=d.nodeValue!==c)if(a=
xg,null!==a)switch(a.tag){case 3:Af(d.nodeValue,c,0!==(a.mode&1));break;case 5:true!==a.memoizedProps.suppressHydrationWarning&&Af(d.nodeValue,c,0!==(a.mode&1));}f&&(b.flags|=4);}else d=(9===c.nodeType?c:c.ownerDocument).createTextNode(d),d[Of]=b,b.stateNode=d;}S(b);return null;case 13:E(L);d=b.memoizedState;if(null===a||null!==a.memoizedState&&null!==a.memoizedState.dehydrated){if(I&&null!==yg&&0!==(b.mode&1)&&0===(b.flags&128))Hg(),Ig(),b.flags|=98560,f=false;else if(f=Gg(b),null!==d&&null!==d.dehydrated){if(null===
a){if(!f)throw Error(p(318));f=b.memoizedState;f=null!==f?f.dehydrated:null;if(!f)throw Error(p(317));f[Of]=b;}else Ig(),0===(b.flags&128)&&(b.memoizedState=null),b.flags|=4;S(b);f=false;}else null!==zg&&(Fj(zg),zg=null),f=true;if(!f)return b.flags&65536?b:null}if(0!==(b.flags&128))return b.lanes=c,b;d=null!==d;d!==(null!==a&&null!==a.memoizedState)&&d&&(b.child.flags|=8192,0!==(b.mode&1)&&(null===a||0!==(L.current&1)?0===T&&(T=3):tj()));null!==b.updateQueue&&(b.flags|=4);S(b);return null;case 4:return zh(),
Aj(a,b),null===a&&sf(b.stateNode.containerInfo),S(b),null;case 10:return ah(b.type._context),S(b),null;case 17:return Zf(b.type)&&$f(),S(b),null;case 19:E(L);f=b.memoizedState;if(null===f)return S(b),null;d=0!==(b.flags&128);g=f.rendering;if(null===g)if(d)Dj(f,false);else {if(0!==T||null!==a&&0!==(a.flags&128))for(a=b.child;null!==a;){g=Ch(a);if(null!==g){b.flags|=128;Dj(f,false);d=g.updateQueue;null!==d&&(b.updateQueue=d,b.flags|=4);b.subtreeFlags=0;d=c;for(c=b.child;null!==c;)f=c,a=d,f.flags&=14680066,
g=f.alternate,null===g?(f.childLanes=0,f.lanes=a,f.child=null,f.subtreeFlags=0,f.memoizedProps=null,f.memoizedState=null,f.updateQueue=null,f.dependencies=null,f.stateNode=null):(f.childLanes=g.childLanes,f.lanes=g.lanes,f.child=g.child,f.subtreeFlags=0,f.deletions=null,f.memoizedProps=g.memoizedProps,f.memoizedState=g.memoizedState,f.updateQueue=g.updateQueue,f.type=g.type,a=g.dependencies,f.dependencies=null===a?null:{lanes:a.lanes,firstContext:a.firstContext}),c=c.sibling;G(L,L.current&1|2);return b.child}a=
a.sibling;}null!==f.tail&&B()>Gj&&(b.flags|=128,d=true,Dj(f,false),b.lanes=4194304);}else {if(!d)if(a=Ch(g),null!==a){if(b.flags|=128,d=true,c=a.updateQueue,null!==c&&(b.updateQueue=c,b.flags|=4),Dj(f,true),null===f.tail&&"hidden"===f.tailMode&&!g.alternate&&!I)return S(b),null}else 2*B()-f.renderingStartTime>Gj&&1073741824!==c&&(b.flags|=128,d=true,Dj(f,false),b.lanes=4194304);f.isBackwards?(g.sibling=b.child,b.child=g):(c=f.last,null!==c?c.sibling=g:b.child=g,f.last=g);}if(null!==f.tail)return b=f.tail,f.rendering=
b,f.tail=b.sibling,f.renderingStartTime=B(),b.sibling=null,c=L.current,G(L,d?c&1|2:c&1),b;S(b);return null;case 22:case 23:return Hj(),d=null!==b.memoizedState,null!==a&&null!==a.memoizedState!==d&&(b.flags|=8192),d&&0!==(b.mode&1)?0!==(fj&1073741824)&&(S(b),b.subtreeFlags&6&&(b.flags|=8192)):S(b),null;case 24:return null;case 25:return null}throw Error(p(156,b.tag));}
function Ij(a,b){wg(b);switch(b.tag){case 1:return Zf(b.type)&&$f(),a=b.flags,a&65536?(b.flags=a&-65537|128,b):null;case 3:return zh(),E(Wf),E(H),Eh(),a=b.flags,0!==(a&65536)&&0===(a&128)?(b.flags=a&-65537|128,b):null;case 5:return Bh(b),null;case 13:E(L);a=b.memoizedState;if(null!==a&&null!==a.dehydrated){if(null===b.alternate)throw Error(p(340));Ig();}a=b.flags;return a&65536?(b.flags=a&-65537|128,b):null;case 19:return E(L),null;case 4:return zh(),null;case 10:return ah(b.type._context),null;case 22:case 23:return Hj(),
null;case 24:return null;default:return null}}var Jj=false,U=false,Kj="function"===typeof WeakSet?WeakSet:Set,V=null;function Lj(a,b){var c=a.ref;if(null!==c)if("function"===typeof c)try{c(null);}catch(d){W(a,b,d);}else c.current=null;}function Mj(a,b,c){try{c();}catch(d){W(a,b,d);}}var Nj=false;
function Oj(a,b){Cf=dd;a=Me();if(Ne(a)){if("selectionStart"in a)var c={start:a.selectionStart,end:a.selectionEnd};else a:{c=(c=a.ownerDocument)&&c.defaultView||window;var d=c.getSelection&&c.getSelection();if(d&&0!==d.rangeCount){c=d.anchorNode;var e=d.anchorOffset,f=d.focusNode;d=d.focusOffset;try{c.nodeType,f.nodeType;}catch(F){c=null;break a}var g=0,h=-1,k=-1,l=0,m=0,q=a,r=null;b:for(;;){for(var y;;){q!==c||0!==e&&3!==q.nodeType||(h=g+e);q!==f||0!==d&&3!==q.nodeType||(k=g+d);3===q.nodeType&&(g+=
q.nodeValue.length);if(null===(y=q.firstChild))break;r=q;q=y;}for(;;){if(q===a)break b;r===c&&++l===e&&(h=g);r===f&&++m===d&&(k=g);if(null!==(y=q.nextSibling))break;q=r;r=q.parentNode;}q=y;}c=-1===h||-1===k?null:{start:h,end:k};}else c=null;}c=c||{start:0,end:0};}else c=null;Df={focusedElem:a,selectionRange:c};dd=false;for(V=b;null!==V;)if(b=V,a=b.child,0!==(b.subtreeFlags&1028)&&null!==a)a.return=b,V=a;else for(;null!==V;){b=V;try{var n=b.alternate;if(0!==(b.flags&1024))switch(b.tag){case 0:case 11:case 15:break;
case 1:if(null!==n){var t=n.memoizedProps,J=n.memoizedState,x=b.stateNode,w=x.getSnapshotBeforeUpdate(b.elementType===b.type?t:Ci(b.type,t),J);x.__reactInternalSnapshotBeforeUpdate=w;}break;case 3:var u=b.stateNode.containerInfo;1===u.nodeType?u.textContent="":9===u.nodeType&&u.documentElement&&u.removeChild(u.documentElement);break;case 5:case 6:case 4:case 17:break;default:throw Error(p(163));}}catch(F){W(b,b.return,F);}a=b.sibling;if(null!==a){a.return=b.return;V=a;break}V=b.return;}n=Nj;Nj=false;return n}
function Pj(a,b,c){var d=b.updateQueue;d=null!==d?d.lastEffect:null;if(null!==d){var e=d=d.next;do{if((e.tag&a)===a){var f=e.destroy;e.destroy=void 0;void 0!==f&&Mj(b,c,f);}e=e.next;}while(e!==d)}}function Qj(a,b){b=b.updateQueue;b=null!==b?b.lastEffect:null;if(null!==b){var c=b=b.next;do{if((c.tag&a)===a){var d=c.create;c.destroy=d();}c=c.next;}while(c!==b)}}function Rj(a){var b=a.ref;if(null!==b){var c=a.stateNode;switch(a.tag){case 5:a=c;break;default:a=c;}"function"===typeof b?b(a):b.current=a;}}
function Sj(a){var b=a.alternate;null!==b&&(a.alternate=null,Sj(b));a.child=null;a.deletions=null;a.sibling=null;5===a.tag&&(b=a.stateNode,null!==b&&(delete b[Of],delete b[Pf],delete b[of],delete b[Qf],delete b[Rf]));a.stateNode=null;a.return=null;a.dependencies=null;a.memoizedProps=null;a.memoizedState=null;a.pendingProps=null;a.stateNode=null;a.updateQueue=null;}function Tj(a){return 5===a.tag||3===a.tag||4===a.tag}
function Uj(a){a:for(;;){for(;null===a.sibling;){if(null===a.return||Tj(a.return))return null;a=a.return;}a.sibling.return=a.return;for(a=a.sibling;5!==a.tag&&6!==a.tag&&18!==a.tag;){if(a.flags&2)continue a;if(null===a.child||4===a.tag)continue a;else a.child.return=a,a=a.child;}if(!(a.flags&2))return a.stateNode}}
function Vj(a,b,c){var d=a.tag;if(5===d||6===d)a=a.stateNode,b?8===c.nodeType?c.parentNode.insertBefore(a,b):c.insertBefore(a,b):(8===c.nodeType?(b=c.parentNode,b.insertBefore(a,c)):(b=c,b.appendChild(a)),c=c._reactRootContainer,null!==c&&void 0!==c||null!==b.onclick||(b.onclick=Bf));else if(4!==d&&(a=a.child,null!==a))for(Vj(a,b,c),a=a.sibling;null!==a;)Vj(a,b,c),a=a.sibling;}
function Wj(a,b,c){var d=a.tag;if(5===d||6===d)a=a.stateNode,b?c.insertBefore(a,b):c.appendChild(a);else if(4!==d&&(a=a.child,null!==a))for(Wj(a,b,c),a=a.sibling;null!==a;)Wj(a,b,c),a=a.sibling;}var X=null,Xj=false;function Yj(a,b,c){for(c=c.child;null!==c;)Zj(a,b,c),c=c.sibling;}
function Zj(a,b,c){if(lc&&"function"===typeof lc.onCommitFiberUnmount)try{lc.onCommitFiberUnmount(kc,c);}catch(h){}switch(c.tag){case 5:U||Lj(c,b);case 6:var d=X,e=Xj;X=null;Yj(a,b,c);X=d;Xj=e;null!==X&&(Xj?(a=X,c=c.stateNode,8===a.nodeType?a.parentNode.removeChild(c):a.removeChild(c)):X.removeChild(c.stateNode));break;case 18:null!==X&&(Xj?(a=X,c=c.stateNode,8===a.nodeType?Kf(a.parentNode,c):1===a.nodeType&&Kf(a,c),bd(a)):Kf(X,c.stateNode));break;case 4:d=X;e=Xj;X=c.stateNode.containerInfo;Xj=true;
Yj(a,b,c);X=d;Xj=e;break;case 0:case 11:case 14:case 15:if(!U&&(d=c.updateQueue,null!==d&&(d=d.lastEffect,null!==d))){e=d=d.next;do{var f=e,g=f.destroy;f=f.tag;void 0!==g&&(0!==(f&2)?Mj(c,b,g):0!==(f&4)&&Mj(c,b,g));e=e.next;}while(e!==d)}Yj(a,b,c);break;case 1:if(!U&&(Lj(c,b),d=c.stateNode,"function"===typeof d.componentWillUnmount))try{d.props=c.memoizedProps,d.state=c.memoizedState,d.componentWillUnmount();}catch(h){W(c,b,h);}Yj(a,b,c);break;case 21:Yj(a,b,c);break;case 22:c.mode&1?(U=(d=U)||null!==
c.memoizedState,Yj(a,b,c),U=d):Yj(a,b,c);break;default:Yj(a,b,c);}}function ak(a){var b=a.updateQueue;if(null!==b){a.updateQueue=null;var c=a.stateNode;null===c&&(c=a.stateNode=new Kj);b.forEach(function(b){var d=bk.bind(null,a,b);c.has(b)||(c.add(b),b.then(d,d));});}}
function ck(a,b){var c=b.deletions;if(null!==c)for(var d=0;d<c.length;d++){var e=c[d];try{var f=a,g=b,h=g;a:for(;null!==h;){switch(h.tag){case 5:X=h.stateNode;Xj=!1;break a;case 3:X=h.stateNode.containerInfo;Xj=!0;break a;case 4:X=h.stateNode.containerInfo;Xj=!0;break a}h=h.return;}if(null===X)throw Error(p(160));Zj(f,g,e);X=null;Xj=!1;var k=e.alternate;null!==k&&(k.return=null);e.return=null;}catch(l){W(e,b,l);}}if(b.subtreeFlags&12854)for(b=b.child;null!==b;)dk(b,a),b=b.sibling;}
function dk(a,b){var c=a.alternate,d=a.flags;switch(a.tag){case 0:case 11:case 14:case 15:ck(b,a);ek(a);if(d&4){try{Pj(3,a,a.return),Qj(3,a);}catch(t){W(a,a.return,t);}try{Pj(5,a,a.return);}catch(t){W(a,a.return,t);}}break;case 1:ck(b,a);ek(a);d&512&&null!==c&&Lj(c,c.return);break;case 5:ck(b,a);ek(a);d&512&&null!==c&&Lj(c,c.return);if(a.flags&32){var e=a.stateNode;try{ob(e,"");}catch(t){W(a,a.return,t);}}if(d&4&&(e=a.stateNode,null!=e)){var f=a.memoizedProps,g=null!==c?c.memoizedProps:f,h=a.type,k=a.updateQueue;
a.updateQueue=null;if(null!==k)try{"input"===h&&"radio"===f.type&&null!=f.name&&ab(e,f);vb(h,g);var l=vb(h,f);for(g=0;g<k.length;g+=2){var m=k[g],q=k[g+1];"style"===m?sb(e,q):"dangerouslySetInnerHTML"===m?nb(e,q):"children"===m?ob(e,q):ta(e,m,q,l);}switch(h){case "input":bb(e,f);break;case "textarea":ib(e,f);break;case "select":var r=e._wrapperState.wasMultiple;e._wrapperState.wasMultiple=!!f.multiple;var y=f.value;null!=y?fb(e,!!f.multiple,y,!1):r!==!!f.multiple&&(null!=f.defaultValue?fb(e,!!f.multiple,
f.defaultValue,!0):fb(e,!!f.multiple,f.multiple?[]:"",!1));}e[Pf]=f;}catch(t){W(a,a.return,t);}}break;case 6:ck(b,a);ek(a);if(d&4){if(null===a.stateNode)throw Error(p(162));e=a.stateNode;f=a.memoizedProps;try{e.nodeValue=f;}catch(t){W(a,a.return,t);}}break;case 3:ck(b,a);ek(a);if(d&4&&null!==c&&c.memoizedState.isDehydrated)try{bd(b.containerInfo);}catch(t){W(a,a.return,t);}break;case 4:ck(b,a);ek(a);break;case 13:ck(b,a);ek(a);e=a.child;e.flags&8192&&(f=null!==e.memoizedState,e.stateNode.isHidden=f,!f||
null!==e.alternate&&null!==e.alternate.memoizedState||(fk=B()));d&4&&ak(a);break;case 22:m=null!==c&&null!==c.memoizedState;a.mode&1?(U=(l=U)||m,ck(b,a),U=l):ck(b,a);ek(a);if(d&8192){l=null!==a.memoizedState;if((a.stateNode.isHidden=l)&&!m&&0!==(a.mode&1))for(V=a,m=a.child;null!==m;){for(q=V=m;null!==V;){r=V;y=r.child;switch(r.tag){case 0:case 11:case 14:case 15:Pj(4,r,r.return);break;case 1:Lj(r,r.return);var n=r.stateNode;if("function"===typeof n.componentWillUnmount){d=r;c=r.return;try{b=d,n.props=
b.memoizedProps,n.state=b.memoizedState,n.componentWillUnmount();}catch(t){W(d,c,t);}}break;case 5:Lj(r,r.return);break;case 22:if(null!==r.memoizedState){gk(q);continue}}null!==y?(y.return=r,V=y):gk(q);}m=m.sibling;}a:for(m=null,q=a;;){if(5===q.tag){if(null===m){m=q;try{e=q.stateNode,l?(f=e.style,"function"===typeof f.setProperty?f.setProperty("display","none","important"):f.display="none"):(h=q.stateNode,k=q.memoizedProps.style,g=void 0!==k&&null!==k&&k.hasOwnProperty("display")?k.display:null,h.style.display=
rb("display",g));}catch(t){W(a,a.return,t);}}}else if(6===q.tag){if(null===m)try{q.stateNode.nodeValue=l?"":q.memoizedProps;}catch(t){W(a,a.return,t);}}else if((22!==q.tag&&23!==q.tag||null===q.memoizedState||q===a)&&null!==q.child){q.child.return=q;q=q.child;continue}if(q===a)break a;for(;null===q.sibling;){if(null===q.return||q.return===a)break a;m===q&&(m=null);q=q.return;}m===q&&(m=null);q.sibling.return=q.return;q=q.sibling;}}break;case 19:ck(b,a);ek(a);d&4&&ak(a);break;case 21:break;default:ck(b,
a),ek(a);}}function ek(a){var b=a.flags;if(b&2){try{a:{for(var c=a.return;null!==c;){if(Tj(c)){var d=c;break a}c=c.return;}throw Error(p(160));}switch(d.tag){case 5:var e=d.stateNode;d.flags&32&&(ob(e,""),d.flags&=-33);var f=Uj(a);Wj(a,f,e);break;case 3:case 4:var g=d.stateNode.containerInfo,h=Uj(a);Vj(a,h,g);break;default:throw Error(p(161));}}catch(k){W(a,a.return,k);}a.flags&=-3;}b&4096&&(a.flags&=-4097);}function hk(a,b,c){V=a;ik(a);}
function ik(a,b,c){for(var d=0!==(a.mode&1);null!==V;){var e=V,f=e.child;if(22===e.tag&&d){var g=null!==e.memoizedState||Jj;if(!g){var h=e.alternate,k=null!==h&&null!==h.memoizedState||U;h=Jj;var l=U;Jj=g;if((U=k)&&!l)for(V=e;null!==V;)g=V,k=g.child,22===g.tag&&null!==g.memoizedState?jk(e):null!==k?(k.return=g,V=k):jk(e);for(;null!==f;)V=f,ik(f),f=f.sibling;V=e;Jj=h;U=l;}kk(a);}else 0!==(e.subtreeFlags&8772)&&null!==f?(f.return=e,V=f):kk(a);}}
function kk(a){for(;null!==V;){var b=V;if(0!==(b.flags&8772)){var c=b.alternate;try{if(0!==(b.flags&8772))switch(b.tag){case 0:case 11:case 15:U||Qj(5,b);break;case 1:var d=b.stateNode;if(b.flags&4&&!U)if(null===c)d.componentDidMount();else {var e=b.elementType===b.type?c.memoizedProps:Ci(b.type,c.memoizedProps);d.componentDidUpdate(e,c.memoizedState,d.__reactInternalSnapshotBeforeUpdate);}var f=b.updateQueue;null!==f&&sh(b,f,d);break;case 3:var g=b.updateQueue;if(null!==g){c=null;if(null!==b.child)switch(b.child.tag){case 5:c=
b.child.stateNode;break;case 1:c=b.child.stateNode;}sh(b,g,c);}break;case 5:var h=b.stateNode;if(null===c&&b.flags&4){c=h;var k=b.memoizedProps;switch(b.type){case "button":case "input":case "select":case "textarea":k.autoFocus&&c.focus();break;case "img":k.src&&(c.src=k.src);}}break;case 6:break;case 4:break;case 12:break;case 13:if(null===b.memoizedState){var l=b.alternate;if(null!==l){var m=l.memoizedState;if(null!==m){var q=m.dehydrated;null!==q&&bd(q);}}}break;case 19:case 17:case 21:case 22:case 23:case 25:break;
default:throw Error(p(163));}U||b.flags&512&&Rj(b);}catch(r){W(b,b.return,r);}}if(b===a){V=null;break}c=b.sibling;if(null!==c){c.return=b.return;V=c;break}V=b.return;}}function gk(a){for(;null!==V;){var b=V;if(b===a){V=null;break}var c=b.sibling;if(null!==c){c.return=b.return;V=c;break}V=b.return;}}
function jk(a){for(;null!==V;){var b=V;try{switch(b.tag){case 0:case 11:case 15:var c=b.return;try{Qj(4,b);}catch(k){W(b,c,k);}break;case 1:var d=b.stateNode;if("function"===typeof d.componentDidMount){var e=b.return;try{d.componentDidMount();}catch(k){W(b,e,k);}}var f=b.return;try{Rj(b);}catch(k){W(b,f,k);}break;case 5:var g=b.return;try{Rj(b);}catch(k){W(b,g,k);}}}catch(k){W(b,b.return,k);}if(b===a){V=null;break}var h=b.sibling;if(null!==h){h.return=b.return;V=h;break}V=b.return;}}
var lk=Math.ceil,mk=ua.ReactCurrentDispatcher,nk=ua.ReactCurrentOwner,ok=ua.ReactCurrentBatchConfig,K=0,Q=null,Y=null,Z=0,fj=0,ej=Uf(0),T=0,pk=null,rh=0,qk=0,rk=0,sk=null,tk=null,fk=0,Gj=Infinity,uk=null,Oi=false,Pi=null,Ri=null,vk=false,wk=null,xk=0,yk=0,zk=null,Ak=-1,Bk=0;function R(){return 0!==(K&6)?B():-1!==Ak?Ak:Ak=B()}
function yi(a){if(0===(a.mode&1))return 1;if(0!==(K&2)&&0!==Z)return Z&-Z;if(null!==Kg.transition)return 0===Bk&&(Bk=yc()),Bk;a=C;if(0!==a)return a;a=window.event;a=void 0===a?16:jd(a.type);return a}function gi(a,b,c,d){if(50<yk)throw yk=0,zk=null,Error(p(185));Ac(a,c,d);if(0===(K&2)||a!==Q)a===Q&&(0===(K&2)&&(qk|=c),4===T&&Ck(a,Z)),Dk(a,d),1===c&&0===K&&0===(b.mode&1)&&(Gj=B()+500,fg&&jg());}
function Dk(a,b){var c=a.callbackNode;wc(a,b);var d=uc(a,a===Q?Z:0);if(0===d)null!==c&&bc(c),a.callbackNode=null,a.callbackPriority=0;else if(b=d&-d,a.callbackPriority!==b){null!=c&&bc(c);if(1===b)0===a.tag?ig(Ek.bind(null,a)):hg(Ek.bind(null,a)),Jf(function(){0===(K&6)&&jg();}),c=null;else {switch(Dc(d)){case 1:c=fc;break;case 4:c=gc;break;case 16:c=hc;break;case 536870912:c=jc;break;default:c=hc;}c=Fk(c,Gk.bind(null,a));}a.callbackPriority=b;a.callbackNode=c;}}
function Gk(a,b){Ak=-1;Bk=0;if(0!==(K&6))throw Error(p(327));var c=a.callbackNode;if(Hk()&&a.callbackNode!==c)return null;var d=uc(a,a===Q?Z:0);if(0===d)return null;if(0!==(d&30)||0!==(d&a.expiredLanes)||b)b=Ik(a,d);else {b=d;var e=K;K|=2;var f=Jk();if(Q!==a||Z!==b)uk=null,Gj=B()+500,Kk(a,b);do try{Lk();break}catch(h){Mk(a,h);}while(1);$g();mk.current=f;K=e;null!==Y?b=0:(Q=null,Z=0,b=T);}if(0!==b){2===b&&(e=xc(a),0!==e&&(d=e,b=Nk(a,e)));if(1===b)throw c=pk,Kk(a,0),Ck(a,d),Dk(a,B()),c;if(6===b)Ck(a,d);
else {e=a.current.alternate;if(0===(d&30)&&!Ok(e)&&(b=Ik(a,d),2===b&&(f=xc(a),0!==f&&(d=f,b=Nk(a,f))),1===b))throw c=pk,Kk(a,0),Ck(a,d),Dk(a,B()),c;a.finishedWork=e;a.finishedLanes=d;switch(b){case 0:case 1:throw Error(p(345));case 2:Pk(a,tk,uk);break;case 3:Ck(a,d);if((d&130023424)===d&&(b=fk+500-B(),10<b)){if(0!==uc(a,0))break;e=a.suspendedLanes;if((e&d)!==d){R();a.pingedLanes|=a.suspendedLanes&e;break}a.timeoutHandle=Ff(Pk.bind(null,a,tk,uk),b);break}Pk(a,tk,uk);break;case 4:Ck(a,d);if((d&4194240)===
d)break;b=a.eventTimes;for(e=-1;0<d;){var g=31-oc(d);f=1<<g;g=b[g];g>e&&(e=g);d&=~f;}d=e;d=B()-d;d=(120>d?120:480>d?480:1080>d?1080:1920>d?1920:3E3>d?3E3:4320>d?4320:1960*lk(d/1960))-d;if(10<d){a.timeoutHandle=Ff(Pk.bind(null,a,tk,uk),d);break}Pk(a,tk,uk);break;case 5:Pk(a,tk,uk);break;default:throw Error(p(329));}}}Dk(a,B());return a.callbackNode===c?Gk.bind(null,a):null}
function Nk(a,b){var c=sk;a.current.memoizedState.isDehydrated&&(Kk(a,b).flags|=256);a=Ik(a,b);2!==a&&(b=tk,tk=c,null!==b&&Fj(b));return a}function Fj(a){null===tk?tk=a:tk.push.apply(tk,a);}
function Ok(a){for(var b=a;;){if(b.flags&16384){var c=b.updateQueue;if(null!==c&&(c=c.stores,null!==c))for(var d=0;d<c.length;d++){var e=c[d],f=e.getSnapshot;e=e.value;try{if(!He(f(),e))return !1}catch(g){return  false}}}c=b.child;if(b.subtreeFlags&16384&&null!==c)c.return=b,b=c;else {if(b===a)break;for(;null===b.sibling;){if(null===b.return||b.return===a)return  true;b=b.return;}b.sibling.return=b.return;b=b.sibling;}}return  true}
function Ck(a,b){b&=~rk;b&=~qk;a.suspendedLanes|=b;a.pingedLanes&=~b;for(a=a.expirationTimes;0<b;){var c=31-oc(b),d=1<<c;a[c]=-1;b&=~d;}}function Ek(a){if(0!==(K&6))throw Error(p(327));Hk();var b=uc(a,0);if(0===(b&1))return Dk(a,B()),null;var c=Ik(a,b);if(0!==a.tag&&2===c){var d=xc(a);0!==d&&(b=d,c=Nk(a,d));}if(1===c)throw c=pk,Kk(a,0),Ck(a,b),Dk(a,B()),c;if(6===c)throw Error(p(345));a.finishedWork=a.current.alternate;a.finishedLanes=b;Pk(a,tk,uk);Dk(a,B());return null}
function Qk(a,b){var c=K;K|=1;try{return a(b)}finally{K=c,0===K&&(Gj=B()+500,fg&&jg());}}function Rk(a){null!==wk&&0===wk.tag&&0===(K&6)&&Hk();var b=K;K|=1;var c=ok.transition,d=C;try{if(ok.transition=null,C=1,a)return a()}finally{C=d,ok.transition=c,K=b,0===(K&6)&&jg();}}function Hj(){fj=ej.current;E(ej);}
function Kk(a,b){a.finishedWork=null;a.finishedLanes=0;var c=a.timeoutHandle;-1!==c&&(a.timeoutHandle=-1,Gf(c));if(null!==Y)for(c=Y.return;null!==c;){var d=c;wg(d);switch(d.tag){case 1:d=d.type.childContextTypes;null!==d&&void 0!==d&&$f();break;case 3:zh();E(Wf);E(H);Eh();break;case 5:Bh(d);break;case 4:zh();break;case 13:E(L);break;case 19:E(L);break;case 10:ah(d.type._context);break;case 22:case 23:Hj();}c=c.return;}Q=a;Y=a=Pg(a.current,null);Z=fj=b;T=0;pk=null;rk=qk=rh=0;tk=sk=null;if(null!==fh){for(b=
0;b<fh.length;b++)if(c=fh[b],d=c.interleaved,null!==d){c.interleaved=null;var e=d.next,f=c.pending;if(null!==f){var g=f.next;f.next=e;d.next=g;}c.pending=d;}fh=null;}return a}
function Mk(a,b){do{var c=Y;try{$g();Fh.current=Rh;if(Ih){for(var d=M.memoizedState;null!==d;){var e=d.queue;null!==e&&(e.pending=null);d=d.next;}Ih=!1;}Hh=0;O=N=M=null;Jh=!1;Kh=0;nk.current=null;if(null===c||null===c.return){T=1;pk=b;Y=null;break}a:{var f=a,g=c.return,h=c,k=b;b=Z;h.flags|=32768;if(null!==k&&"object"===typeof k&&"function"===typeof k.then){var l=k,m=h,q=m.tag;if(0===(m.mode&1)&&(0===q||11===q||15===q)){var r=m.alternate;r?(m.updateQueue=r.updateQueue,m.memoizedState=r.memoizedState,
m.lanes=r.lanes):(m.updateQueue=null,m.memoizedState=null);}var y=Ui(g);if(null!==y){y.flags&=-257;Vi(y,g,h,f,b);y.mode&1&&Si(f,l,b);b=y;k=l;var n=b.updateQueue;if(null===n){var t=new Set;t.add(k);b.updateQueue=t;}else n.add(k);break a}else {if(0===(b&1)){Si(f,l,b);tj();break a}k=Error(p(426));}}else if(I&&h.mode&1){var J=Ui(g);if(null!==J){0===(J.flags&65536)&&(J.flags|=256);Vi(J,g,h,f,b);Jg(Ji(k,h));break a}}f=k=Ji(k,h);4!==T&&(T=2);null===sk?sk=[f]:sk.push(f);f=g;do{switch(f.tag){case 3:f.flags|=65536;
b&=-b;f.lanes|=b;var x=Ni(f,k,b);ph(f,x);break a;case 1:h=k;var w=f.type,u=f.stateNode;if(0===(f.flags&128)&&("function"===typeof w.getDerivedStateFromError||null!==u&&"function"===typeof u.componentDidCatch&&(null===Ri||!Ri.has(u)))){f.flags|=65536;b&=-b;f.lanes|=b;var F=Qi(f,h,b);ph(f,F);break a}}f=f.return;}while(null!==f)}Sk(c);}catch(na){b=na;Y===c&&null!==c&&(Y=c=c.return);continue}break}while(1)}function Jk(){var a=mk.current;mk.current=Rh;return null===a?Rh:a}
function tj(){if(0===T||3===T||2===T)T=4;null===Q||0===(rh&268435455)&&0===(qk&268435455)||Ck(Q,Z);}function Ik(a,b){var c=K;K|=2;var d=Jk();if(Q!==a||Z!==b)uk=null,Kk(a,b);do try{Tk();break}catch(e){Mk(a,e);}while(1);$g();K=c;mk.current=d;if(null!==Y)throw Error(p(261));Q=null;Z=0;return T}function Tk(){for(;null!==Y;)Uk(Y);}function Lk(){for(;null!==Y&&!cc();)Uk(Y);}function Uk(a){var b=Vk(a.alternate,a,fj);a.memoizedProps=a.pendingProps;null===b?Sk(a):Y=b;nk.current=null;}
function Sk(a){var b=a;do{var c=b.alternate;a=b.return;if(0===(b.flags&32768)){if(c=Ej(c,b,fj),null!==c){Y=c;return}}else {c=Ij(c,b);if(null!==c){c.flags&=32767;Y=c;return}if(null!==a)a.flags|=32768,a.subtreeFlags=0,a.deletions=null;else {T=6;Y=null;return}}b=b.sibling;if(null!==b){Y=b;return}Y=b=a;}while(null!==b);0===T&&(T=5);}function Pk(a,b,c){var d=C,e=ok.transition;try{ok.transition=null,C=1,Wk(a,b,c,d);}finally{ok.transition=e,C=d;}return null}
function Wk(a,b,c,d){do Hk();while(null!==wk);if(0!==(K&6))throw Error(p(327));c=a.finishedWork;var e=a.finishedLanes;if(null===c)return null;a.finishedWork=null;a.finishedLanes=0;if(c===a.current)throw Error(p(177));a.callbackNode=null;a.callbackPriority=0;var f=c.lanes|c.childLanes;Bc(a,f);a===Q&&(Y=Q=null,Z=0);0===(c.subtreeFlags&2064)&&0===(c.flags&2064)||vk||(vk=true,Fk(hc,function(){Hk();return null}));f=0!==(c.flags&15990);if(0!==(c.subtreeFlags&15990)||f){f=ok.transition;ok.transition=null;
var g=C;C=1;var h=K;K|=4;nk.current=null;Oj(a,c);dk(c,a);Oe(Df);dd=!!Cf;Df=Cf=null;a.current=c;hk(c);dc();K=h;C=g;ok.transition=f;}else a.current=c;vk&&(vk=false,wk=a,xk=e);f=a.pendingLanes;0===f&&(Ri=null);mc(c.stateNode);Dk(a,B());if(null!==b)for(d=a.onRecoverableError,c=0;c<b.length;c++)e=b[c],d(e.value,{componentStack:e.stack,digest:e.digest});if(Oi)throw Oi=false,a=Pi,Pi=null,a;0!==(xk&1)&&0!==a.tag&&Hk();f=a.pendingLanes;0!==(f&1)?a===zk?yk++:(yk=0,zk=a):yk=0;jg();return null}
function Hk(){if(null!==wk){var a=Dc(xk),b=ok.transition,c=C;try{ok.transition=null;C=16>a?16:a;if(null===wk)var d=!1;else {a=wk;wk=null;xk=0;if(0!==(K&6))throw Error(p(331));var e=K;K|=4;for(V=a.current;null!==V;){var f=V,g=f.child;if(0!==(V.flags&16)){var h=f.deletions;if(null!==h){for(var k=0;k<h.length;k++){var l=h[k];for(V=l;null!==V;){var m=V;switch(m.tag){case 0:case 11:case 15:Pj(8,m,f);}var q=m.child;if(null!==q)q.return=m,V=q;else for(;null!==V;){m=V;var r=m.sibling,y=m.return;Sj(m);if(m===
l){V=null;break}if(null!==r){r.return=y;V=r;break}V=y;}}}var n=f.alternate;if(null!==n){var t=n.child;if(null!==t){n.child=null;do{var J=t.sibling;t.sibling=null;t=J;}while(null!==t)}}V=f;}}if(0!==(f.subtreeFlags&2064)&&null!==g)g.return=f,V=g;else b:for(;null!==V;){f=V;if(0!==(f.flags&2048))switch(f.tag){case 0:case 11:case 15:Pj(9,f,f.return);}var x=f.sibling;if(null!==x){x.return=f.return;V=x;break b}V=f.return;}}var w=a.current;for(V=w;null!==V;){g=V;var u=g.child;if(0!==(g.subtreeFlags&2064)&&null!==
u)u.return=g,V=u;else b:for(g=w;null!==V;){h=V;if(0!==(h.flags&2048))try{switch(h.tag){case 0:case 11:case 15:Qj(9,h);}}catch(na){W(h,h.return,na);}if(h===g){V=null;break b}var F=h.sibling;if(null!==F){F.return=h.return;V=F;break b}V=h.return;}}K=e;jg();if(lc&&"function"===typeof lc.onPostCommitFiberRoot)try{lc.onPostCommitFiberRoot(kc,a);}catch(na){}d=!0;}return d}finally{C=c,ok.transition=b;}}return  false}function Xk(a,b,c){b=Ji(c,b);b=Ni(a,b,1);a=nh(a,b,1);b=R();null!==a&&(Ac(a,1,b),Dk(a,b));}
function W(a,b,c){if(3===a.tag)Xk(a,a,c);else for(;null!==b;){if(3===b.tag){Xk(b,a,c);break}else if(1===b.tag){var d=b.stateNode;if("function"===typeof b.type.getDerivedStateFromError||"function"===typeof d.componentDidCatch&&(null===Ri||!Ri.has(d))){a=Ji(c,a);a=Qi(b,a,1);b=nh(b,a,1);a=R();null!==b&&(Ac(b,1,a),Dk(b,a));break}}b=b.return;}}
function Ti(a,b,c){var d=a.pingCache;null!==d&&d.delete(b);b=R();a.pingedLanes|=a.suspendedLanes&c;Q===a&&(Z&c)===c&&(4===T||3===T&&(Z&130023424)===Z&&500>B()-fk?Kk(a,0):rk|=c);Dk(a,b);}function Yk(a,b){0===b&&(0===(a.mode&1)?b=1:(b=sc,sc<<=1,0===(sc&130023424)&&(sc=4194304)));var c=R();a=ih(a,b);null!==a&&(Ac(a,b,c),Dk(a,c));}function uj(a){var b=a.memoizedState,c=0;null!==b&&(c=b.retryLane);Yk(a,c);}
function bk(a,b){var c=0;switch(a.tag){case 13:var d=a.stateNode;var e=a.memoizedState;null!==e&&(c=e.retryLane);break;case 19:d=a.stateNode;break;default:throw Error(p(314));}null!==d&&d.delete(b);Yk(a,c);}var Vk;
Vk=function(a,b,c){if(null!==a)if(a.memoizedProps!==b.pendingProps||Wf.current)dh=true;else {if(0===(a.lanes&c)&&0===(b.flags&128))return dh=false,yj(a,b,c);dh=0!==(a.flags&131072)?true:false;}else dh=false,I&&0!==(b.flags&1048576)&&ug(b,ng,b.index);b.lanes=0;switch(b.tag){case 2:var d=b.type;ij(a,b);a=b.pendingProps;var e=Yf(b,H.current);ch(b,c);e=Nh(null,b,d,a,e,c);var f=Sh();b.flags|=1;"object"===typeof e&&null!==e&&"function"===typeof e.render&&void 0===e.$$typeof?(b.tag=1,b.memoizedState=null,b.updateQueue=
null,Zf(d)?(f=true,cg(b)):f=false,b.memoizedState=null!==e.state&&void 0!==e.state?e.state:null,kh(b),e.updater=Ei,b.stateNode=e,e._reactInternals=b,Ii(b,d,a,c),b=jj(null,b,d,true,f,c)):(b.tag=0,I&&f&&vg(b),Xi(null,b,e,c),b=b.child);return b;case 16:d=b.elementType;a:{ij(a,b);a=b.pendingProps;e=d._init;d=e(d._payload);b.type=d;e=b.tag=Zk(d);a=Ci(d,a);switch(e){case 0:b=cj(null,b,d,a,c);break a;case 1:b=hj(null,b,d,a,c);break a;case 11:b=Yi(null,b,d,a,c);break a;case 14:b=$i(null,b,d,Ci(d.type,a),c);break a}throw Error(p(306,
d,""));}return b;case 0:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Ci(d,e),cj(a,b,d,e,c);case 1:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Ci(d,e),hj(a,b,d,e,c);case 3:a:{kj(b);if(null===a)throw Error(p(387));d=b.pendingProps;f=b.memoizedState;e=f.element;lh(a,b);qh(b,d,null,c);var g=b.memoizedState;d=g.element;if(f.isDehydrated)if(f={element:d,isDehydrated:false,cache:g.cache,pendingSuspenseBoundaries:g.pendingSuspenseBoundaries,transitions:g.transitions},b.updateQueue.baseState=
f,b.memoizedState=f,b.flags&256){e=Ji(Error(p(423)),b);b=lj(a,b,d,c,e);break a}else if(d!==e){e=Ji(Error(p(424)),b);b=lj(a,b,d,c,e);break a}else for(yg=Lf(b.stateNode.containerInfo.firstChild),xg=b,I=true,zg=null,c=Vg(b,null,d,c),b.child=c;c;)c.flags=c.flags&-3|4096,c=c.sibling;else {Ig();if(d===e){b=Zi(a,b,c);break a}Xi(a,b,d,c);}b=b.child;}return b;case 5:return Ah(b),null===a&&Eg(b),d=b.type,e=b.pendingProps,f=null!==a?a.memoizedProps:null,g=e.children,Ef(d,e)?g=null:null!==f&&Ef(d,f)&&(b.flags|=32),
gj(a,b),Xi(a,b,g,c),b.child;case 6:return null===a&&Eg(b),null;case 13:return oj(a,b,c);case 4:return yh(b,b.stateNode.containerInfo),d=b.pendingProps,null===a?b.child=Ug(b,null,d,c):Xi(a,b,d,c),b.child;case 11:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Ci(d,e),Yi(a,b,d,e,c);case 7:return Xi(a,b,b.pendingProps,c),b.child;case 8:return Xi(a,b,b.pendingProps.children,c),b.child;case 12:return Xi(a,b,b.pendingProps.children,c),b.child;case 10:a:{d=b.type._context;e=b.pendingProps;f=b.memoizedProps;
g=e.value;G(Wg,d._currentValue);d._currentValue=g;if(null!==f)if(He(f.value,g)){if(f.children===e.children&&!Wf.current){b=Zi(a,b,c);break a}}else for(f=b.child,null!==f&&(f.return=b);null!==f;){var h=f.dependencies;if(null!==h){g=f.child;for(var k=h.firstContext;null!==k;){if(k.context===d){if(1===f.tag){k=mh(-1,c&-c);k.tag=2;var l=f.updateQueue;if(null!==l){l=l.shared;var m=l.pending;null===m?k.next=k:(k.next=m.next,m.next=k);l.pending=k;}}f.lanes|=c;k=f.alternate;null!==k&&(k.lanes|=c);bh(f.return,
c,b);h.lanes|=c;break}k=k.next;}}else if(10===f.tag)g=f.type===b.type?null:f.child;else if(18===f.tag){g=f.return;if(null===g)throw Error(p(341));g.lanes|=c;h=g.alternate;null!==h&&(h.lanes|=c);bh(g,c,b);g=f.sibling;}else g=f.child;if(null!==g)g.return=f;else for(g=f;null!==g;){if(g===b){g=null;break}f=g.sibling;if(null!==f){f.return=g.return;g=f;break}g=g.return;}f=g;}Xi(a,b,e.children,c);b=b.child;}return b;case 9:return e=b.type,d=b.pendingProps.children,ch(b,c),e=eh(e),d=d(e),b.flags|=1,Xi(a,b,d,c),
b.child;case 14:return d=b.type,e=Ci(d,b.pendingProps),e=Ci(d.type,e),$i(a,b,d,e,c);case 15:return bj(a,b,b.type,b.pendingProps,c);case 17:return d=b.type,e=b.pendingProps,e=b.elementType===d?e:Ci(d,e),ij(a,b),b.tag=1,Zf(d)?(a=true,cg(b)):a=false,ch(b,c),Gi(b,d,e),Ii(b,d,e,c),jj(null,b,d,true,a,c);case 19:return xj(a,b,c);case 22:return dj(a,b,c)}throw Error(p(156,b.tag));};function Fk(a,b){return ac(a,b)}
function $k(a,b,c,d){this.tag=a;this.key=c;this.sibling=this.child=this.return=this.stateNode=this.type=this.elementType=null;this.index=0;this.ref=null;this.pendingProps=b;this.dependencies=this.memoizedState=this.updateQueue=this.memoizedProps=null;this.mode=d;this.subtreeFlags=this.flags=0;this.deletions=null;this.childLanes=this.lanes=0;this.alternate=null;}function Bg(a,b,c,d){return new $k(a,b,c,d)}function aj(a){a=a.prototype;return !(!a||!a.isReactComponent)}
function Zk(a){if("function"===typeof a)return aj(a)?1:0;if(void 0!==a&&null!==a){a=a.$$typeof;if(a===Da)return 11;if(a===Ga)return 14}return 2}
function Pg(a,b){var c=a.alternate;null===c?(c=Bg(a.tag,b,a.key,a.mode),c.elementType=a.elementType,c.type=a.type,c.stateNode=a.stateNode,c.alternate=a,a.alternate=c):(c.pendingProps=b,c.type=a.type,c.flags=0,c.subtreeFlags=0,c.deletions=null);c.flags=a.flags&14680064;c.childLanes=a.childLanes;c.lanes=a.lanes;c.child=a.child;c.memoizedProps=a.memoizedProps;c.memoizedState=a.memoizedState;c.updateQueue=a.updateQueue;b=a.dependencies;c.dependencies=null===b?null:{lanes:b.lanes,firstContext:b.firstContext};
c.sibling=a.sibling;c.index=a.index;c.ref=a.ref;return c}
function Rg(a,b,c,d,e,f){var g=2;d=a;if("function"===typeof a)aj(a)&&(g=1);else if("string"===typeof a)g=5;else a:switch(a){case ya:return Tg(c.children,e,f,b);case za:g=8;e|=8;break;case Aa:return a=Bg(12,c,b,e|2),a.elementType=Aa,a.lanes=f,a;case Ea:return a=Bg(13,c,b,e),a.elementType=Ea,a.lanes=f,a;case Fa:return a=Bg(19,c,b,e),a.elementType=Fa,a.lanes=f,a;case Ia:return pj(c,e,f,b);default:if("object"===typeof a&&null!==a)switch(a.$$typeof){case Ba:g=10;break a;case Ca:g=9;break a;case Da:g=11;
break a;case Ga:g=14;break a;case Ha:g=16;d=null;break a}throw Error(p(130,null==a?a:typeof a,""));}b=Bg(g,c,b,e);b.elementType=a;b.type=d;b.lanes=f;return b}function Tg(a,b,c,d){a=Bg(7,a,d,b);a.lanes=c;return a}function pj(a,b,c,d){a=Bg(22,a,d,b);a.elementType=Ia;a.lanes=c;a.stateNode={isHidden:false};return a}function Qg(a,b,c){a=Bg(6,a,null,b);a.lanes=c;return a}
function Sg(a,b,c){b=Bg(4,null!==a.children?a.children:[],a.key,b);b.lanes=c;b.stateNode={containerInfo:a.containerInfo,pendingChildren:null,implementation:a.implementation};return b}
function al(a,b,c,d,e){this.tag=b;this.containerInfo=a;this.finishedWork=this.pingCache=this.current=this.pendingChildren=null;this.timeoutHandle=-1;this.callbackNode=this.pendingContext=this.context=null;this.callbackPriority=0;this.eventTimes=zc(0);this.expirationTimes=zc(-1);this.entangledLanes=this.finishedLanes=this.mutableReadLanes=this.expiredLanes=this.pingedLanes=this.suspendedLanes=this.pendingLanes=0;this.entanglements=zc(0);this.identifierPrefix=d;this.onRecoverableError=e;this.mutableSourceEagerHydrationData=
null;}function bl(a,b,c,d,e,f,g,h,k){a=new al(a,b,c,h,k);1===b?(b=1,true===f&&(b|=8)):b=0;f=Bg(3,null,null,b);a.current=f;f.stateNode=a;f.memoizedState={element:d,isDehydrated:c,cache:null,transitions:null,pendingSuspenseBoundaries:null};kh(f);return a}function cl(a,b,c){var d=3<arguments.length&&void 0!==arguments[3]?arguments[3]:null;return {$$typeof:wa,key:null==d?null:""+d,children:a,containerInfo:b,implementation:c}}
function dl(a){if(!a)return Vf;a=a._reactInternals;a:{if(Vb(a)!==a||1!==a.tag)throw Error(p(170));var b=a;do{switch(b.tag){case 3:b=b.stateNode.context;break a;case 1:if(Zf(b.type)){b=b.stateNode.__reactInternalMemoizedMergedChildContext;break a}}b=b.return;}while(null!==b);throw Error(p(171));}if(1===a.tag){var c=a.type;if(Zf(c))return bg(a,c,b)}return b}
function el(a,b,c,d,e,f,g,h,k){a=bl(c,d,true,a,e,f,g,h,k);a.context=dl(null);c=a.current;d=R();e=yi(c);f=mh(d,e);f.callback=void 0!==b&&null!==b?b:null;nh(c,f,e);a.current.lanes=e;Ac(a,e,d);Dk(a,d);return a}function fl(a,b,c,d){var e=b.current,f=R(),g=yi(e);c=dl(c);null===b.context?b.context=c:b.pendingContext=c;b=mh(f,g);b.payload={element:a};d=void 0===d?null:d;null!==d&&(b.callback=d);a=nh(e,b,g);null!==a&&(gi(a,e,g,f),oh(a,e,g));return g}
function gl(a){a=a.current;if(!a.child)return null;switch(a.child.tag){case 5:return a.child.stateNode;default:return a.child.stateNode}}function hl(a,b){a=a.memoizedState;if(null!==a&&null!==a.dehydrated){var c=a.retryLane;a.retryLane=0!==c&&c<b?c:b;}}function il(a,b){hl(a,b);(a=a.alternate)&&hl(a,b);}function jl(){return null}var kl="function"===typeof reportError?reportError:function(a){console.error(a);};function ll(a){this._internalRoot=a;}
ml.prototype.render=ll.prototype.render=function(a){var b=this._internalRoot;if(null===b)throw Error(p(409));fl(a,b,null,null);};ml.prototype.unmount=ll.prototype.unmount=function(){var a=this._internalRoot;if(null!==a){this._internalRoot=null;var b=a.containerInfo;Rk(function(){fl(null,a,null,null);});b[uf]=null;}};function ml(a){this._internalRoot=a;}
ml.prototype.unstable_scheduleHydration=function(a){if(a){var b=Hc();a={blockedOn:null,target:a,priority:b};for(var c=0;c<Qc.length&&0!==b&&b<Qc[c].priority;c++);Qc.splice(c,0,a);0===c&&Vc(a);}};function nl(a){return !(!a||1!==a.nodeType&&9!==a.nodeType&&11!==a.nodeType)}function ol(a){return !(!a||1!==a.nodeType&&9!==a.nodeType&&11!==a.nodeType&&(8!==a.nodeType||" react-mount-point-unstable "!==a.nodeValue))}function pl(){}
function ql(a,b,c,d,e){if(e){if("function"===typeof d){var f=d;d=function(){var a=gl(g);f.call(a);};}var g=el(b,d,a,0,null,false,false,"",pl);a._reactRootContainer=g;a[uf]=g.current;sf(8===a.nodeType?a.parentNode:a);Rk();return g}for(;e=a.lastChild;)a.removeChild(e);if("function"===typeof d){var h=d;d=function(){var a=gl(k);h.call(a);};}var k=bl(a,0,false,null,null,false,false,"",pl);a._reactRootContainer=k;a[uf]=k.current;sf(8===a.nodeType?a.parentNode:a);Rk(function(){fl(b,k,c,d);});return k}
function rl(a,b,c,d,e){var f=c._reactRootContainer;if(f){var g=f;if("function"===typeof e){var h=e;e=function(){var a=gl(g);h.call(a);};}fl(b,g,a,e);}else g=ql(c,b,a,e,d);return gl(g)}Ec=function(a){switch(a.tag){case 3:var b=a.stateNode;if(b.current.memoizedState.isDehydrated){var c=tc(b.pendingLanes);0!==c&&(Cc(b,c|1),Dk(b,B()),0===(K&6)&&(Gj=B()+500,jg()));}break;case 13:Rk(function(){var b=ih(a,1);if(null!==b){var c=R();gi(b,a,1,c);}}),il(a,1);}};
Fc=function(a){if(13===a.tag){var b=ih(a,134217728);if(null!==b){var c=R();gi(b,a,134217728,c);}il(a,134217728);}};Gc=function(a){if(13===a.tag){var b=yi(a),c=ih(a,b);if(null!==c){var d=R();gi(c,a,b,d);}il(a,b);}};Hc=function(){return C};Ic=function(a,b){var c=C;try{return C=a,b()}finally{C=c;}};
yb=function(a,b,c){switch(b){case "input":bb(a,c);b=c.name;if("radio"===c.type&&null!=b){for(c=a;c.parentNode;)c=c.parentNode;c=c.querySelectorAll("input[name="+JSON.stringify(""+b)+'][type="radio"]');for(b=0;b<c.length;b++){var d=c[b];if(d!==a&&d.form===a.form){var e=Db(d);if(!e)throw Error(p(90));Wa(d);bb(d,e);}}}break;case "textarea":ib(a,c);break;case "select":b=c.value,null!=b&&fb(a,!!c.multiple,b,false);}};Gb=Qk;Hb=Rk;
var sl={usingClientEntryPoint:false,Events:[Cb,ue,Db,Eb,Fb,Qk]},tl={findFiberByHostInstance:Wc,bundleType:0,version:"18.3.1",rendererPackageName:"react-dom"};
var ul={bundleType:tl.bundleType,version:tl.version,rendererPackageName:tl.rendererPackageName,rendererConfig:tl.rendererConfig,overrideHookState:null,overrideHookStateDeletePath:null,overrideHookStateRenamePath:null,overrideProps:null,overridePropsDeletePath:null,overridePropsRenamePath:null,setErrorHandler:null,setSuspenseHandler:null,scheduleUpdate:null,currentDispatcherRef:ua.ReactCurrentDispatcher,findHostInstanceByFiber:function(a){a=Zb(a);return null===a?null:a.stateNode},findFiberByHostInstance:tl.findFiberByHostInstance||
jl,findHostInstancesForRefresh:null,scheduleRefresh:null,scheduleRoot:null,setRefreshHandler:null,getCurrentFiber:null,reconcilerVersion:"18.3.1-next-f1338f8080-20240426"};if("undefined"!==typeof __REACT_DEVTOOLS_GLOBAL_HOOK__){var vl=__REACT_DEVTOOLS_GLOBAL_HOOK__;if(!vl.isDisabled&&vl.supportsFiber)try{kc=vl.inject(ul),lc=vl;}catch(a){}}reactDom_production_min.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=sl;
reactDom_production_min.createPortal=function(a,b){var c=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null;if(!nl(b))throw Error(p(200));return cl(a,b,null,c)};reactDom_production_min.createRoot=function(a,b){if(!nl(a))throw Error(p(299));var c=false,d="",e=kl;null!==b&&void 0!==b&&(true===b.unstable_strictMode&&(c=true),void 0!==b.identifierPrefix&&(d=b.identifierPrefix),void 0!==b.onRecoverableError&&(e=b.onRecoverableError));b=bl(a,1,false,null,null,c,false,d,e);a[uf]=b.current;sf(8===a.nodeType?a.parentNode:a);return new ll(b)};
reactDom_production_min.findDOMNode=function(a){if(null==a)return null;if(1===a.nodeType)return a;var b=a._reactInternals;if(void 0===b){if("function"===typeof a.render)throw Error(p(188));a=Object.keys(a).join(",");throw Error(p(268,a));}a=Zb(b);a=null===a?null:a.stateNode;return a};reactDom_production_min.flushSync=function(a){return Rk(a)};reactDom_production_min.hydrate=function(a,b,c){if(!ol(b))throw Error(p(200));return rl(null,a,b,true,c)};
reactDom_production_min.hydrateRoot=function(a,b,c){if(!nl(a))throw Error(p(405));var d=null!=c&&c.hydratedSources||null,e=false,f="",g=kl;null!==c&&void 0!==c&&(true===c.unstable_strictMode&&(e=true),void 0!==c.identifierPrefix&&(f=c.identifierPrefix),void 0!==c.onRecoverableError&&(g=c.onRecoverableError));b=el(b,null,a,1,null!=c?c:null,e,false,f,g);a[uf]=b.current;sf(a);if(d)for(a=0;a<d.length;a++)c=d[a],e=c._getVersion,e=e(c._source),null==b.mutableSourceEagerHydrationData?b.mutableSourceEagerHydrationData=[c,e]:b.mutableSourceEagerHydrationData.push(c,
e);return new ml(b)};reactDom_production_min.render=function(a,b,c){if(!ol(b))throw Error(p(200));return rl(null,a,b,false,c)};reactDom_production_min.unmountComponentAtNode=function(a){if(!ol(a))throw Error(p(40));return a._reactRootContainer?(Rk(function(){rl(null,null,a,!1,function(){a._reactRootContainer=null;a[uf]=null;});}),true):false};reactDom_production_min.unstable_batchedUpdates=Qk;
reactDom_production_min.unstable_renderSubtreeIntoContainer=function(a,b,c,d){if(!ol(c))throw Error(p(200));if(null==a||void 0===a._reactInternals)throw Error(p(38));return rl(a,b,c,false,d)};reactDom_production_min.version="18.3.1-next-f1338f8080-20240426";

function checkDCE() {
  if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ === "undefined" || typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE !== "function") {
    return;
  }
  try {
    __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(checkDCE);
  } catch (err) {
    console.error(err);
  }
}
{
  checkDCE();
  reactDom.exports = reactDom_production_min;
}

var reactDomExports = reactDom.exports;

var createRoot;
var m = reactDomExports;
{
  createRoot = m.createRoot;
  m.hydrateRoot;
}

const __vite_import_meta_env__$2 = {};
const createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const destroy = () => {
    if ((__vite_import_meta_env__$2 ? "production" : void 0) !== "production") {
      console.warn(
        "[DEPRECATED] The `destroy` method will be unsupported in a future version. Instead use unsubscribe function returned by subscribe. Everything will be garbage-collected if store is garbage-collected."
      );
    }
    listeners.clear();
  };
  const api = { setState, getState, getInitialState, subscribe, destroy };
  const initialState = state = createState(setState, getState, api);
  return api;
};
const createStore = (createState) => createState ? createStoreImpl(createState) : createStoreImpl;

var withSelector = {exports: {}};

var withSelector_production = {};

var shim$2 = {exports: {}};

var useSyncExternalStoreShim_production = {};

/**
 * @license React
 * use-sync-external-store-shim.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var React$1 = reactExports;
function is$1(x, y) {
  return (x === y && (0 !== x || 1 / x === 1 / y)) || (x !== x && y !== y);
}
var objectIs$1 = "function" === typeof Object.is ? Object.is : is$1,
  useState = React$1.useState,
  useEffect$1 = React$1.useEffect,
  useLayoutEffect = React$1.useLayoutEffect,
  useDebugValue$2 = React$1.useDebugValue;
function useSyncExternalStore$2(subscribe, getSnapshot) {
  var value = getSnapshot(),
    _useState = useState({ inst: { value: value, getSnapshot: getSnapshot } }),
    inst = _useState[0].inst,
    forceUpdate = _useState[1];
  useLayoutEffect(
    function () {
      inst.value = value;
      inst.getSnapshot = getSnapshot;
      checkIfSnapshotChanged(inst) && forceUpdate({ inst: inst });
    },
    [subscribe, value, getSnapshot]
  );
  useEffect$1(
    function () {
      checkIfSnapshotChanged(inst) && forceUpdate({ inst: inst });
      return subscribe(function () {
        checkIfSnapshotChanged(inst) && forceUpdate({ inst: inst });
      });
    },
    [subscribe]
  );
  useDebugValue$2(value);
  return value;
}
function checkIfSnapshotChanged(inst) {
  var latestGetSnapshot = inst.getSnapshot;
  inst = inst.value;
  try {
    var nextValue = latestGetSnapshot();
    return !objectIs$1(inst, nextValue);
  } catch (error) {
    return true;
  }
}
function useSyncExternalStore$1(subscribe, getSnapshot) {
  return getSnapshot();
}
var shim$1 =
  "undefined" === typeof window ||
  "undefined" === typeof window.document ||
  "undefined" === typeof window.document.createElement
    ? useSyncExternalStore$1
    : useSyncExternalStore$2;
useSyncExternalStoreShim_production.useSyncExternalStore =
  void 0 !== React$1.useSyncExternalStore ? React$1.useSyncExternalStore : shim$1;

{
  shim$2.exports = useSyncExternalStoreShim_production;
}

var shimExports = shim$2.exports;

/**
 * @license React
 * use-sync-external-store-shim/with-selector.production.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var React = reactExports,
  shim = shimExports;
function is(x, y) {
  return (x === y && (0 !== x || 1 / x === 1 / y)) || (x !== x && y !== y);
}
var objectIs = "function" === typeof Object.is ? Object.is : is,
  useSyncExternalStore = shim.useSyncExternalStore,
  useRef = React.useRef,
  useEffect = React.useEffect,
  useMemo = React.useMemo,
  useDebugValue$1 = React.useDebugValue;
withSelector_production.useSyncExternalStoreWithSelector = function (
  subscribe,
  getSnapshot,
  getServerSnapshot,
  selector,
  isEqual
) {
  var instRef = useRef(null);
  if (null === instRef.current) {
    var inst = { hasValue: false, value: null };
    instRef.current = inst;
  } else inst = instRef.current;
  instRef = useMemo(
    function () {
      function memoizedSelector(nextSnapshot) {
        if (!hasMemo) {
          hasMemo = true;
          memoizedSnapshot = nextSnapshot;
          nextSnapshot = selector(nextSnapshot);
          if (void 0 !== isEqual && inst.hasValue) {
            var currentSelection = inst.value;
            if (isEqual(currentSelection, nextSnapshot))
              return (memoizedSelection = currentSelection);
          }
          return (memoizedSelection = nextSnapshot);
        }
        currentSelection = memoizedSelection;
        if (objectIs(memoizedSnapshot, nextSnapshot)) return currentSelection;
        var nextSelection = selector(nextSnapshot);
        if (void 0 !== isEqual && isEqual(currentSelection, nextSelection))
          return (memoizedSnapshot = nextSnapshot), currentSelection;
        memoizedSnapshot = nextSnapshot;
        return (memoizedSelection = nextSelection);
      }
      var hasMemo = false,
        memoizedSnapshot,
        memoizedSelection,
        maybeGetServerSnapshot =
          void 0 === getServerSnapshot ? null : getServerSnapshot;
      return [
        function () {
          return memoizedSelector(getSnapshot());
        },
        null === maybeGetServerSnapshot
          ? void 0
          : function () {
              return memoizedSelector(maybeGetServerSnapshot());
            }
      ];
    },
    [getSnapshot, getServerSnapshot, selector, isEqual]
  );
  var value = useSyncExternalStore(subscribe, instRef[0], instRef[1]);
  useEffect(
    function () {
      inst.hasValue = true;
      inst.value = value;
    },
    [value]
  );
  useDebugValue$1(value);
  return value;
};

{
  withSelector.exports = withSelector_production;
}

var withSelectorExports = withSelector.exports;
const useSyncExternalStoreExports = /*@__PURE__*/getDefaultExportFromCjs(withSelectorExports);

const __vite_import_meta_env__$1 = {};
const { useDebugValue } = React$2;
const { useSyncExternalStoreWithSelector } = useSyncExternalStoreExports;
let didWarnAboutEqualityFn = false;
const identity = (arg) => arg;
function useStore$1(api, selector = identity, equalityFn) {
  if ((__vite_import_meta_env__$1 ? "production" : void 0) !== "production" && equalityFn && !didWarnAboutEqualityFn) {
    console.warn(
      "[DEPRECATED] Use `createWithEqualityFn` instead of `create` or use `useStoreWithEqualityFn` instead of `useStore`. They can be imported from 'zustand/traditional'. https://github.com/pmndrs/zustand/discussions/1937"
    );
    didWarnAboutEqualityFn = true;
  }
  const slice = useSyncExternalStoreWithSelector(
    api.subscribe,
    api.getState,
    api.getServerState || api.getInitialState,
    selector,
    equalityFn
  );
  useDebugValue(slice);
  return slice;
}
const createImpl = (createState) => {
  if ((__vite_import_meta_env__$1 ? "production" : void 0) !== "production" && typeof createState !== "function") {
    console.warn(
      "[DEPRECATED] Passing a vanilla store will be unsupported in a future version. Instead use `import { useStore } from 'zustand'`."
    );
  }
  const api = typeof createState === "function" ? createStore(createState) : createState;
  const useBoundStore = (selector, equalityFn) => useStore$1(api, selector, equalityFn);
  Object.assign(useBoundStore, api);
  return useBoundStore;
};
const create = (createState) => createImpl;

const __vite_import_meta_env__ = {"BASE_URL": "./", "DEV": false, "MODE": "production", "PROD": true, "SSR": false};
const trackedConnections = /* @__PURE__ */ new Map();
const getTrackedConnectionState = (name) => {
  const api = trackedConnections.get(name);
  if (!api) return {};
  return Object.fromEntries(
    Object.entries(api.stores).map(([key, api2]) => [key, api2.getState()])
  );
};
const extractConnectionInformation = (store, extensionConnector, options) => {
  if (store === void 0) {
    return {
      type: "untracked",
      connection: extensionConnector.connect(options)
    };
  }
  const existingConnection = trackedConnections.get(options.name);
  if (existingConnection) {
    return { type: "tracked", store, ...existingConnection };
  }
  const newConnection = {
    connection: extensionConnector.connect(options),
    stores: {}
  };
  trackedConnections.set(options.name, newConnection);
  return { type: "tracked", store, ...newConnection };
};
const devtoolsImpl = (fn, devtoolsOptions = {}) => (set, get, api) => {
  const { enabled, anonymousActionType, store, ...options } = devtoolsOptions;
  let extensionConnector;
  try {
    extensionConnector = (enabled != null ? enabled : (__vite_import_meta_env__ ? "production" : void 0) !== "production") && window.__REDUX_DEVTOOLS_EXTENSION__;
  } catch (_e) {
  }
  if (!extensionConnector) {
    if ((__vite_import_meta_env__ ? "production" : void 0) !== "production" && enabled) {
      console.warn(
        "[zustand devtools middleware] Please install/enable Redux devtools extension"
      );
    }
    return fn(set, get, api);
  }
  const { connection, ...connectionInformation } = extractConnectionInformation(store, extensionConnector, options);
  let isRecording = true;
  api.setState = (state, replace, nameOrAction) => {
    const r = set(state, replace);
    if (!isRecording) return r;
    const action = nameOrAction === void 0 ? { type: anonymousActionType || "anonymous" } : typeof nameOrAction === "string" ? { type: nameOrAction } : nameOrAction;
    if (store === void 0) {
      connection == null ? void 0 : connection.send(action, get());
      return r;
    }
    connection == null ? void 0 : connection.send(
      {
        ...action,
        type: `${store}/${action.type}`
      },
      {
        ...getTrackedConnectionState(options.name),
        [store]: api.getState()
      }
    );
    return r;
  };
  const setStateFromDevtools = (...a) => {
    const originalIsRecording = isRecording;
    isRecording = false;
    set(...a);
    isRecording = originalIsRecording;
  };
  const initialState = fn(api.setState, get, api);
  if (connectionInformation.type === "untracked") {
    connection == null ? void 0 : connection.init(initialState);
  } else {
    connectionInformation.stores[connectionInformation.store] = api;
    connection == null ? void 0 : connection.init(
      Object.fromEntries(
        Object.entries(connectionInformation.stores).map(([key, store2]) => [
          key,
          key === connectionInformation.store ? initialState : store2.getState()
        ])
      )
    );
  }
  if (api.dispatchFromDevtools && typeof api.dispatch === "function") {
    let didWarnAboutReservedActionType = false;
    const originalDispatch = api.dispatch;
    api.dispatch = (...a) => {
      if ((__vite_import_meta_env__ ? "production" : void 0) !== "production" && a[0].type === "__setState" && !didWarnAboutReservedActionType) {
        console.warn(
          '[zustand devtools middleware] "__setState" action type is reserved to set state from the devtools. Avoid using it.'
        );
        didWarnAboutReservedActionType = true;
      }
      originalDispatch(...a);
    };
  }
  connection.subscribe((message) => {
    var _a;
    switch (message.type) {
      case "ACTION":
        if (typeof message.payload !== "string") {
          console.error(
            "[zustand devtools middleware] Unsupported action format"
          );
          return;
        }
        return parseJsonThen(
          message.payload,
          (action) => {
            if (action.type === "__setState") {
              if (store === void 0) {
                setStateFromDevtools(action.state);
                return;
              }
              if (Object.keys(action.state).length !== 1) {
                console.error(
                  `
                    [zustand devtools middleware] Unsupported __setState action format. 
                    When using 'store' option in devtools(), the 'state' should have only one key, which is a value of 'store' that was passed in devtools(),
                    and value of this only key should be a state object. Example: { "type": "__setState", "state": { "abc123Store": { "foo": "bar" } } }
                    `
                );
              }
              const stateFromDevtools = action.state[store];
              if (stateFromDevtools === void 0 || stateFromDevtools === null) {
                return;
              }
              if (JSON.stringify(api.getState()) !== JSON.stringify(stateFromDevtools)) {
                setStateFromDevtools(stateFromDevtools);
              }
              return;
            }
            if (!api.dispatchFromDevtools) return;
            if (typeof api.dispatch !== "function") return;
            api.dispatch(action);
          }
        );
      case "DISPATCH":
        switch (message.payload.type) {
          case "RESET":
            setStateFromDevtools(initialState);
            if (store === void 0) {
              return connection == null ? void 0 : connection.init(api.getState());
            }
            return connection == null ? void 0 : connection.init(getTrackedConnectionState(options.name));
          case "COMMIT":
            if (store === void 0) {
              connection == null ? void 0 : connection.init(api.getState());
              return;
            }
            return connection == null ? void 0 : connection.init(getTrackedConnectionState(options.name));
          case "ROLLBACK":
            return parseJsonThen(message.state, (state) => {
              if (store === void 0) {
                setStateFromDevtools(state);
                connection == null ? void 0 : connection.init(api.getState());
                return;
              }
              setStateFromDevtools(state[store]);
              connection == null ? void 0 : connection.init(getTrackedConnectionState(options.name));
            });
          case "JUMP_TO_STATE":
          case "JUMP_TO_ACTION":
            return parseJsonThen(message.state, (state) => {
              if (store === void 0) {
                setStateFromDevtools(state);
                return;
              }
              if (JSON.stringify(api.getState()) !== JSON.stringify(state[store])) {
                setStateFromDevtools(state[store]);
              }
            });
          case "IMPORT_STATE": {
            const { nextLiftedState } = message.payload;
            const lastComputedState = (_a = nextLiftedState.computedStates.slice(-1)[0]) == null ? void 0 : _a.state;
            if (!lastComputedState) return;
            if (store === void 0) {
              setStateFromDevtools(lastComputedState);
            } else {
              setStateFromDevtools(lastComputedState[store]);
            }
            connection == null ? void 0 : connection.send(
              null,
              // FIXME no-any
              nextLiftedState
            );
            return;
          }
          case "PAUSE_RECORDING":
            return isRecording = !isRecording;
        }
        return;
    }
  });
  return initialState;
};
const devtools = devtoolsImpl;
const parseJsonThen = (stringified, f) => {
  let parsed;
  try {
    parsed = JSON.parse(stringified);
  } catch (e) {
    console.error(
      "[zustand devtools middleware] Could not parse the received json",
      e
    );
  }
  if (parsed !== void 0) f(parsed);
};

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
const ALPHABET_LEN = ALPHABET.length;
function generateId(length = 21) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    let id2 = "";
    for (let i = 0; i < length; i++) {
      id2 += ALPHABET[bytes[i] & 63];
    }
    return id2;
  }
  let id = "";
  for (let i = 0; i < length; i++) {
    id += ALPHABET[Math.floor(Math.random() * ALPHABET_LEN)];
  }
  return id;
}
function generatePrefixedId(prefix, length = 12) {
  return `${prefix}_${generateId(length)}`;
}

const STEP_LABELS$1 = {
  0: "Select List",
  1: "Map Columns",
  2: "Pagination",
  3: "Run & Results"
};
const initialProgress = {
  items: 0,
  pages: 0,
  elapsed: 0,
  speed: 0,
  errors: 0,
  estimatedRemaining: 0
};
const createExtractionSlice = (set, get) => ({
  // -- State -----------------------------------------------------------------
  status: "idle",
  extractionStatus: "idle",
  currentConfig: null,
  extractedRows: [],
  progress: { ...initialProgress },
  extractionProgress: { ...initialProgress },
  detectedPatterns: [],
  selectedPatternId: null,
  activeStep: 0,
  isScanning: false,
  error: null,
  extractionSummary: null,
  currentStep: 0,
  completedSteps: /* @__PURE__ */ new Set(),
  // -- Actions ---------------------------------------------------------------
  setStatus: (status) => set({ status, extractionStatus: status }, false, "extraction/setStatus"),
  setExtractionStatus: (status) => set({ status, extractionStatus: status }, false, "extraction/setStatus"),
  setConfig: (config) => set({ currentConfig: config }, false, "extraction/setConfig"),
  addRow: (row) => set(
    (state) => ({ extractedRows: [...state.extractedRows, row] }),
    false,
    "extraction/addRow"
  ),
  addRows: (rows) => set(
    (state) => ({ extractedRows: [...state.extractedRows, ...rows] }),
    false,
    "extraction/addRows"
  ),
  addExtractedRows: (rows) => set(
    (state) => ({ extractedRows: [...state.extractedRows, ...rows] }),
    false,
    "extraction/addRows"
  ),
  clearExtractedRows: () => set({ extractedRows: [] }, false, "extraction/clearRows"),
  setProgress: (partial) => set(
    (state) => {
      const updated = { ...state.progress, ...partial };
      return { progress: updated, extractionProgress: updated };
    },
    false,
    "extraction/setProgress"
  ),
  updateExtractionProgress: (partial) => set(
    (state) => {
      const updated = { ...state.progress, ...partial };
      return { progress: updated, extractionProgress: updated };
    },
    false,
    "extraction/setProgress"
  ),
  reset: () => set(
    {
      status: "idle",
      extractionStatus: "idle",
      currentConfig: null,
      extractedRows: [],
      progress: { ...initialProgress },
      extractionProgress: { ...initialProgress },
      detectedPatterns: [],
      selectedPatternId: null,
      activeStep: 0,
      isScanning: false,
      error: null,
      extractionSummary: null,
      currentStep: 0,
      completedSteps: /* @__PURE__ */ new Set()
    },
    false,
    "extraction/reset"
  ),
  setPatterns: (patterns) => set({ detectedPatterns: patterns }, false, "extraction/setPatterns"),
  setDetectedPatterns: (patterns) => set({ detectedPatterns: patterns }, false, "extraction/setPatterns"),
  selectPattern: (patternId) => set({ selectedPatternId: patternId }, false, "extraction/selectPattern"),
  setStep: (step) => set({ activeStep: Math.max(0, Math.min(3, step)) }, false, "extraction/setStep"),
  pauseExtraction: () => set(
    (state) => ({
      status: state.status === "running" ? "paused" : state.status,
      extractionStatus: state.status === "running" ? "paused" : state.extractionStatus
    }),
    false,
    "extraction/pause"
  ),
  resumeExtraction: () => set(
    (state) => ({
      status: state.status === "paused" ? "running" : state.status,
      extractionStatus: state.status === "paused" ? "running" : state.extractionStatus
    }),
    false,
    "extraction/resume"
  ),
  setIsScanning: (scanning) => set({ isScanning: scanning }, false, "extraction/setIsScanning"),
  setError: (error) => set({ error }, false, "extraction/setError"),
  setExtractionSummary: (summary) => set({ extractionSummary: summary }, false, "extraction/setSummary"),
  buildExtractionConfig: () => {
    const state = get();
    const selectedPattern = state.detectedPatterns.find(
      (p) => p.id === state.selectedPatternId
    );
    if (state.currentConfig) {
      return state.currentConfig;
    }
    return {
      id: generatePrefixedId("exc"),
      patternSelector: selectedPattern?.selector ?? "",
      fields: selectedPattern?.fields ?? [],
      pagination: {
        mode: "auto-scroll",
        maxPages: state.settings.extraction.defaultMaxPages,
        delayMs: state.settings.extraction.defaultDelay,
        confidence: 0
      },
      maxItems: state.settings.extraction.defaultMaxItems,
      maxPages: state.settings.extraction.defaultMaxPages,
      delayBetweenPages: state.settings.extraction.defaultDelay
    };
  },
  resetListExtractor: () => set(
    {
      status: "idle",
      extractionStatus: "idle",
      currentConfig: null,
      extractedRows: [],
      progress: { ...initialProgress },
      extractionProgress: { ...initialProgress },
      detectedPatterns: [],
      selectedPatternId: null,
      activeStep: 0,
      isScanning: false,
      error: null,
      extractionSummary: null,
      currentStep: 0,
      completedSteps: /* @__PURE__ */ new Set()
    },
    false,
    "extraction/resetListExtractor"
  ),
  // -- Wizard step navigation -----------------------------------------------
  goToStep: (step) => set({ currentStep: step, activeStep: step }, false, "extraction/goToStep"),
  nextStep: () => set(
    (state) => {
      const next = Math.min(3, state.currentStep + 1);
      return { currentStep: next, activeStep: next };
    },
    false,
    "extraction/nextStep"
  ),
  prevStep: () => set(
    (state) => {
      const prev = Math.max(0, state.currentStep - 1);
      return { currentStep: prev, activeStep: prev };
    },
    false,
    "extraction/prevStep"
  ),
  markStepCompleted: (step) => set(
    (state) => {
      const next = new Set(state.completedSteps);
      next.add(step);
      return { completedSteps: next };
    },
    false,
    "extraction/markStepCompleted"
  )
});

function matchesFilter(row, filter) {
  const raw = row.data[filter.columnId];
  const value = raw != null ? String(raw) : "";
  const filterVal = filter.value;
  switch (filter.operator) {
    case "contains":
      return value.toLowerCase().includes(filterVal.toLowerCase());
    case "equals":
      return value.toLowerCase() === filterVal.toLowerCase();
    case "starts_with":
      return value.toLowerCase().startsWith(filterVal.toLowerCase());
    case "ends_with":
      return value.toLowerCase().endsWith(filterVal.toLowerCase());
    case "regex": {
      try {
        return new RegExp(filterVal, "i").test(value);
      } catch {
        return false;
      }
    }
    case "gt": {
      const numVal = parseFloat(value);
      const numFilter = parseFloat(filterVal);
      return !isNaN(numVal) && !isNaN(numFilter) && numVal > numFilter;
    }
    case "lt": {
      const numVal = parseFloat(value);
      const numFilter = parseFloat(filterVal);
      return !isNaN(numVal) && !isNaN(numFilter) && numVal < numFilter;
    }
    case "between": {
      const numVal = parseFloat(value);
      const lo = parseFloat(filterVal);
      const hi = parseFloat(filter.value2 ?? "");
      return !isNaN(numVal) && !isNaN(lo) && !isNaN(hi) && numVal >= lo && numVal <= hi;
    }
    case "empty":
      return value.trim() === "";
    case "not_empty":
      return value.trim() !== "";
    default:
      return true;
  }
}
function applyFilters(rows, filters) {
  if (filters.length === 0) return rows;
  return rows.filter((row) => filters.every((f) => matchesFilter(row, f)));
}
function applySearch(rows, query) {
  if (!query.trim()) return rows;
  const lower = query.toLowerCase();
  return rows.filter(
    (row) => Object.values(row.data).some(
      (val) => val != null && String(val).toLowerCase().includes(lower)
    )
  );
}
function applySorts(rows, sorts) {
  if (sorts.length === 0) return rows;
  return [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const aVal = a.data[sort.columnId];
      const bVal = b.data[sort.columnId];
      if (aVal == null && bVal == null) continue;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      let comparison = 0;
      const aNum = typeof aVal === "number" ? aVal : parseFloat(String(aVal));
      const bNum = typeof bVal === "number" ? bVal : parseFloat(String(bVal));
      if (!isNaN(aNum) && !isNaN(bNum)) {
        comparison = aNum - bNum;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }
      if (comparison !== 0) {
        return sort.direction === "desc" ? -comparison : comparison;
      }
    }
    return 0;
  });
}
const createTableSlice = (set, get) => ({
  // -- State -----------------------------------------------------------------
  tables: [],
  activeTableId: null,
  columns: [],
  rows: [],
  filters: [],
  sorts: [],
  searchQuery: "",
  selectedRowIds: /* @__PURE__ */ new Set(),
  // -- Actions ---------------------------------------------------------------
  setTables: (tables) => set({ tables }, false, "table/setTables"),
  setActiveTable: (tableId) => set(
    {
      activeTableId: tableId,
      filters: [],
      sorts: [],
      searchQuery: "",
      selectedRowIds: /* @__PURE__ */ new Set()
    },
    false,
    "table/setActiveTable"
  ),
  setColumns: (columns) => set({ columns }, false, "table/setColumns"),
  addColumn: (column) => set(
    (state) => ({ columns: [...state.columns, column] }),
    false,
    "table/addColumn"
  ),
  removeColumn: (columnId) => set(
    (state) => ({
      columns: state.columns.filter((c) => c.id !== columnId)
    }),
    false,
    "table/removeColumn"
  ),
  renameColumn: (columnId, newName) => set(
    (state) => ({
      columns: state.columns.map(
        (c) => c.id === columnId ? { ...c, name: newName } : c
      )
    }),
    false,
    "table/renameColumn"
  ),
  reorderColumns: (columnIds) => set(
    (state) => {
      const columnMap = new Map(state.columns.map((c) => [c.id, c]));
      const reordered = [];
      for (const id of columnIds) {
        const col = columnMap.get(id);
        if (col) reordered.push(col);
      }
      for (const col of state.columns) {
        if (!columnIds.includes(col.id)) {
          reordered.push(col);
        }
      }
      return { columns: reordered };
    },
    false,
    "table/reorderColumns"
  ),
  setRows: (rows) => set({ rows }, false, "table/setRows"),
  setFilters: (filters) => set({ filters }, false, "table/setFilters"),
  setSorts: (sorts) => set({ sorts }, false, "table/setSorts"),
  setSearch: (query) => set({ searchQuery: query }, false, "table/setSearch"),
  selectRows: (rowIds) => set({ selectedRowIds: new Set(rowIds) }, false, "table/selectRows"),
  getFilteredRows: () => {
    const { rows, filters, sorts, searchQuery } = get();
    let result = applyFilters(rows, filters);
    result = applySearch(result, searchQuery);
    result = applySorts(result, sorts);
    return result;
  }
});

const MAX_TOASTS = 5;
const DEFAULT_TOAST_DURATION = 5e3;
const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 600;
const createUISlice = (set) => ({
  // -- State -----------------------------------------------------------------
  activeTab: "tools",
  activeTool: null,
  sidebarWidth: 400,
  isLoading: false,
  toasts: [],
  modals: [],
  // -- Actions ---------------------------------------------------------------
  setTab: (tab) => set({ activeTab: tab }, false, "ui/setTab"),
  setTool: (tool) => set({ activeTool: tool }, false, "ui/setTool"),
  setActiveTool: (tool) => set({ activeTool: tool }, false, "ui/setTool"),
  setSidebarWidth: (width) => set(
    { sidebarWidth: Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width)) },
    false,
    "ui/setSidebarWidth"
  ),
  setLoading: (loading) => set({ isLoading: loading }, false, "ui/setLoading"),
  addToast: (toast) => {
    const id = toast.id ?? generateId(12);
    const newToast = {
      id,
      type: toast.type,
      title: toast.title,
      message: toast.message,
      duration: toast.duration ?? DEFAULT_TOAST_DURATION
    };
    set(
      (state) => {
        const existing = state.toasts.length >= MAX_TOASTS ? state.toasts.slice(1) : state.toasts;
        return { toasts: [...existing, newToast] };
      },
      false,
      "ui/addToast"
    );
    return id;
  },
  removeToast: (id) => set(
    (state) => ({
      toasts: state.toasts.filter((t) => t.id !== id)
    }),
    false,
    "ui/removeToast"
  ),
  openModal: (modal) => {
    const id = modal.id ?? generateId(12);
    const newModal = {
      id,
      type: modal.type,
      props: modal.props
    };
    set(
      (state) => ({
        modals: [...state.modals, newModal]
      }),
      false,
      "ui/openModal"
    );
    return id;
  },
  closeModal: (id) => set(
    (state) => ({
      modals: state.modals.filter((m) => m.id !== id)
    }),
    false,
    "ui/closeModal"
  ),
  closeAllModals: () => set({ modals: [] }, false, "ui/closeAllModals")
});

const createHistorySlice = (set, get) => ({
  // -- State -----------------------------------------------------------------
  history: [],
  historySearchQuery: "",
  // -- Actions ---------------------------------------------------------------
  addHistory: (item) => set(
    (state) => ({
      // Prepend new items so the list stays newest-first
      history: [item, ...state.history]
    }),
    false,
    "history/addHistory"
  ),
  removeHistory: (id) => set(
    (state) => ({
      history: state.history.filter((h) => h.id !== id)
    }),
    false,
    "history/removeHistory"
  ),
  clearHistory: () => set({ history: [] }, false, "history/clearHistory"),
  setHistorySearch: (query) => set({ historySearchQuery: query }, false, "history/setHistorySearch"),
  searchHistory: () => {
    const { history, historySearchQuery } = get();
    const query = historySearchQuery.trim().toLowerCase();
    if (!query) return history;
    return history.filter(
      (item) => item.name.toLowerCase().includes(query) || item.sourceUrl.toLowerCase().includes(query) || item.tool.toLowerCase().includes(query)
    );
  }
});

const createTemplateSlice = (set, get) => ({
  // -- State -----------------------------------------------------------------
  templates: [],
  // -- Actions ---------------------------------------------------------------
  addTemplate: (template) => set(
    (state) => ({
      templates: [...state.templates, template]
    }),
    false,
    "template/addTemplate"
  ),
  updateTemplate: (id, updates) => set(
    (state) => ({
      templates: state.templates.map(
        (t) => t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
      )
    }),
    false,
    "template/updateTemplate"
  ),
  removeTemplate: (id) => set(
    (state) => ({
      templates: state.templates.filter((t) => t.id !== id)
    }),
    false,
    "template/removeTemplate"
  ),
  setTemplates: (templates) => set({ templates }, false, "template/setTemplates"),
  applyTemplate: (id) => {
    const state = get();
    const template = state.templates.find((t) => t.id === id);
    if (!template) return null;
    const now = Date.now();
    set(
      {
        currentConfig: { ...template.config },
        status: "configuring",
        activeStep: 1
      },
      false,
      "template/applyTemplate"
    );
    set(
      (s) => ({
        templates: s.templates.map(
          (t) => t.id === id ? { ...t, lastUsed: now, useCount: t.useCount + 1 } : t
        )
      }),
      false,
      "template/applyTemplate:updateStats"
    );
    return template;
  }
});

const defaultSettings = {
  general: {
    theme: "dark",
    animationsEnabled: true,
    notificationsEnabled: true,
    autoSaveHistory: true
  },
  extraction: {
    defaultMaxItems: 1e3,
    defaultMaxPages: 50,
    defaultDelay: 1e3,
    respectRobotsTxt: true,
    autoCleanData: true,
    autoDeduplicate: true,
    concurrentTabs: 2
  },
  export: {
    defaultFormat: "csv",
    csvDelimiter: ",",
    csvEncoding: "utf-8",
    jsonFormat: "array",
    includeHeaders: true,
    includeTimestamp: true
  },
  advanced: {
    selectorStrategy: "auto",
    scrollSpeed: "medium",
    mutationWaitMs: 2e3,
    maxRetries: 3,
    debugMode: false
  }
};

function getLastError() {
  return chrome.runtime.lastError?.message ?? null;
}
function rejectOnError(resolve, reject) {
  return (result) => {
    const err = getLastError();
    if (err) {
      reject(new Error(`Chrome API error: ${err}`));
    } else {
      resolve(result);
    }
  };
}
function sendRuntimeMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, rejectOnError(resolve, reject));
  });
}
function onMessage(handler) {
  chrome.runtime.onMessage.addListener(handler);
  return () => chrome.runtime.onMessage.removeListener(handler);
}
function getActiveTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Chrome tabs query error: ${err}`));
      } else {
        resolve(tabs[0]);
      }
    });
  });
}
function sendTabMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, rejectOnError(resolve, reject));
  });
}
function storageLocalGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (items) => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Storage local get error: ${err}`));
      } else {
        resolve(items);
      }
    });
  });
}
function storageLocalSet(items) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Storage local set error: ${err}`));
      } else {
        resolve();
      }
    });
  });
}

function isQuotaExceededError(err) {
  if (err instanceof DOMException) {
    return err.name === "QuotaExceededError" || err.code === 22 || err.name === "NS_ERROR_DOM_QUOTA_REACHED";
  }
  return false;
}
function wrapStorageError(err, context) {
  if (isQuotaExceededError(err)) {
    return new Error(`Storage quota exceeded while ${context}. Free up space or delete old tables.`);
  }
  if (err instanceof Error) {
    return new Error(`${context}: ${err.message}`);
  }
  return new Error(`${context}: ${String(err)}`);
}
async function saveSetting(key, value) {
  try {
    await storageLocalSet({ [key]: value });
  } catch (err) {
    throw wrapStorageError(err, `saving setting "${key}"`);
  }
}
async function loadSetting(key, defaultValue) {
  try {
    const result = await storageLocalGet([key]);
    return key in result ? result[key] : defaultValue;
  } catch (err) {
    throw wrapStorageError(err, `loading setting "${key}"`);
  }
}

const STORAGE_KEY = "dataforge_settings";
const PERSIST_DEBOUNCE_MS = 500;
function deepMerge(target, source) {
  if (target === null || target === void 0 || typeof target !== "object" || Array.isArray(target)) {
    return source ?? target;
  }
  const result = { ...target };
  const src = source;
  for (const key of Object.keys(src)) {
    const sourceVal = src[key];
    const targetVal = result[key];
    if (sourceVal !== null && sourceVal !== void 0 && typeof sourceVal === "object" && !Array.isArray(sourceVal) && targetVal !== null && targetVal !== void 0 && typeof targetVal === "object" && !Array.isArray(targetVal)) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== void 0) {
      result[key] = sourceVal;
    }
  }
  return result;
}
let persistTimeout = null;
function schedulePersist(settings) {
  if (persistTimeout !== null) {
    clearTimeout(persistTimeout);
  }
  persistTimeout = setTimeout(() => {
    persistTimeout = null;
    saveSetting(STORAGE_KEY, settings).catch((err) => {
      console.error("[DataForge] Failed to persist settings:", err);
    });
  }, PERSIST_DEBOUNCE_MS);
}
const createSettingsSlice = (set, get) => ({
  // -- State -----------------------------------------------------------------
  settings: { ...defaultSettings },
  settingsLoaded: false,
  // -- Actions ---------------------------------------------------------------
  updateSettings: (partial) => {
    const current = get().settings;
    const merged = deepMerge(current, partial);
    set({ settings: merged }, false, "settings/updateSettings");
    schedulePersist(merged);
  },
  resetSettings: () => {
    const defaults = { ...defaultSettings };
    set(
      { settings: defaults },
      false,
      "settings/resetSettings"
    );
    schedulePersist(defaults);
  },
  loadSettings: async () => {
    try {
      const stored = await loadSetting(STORAGE_KEY, null);
      if (stored) {
        const merged = deepMerge(defaultSettings, stored);
        set({ settings: merged, settingsLoaded: true }, false, "settings/loadSettings");
      } else {
        set({ settingsLoaded: true }, false, "settings/loadSettings:defaults");
      }
    } catch (err) {
      console.error("[DataForge] Failed to load settings:", err);
      set({ settingsLoaded: true }, false, "settings/loadSettings:error");
    }
  }
});

function isDebugMode() {
  try {
    const meta = import.meta;
    const env = meta["env"];
    if (env?.["MODE"] === "development") {
      return true;
    }
  } catch {
  }
  return false;
}
const useStore = create()(
  devtools(
    (...a) => ({
      ...createExtractionSlice(...a),
      ...createTableSlice(...a),
      ...createUISlice(...a),
      ...createHistorySlice(...a),
      ...createTemplateSlice(...a),
      ...createSettingsSlice(...a)
    }),
    {
      name: "DataForge",
      enabled: isDebugMode()
    }
  )
);

function useSettings() {
  const store = useStore();
  const {
    settings,
    settingsLoaded,
    updateSettings: storeUpdateSettings,
    resetSettings: storeResetSettings,
    loadSettings: storeLoadSettings
  } = store;
  reactExports.useEffect(() => {
    if (!settingsLoaded) {
      storeLoadSettings();
    }
  }, [settingsLoaded, storeLoadSettings]);
  const updateSettings = reactExports.useCallback(
    (partial) => {
      storeUpdateSettings(partial);
    },
    [storeUpdateSettings]
  );
  const resetSettings = reactExports.useCallback(() => {
    storeResetSettings();
  }, [storeResetSettings]);
  const loadSettings = reactExports.useCallback(async () => {
    await storeLoadSettings();
  }, [storeLoadSettings]);
  return reactExports.useMemo(
    () => ({
      settings,
      isLoading: !settingsLoaded,
      updateSettings,
      resetSettings,
      loadSettings,
      animationsEnabled: settings.general.animationsEnabled,
      notificationsEnabled: settings.general.notificationsEnabled,
      defaultExportFormat: settings.export.defaultFormat,
      debugMode: settings.advanced.debugMode
    }),
    [settings, settingsLoaded, updateSettings, resetSettings, loadSettings]
  );
}

const TopBar = ({ onSettingsClick, onMinimizeClick }) => {
  const handleSettingsClick = reactExports.useCallback(() => {
    onSettingsClick?.();
  }, [onSettingsClick]);
  const handleMinimizeClick = reactExports.useCallback(() => {
    onMinimizeClick?.();
  }, [onMinimizeClick]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "header",
    {
      className: "flex items-center justify-between h-14 px-4 bg-forge-bg/90 backdrop-blur-md border-b border-forge-border shrink-0 select-none",
      role: "banner",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative flex items-center justify-center w-8 h-8", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "svg",
            {
              width: "28",
              height: "28",
              viewBox: "0 0 28 28",
              fill: "none",
              xmlns: "http://www.w3.org/2000/svg",
              "aria-hidden": "true",
              className: "drop-shadow-[0_0_6px_rgba(16,185,129,0.4)]",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    d: "M4 20h20v2c0 1.1-.9 2-2 2H6c-1.1 0-2-.9-2-2v-2z",
                    fill: "url(#anvil-gradient)"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    d: "M6 16h16c1.1 0 2 .9 2 2v2H4v-2c0-1.1.9-2 2-2z",
                    fill: "url(#anvil-gradient)",
                    fillOpacity: "0.85"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    d: "M8 16l-3-4h6l-3 4z",
                    fill: "url(#anvil-gradient)",
                    fillOpacity: "0.7"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    d: "M9 12h10c.55 0 1 .45 1 1v3H8v-3c0-.55.45-1 1-1z",
                    fill: "url(#anvil-gradient)",
                    fillOpacity: "0.95"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    d: "M12 4h4v3h-4V4z",
                    fill: "#14B8A6",
                    rx: "0.5"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "path",
                  {
                    d: "M13.5 7v5",
                    stroke: "#14B8A6",
                    strokeWidth: "1.5",
                    strokeLinecap: "round"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "rect",
                  {
                    x: "10",
                    y: "2",
                    width: "8",
                    height: "3",
                    rx: "1",
                    fill: "url(#hammer-gradient)"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "20", cy: "10", r: "1", fill: "#10B981", opacity: "0.8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "animate",
                  {
                    attributeName: "opacity",
                    values: "0.8;0.2;0.8",
                    dur: "2s",
                    repeatCount: "indefinite"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "22", cy: "8", r: "0.6", fill: "#14B8A6", opacity: "0.6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "animate",
                  {
                    attributeName: "opacity",
                    values: "0.6;0.1;0.6",
                    dur: "2.5s",
                    repeatCount: "indefinite"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("defs", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "anvil-gradient", x1: "4", y1: "12", x2: "24", y2: "24", gradientUnits: "userSpaceOnUse", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { stopColor: "#10B981" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "1", stopColor: "#14B8A6" })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "hammer-gradient", x1: "10", y1: "2", x2: "18", y2: "5", gradientUnits: "userSpaceOnUse", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { stopColor: "#14B8A6" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "1", stopColor: "#10B981" })
                  ] })
                ] })
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "span",
            {
              className: "text-lg font-bold tracking-wide text-forge-text",
              style: {
                textShadow: "0 0 12px rgba(16, 185, 129, 0.5), 0 0 4px rgba(16, 185, 129, 0.3)"
              },
              children: [
                "Data",
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-accent-primary", children: "Forge" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleSettingsClick,
              className: "flex items-center justify-center w-8 h-8 rounded-lg text-forge-text-secondary hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-all duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
              "aria-label": "Open settings",
              title: "Settings",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "svg",
                {
                  width: "18",
                  height: "18",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  "aria-hidden": "true",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "3" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" })
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleMinimizeClick,
              className: "flex items-center justify-center w-8 h-8 rounded-lg text-forge-text-secondary hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-all duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
              "aria-label": "Minimize panel",
              title: "Minimize",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "svg",
                {
                  width: "18",
                  height: "18",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  "aria-hidden": "true",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "6 9 12 15 18 9" })
                }
              )
            }
          )
        ] })
      ]
    }
  );
};

const TAB_DEFINITIONS = [
  { key: "tools", label: "TOOLS" },
  { key: "history", label: "HISTORY" },
  { key: "data", label: "DATA" }
];
const Navigation = ({ activeTab, onTabChange, badges }) => {
  const tabRefs = reactExports.useRef(/* @__PURE__ */ new Map());
  const containerRef = reactExports.useRef(null);
  const [indicatorStyle, setIndicatorStyle] = reactExports.useState({
    left: 0,
    width: 0
  });
  const updateIndicator = reactExports.useCallback(() => {
    const activeEl = tabRefs.current.get(activeTab);
    const container = containerRef.current;
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width
      });
    }
  }, [activeTab]);
  reactExports.useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);
  reactExports.useLayoutEffect(() => {
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);
  const setTabRef = reactExports.useCallback((key) => (el) => {
    if (el) {
      tabRefs.current.set(key, el);
    } else {
      tabRefs.current.delete(key);
    }
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "nav",
    {
      ref: containerRef,
      className: "relative flex items-center h-11 px-2 bg-forge-bg-secondary/80 backdrop-blur-sm border-b border-forge-border shrink-0",
      role: "tablist",
      "aria-label": "Main navigation",
      children: [
        TAB_DEFINITIONS.map(({ key, label }) => {
          const isActive = activeTab === key;
          const badgeCount = badges?.[key];
          return /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              ref: setTabRef(key),
              type: "button",
              role: "tab",
              "aria-selected": isActive,
              "aria-controls": `panel-${key}`,
              id: `tab-${key}`,
              onClick: () => onTabChange(key),
              className: [
                "relative flex items-center justify-center flex-1 h-full px-3 gap-1.5",
                "text-xs font-semibold tracking-widest uppercase",
                "transition-colors duration-200 motion-reduce:transition-none",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-forge-bg-secondary",
                isActive ? "text-accent-primary" : "text-forge-text-muted hover:text-forge-text-secondary"
              ].join(" "),
              style: isActive ? { textShadow: "0 0 10px rgba(16, 185, 129, 0.6)" } : void 0,
              children: [
                label,
                badgeCount != null && badgeCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "span",
                  {
                    className: [
                      "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none",
                      isActive ? "bg-accent-primary/20 text-accent-primary" : "bg-forge-bg-tertiary text-forge-text-muted"
                    ].join(" "),
                    children: badgeCount > 99 ? "99+" : badgeCount
                  }
                )
              ]
            },
            key
          );
        }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ease-out motion-reduce:transition-none",
            style: {
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              background: "linear-gradient(90deg, #10B981, #14B8A6)",
              boxShadow: "0 0 8px rgba(16, 185, 129, 0.5), 0 0 2px rgba(16, 185, 129, 0.3)"
            },
            "aria-hidden": "true"
          }
        )
      ]
    }
  );
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
const BottomBar = ({
  itemsCount,
  elapsedTime,
  progress,
  isPaused,
  onPause,
  onResume,
  onStop,
  onViewData
}) => {
  const handlePauseResume = reactExports.useCallback(() => {
    if (isPaused) {
      onResume?.();
    } else {
      onPause?.();
    }
  }, [isPaused, onPause, onResume]);
  const handleStop = reactExports.useCallback(() => {
    onStop?.();
  }, [onStop]);
  const handleViewData = reactExports.useCallback(() => {
    onViewData?.();
  }, [onViewData]);
  const timeDisplay = reactExports.useMemo(() => formatTime(elapsedTime), [elapsedTime]);
  const clampedProgress = Math.min(100, Math.max(0, progress));
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "footer",
    {
      className: "relative flex items-center h-14 px-3 bg-forge-bg/90 backdrop-blur-md border-t border-forge-border shrink-0 select-none animate-slide-in-up motion-reduce:animate-none",
      role: "status",
      "aria-label": "Extraction progress",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute top-0 left-0 right-0 h-0.5 bg-forge-border/40",
            "aria-hidden": "true",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: "h-full rounded-r-full transition-[width] duration-300 ease-out motion-reduce:transition-none",
                style: {
                  width: `${clampedProgress}%`,
                  background: "linear-gradient(90deg, #10B981, #14B8A6)",
                  boxShadow: "0 0 8px rgba(16, 185, 129, 0.4)"
                }
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mr-auto min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "svg",
              {
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: "text-accent-primary shrink-0",
                "aria-hidden": "true",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "7", height: "7" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "3", width: "7", height: "7" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "14", width: "7", height: "7" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "14", width: "7", height: "7" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-forge-text font-semibold tabular-nums", children: itemsCount.toLocaleString() }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-forge-text-muted", children: "items" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "svg",
              {
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: "text-accent-secondary shrink-0",
                "aria-hidden": "true",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "12 6 12 12 16 14" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-forge-text font-mono font-medium tabular-nums", children: timeDisplay })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handlePauseResume,
              className: "flex items-center justify-center w-8 h-8 rounded-lg text-forge-text-secondary hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-all duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
              "aria-label": isPaused ? "Resume extraction" : "Pause extraction",
              title: isPaused ? "Resume" : "Pause",
              children: isPaused ? (
                /* Play icon */
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "svg",
                  {
                    width: "16",
                    height: "16",
                    viewBox: "0 0 24 24",
                    fill: "currentColor",
                    "aria-hidden": "true",
                    children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "5 3 19 12 5 21 5 3" })
                  }
                )
              ) : (
                /* Pause icon */
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "svg",
                  {
                    width: "16",
                    height: "16",
                    viewBox: "0 0 24 24",
                    fill: "currentColor",
                    "aria-hidden": "true",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "6", y: "4", width: "4", height: "16", rx: "1" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "4", width: "4", height: "16", rx: "1" })
                    ]
                  }
                )
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleStop,
              className: "flex items-center justify-center w-8 h-8 rounded-lg text-forge-text-secondary hover:text-status-error hover:bg-status-error/10 transition-all duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
              "aria-label": "Stop extraction",
              title: "Stop",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "svg",
                {
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "currentColor",
                  "aria-hidden": "true",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "5", y: "5", width: "14", height: "14", rx: "2" })
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: handleViewData,
              className: "flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100",
              style: {
                background: "linear-gradient(135deg, #10B981, #14B8A6)",
                color: "#0A0F0D",
                boxShadow: "0 0 12px rgba(16, 185, 129, 0.3)"
              },
              "aria-label": "View extracted data",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "svg",
                  {
                    width: "14",
                    height: "14",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: "currentColor",
                    strokeWidth: "2.5",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    "aria-hidden": "true",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "3" })
                    ]
                  }
                ),
                "View Data"
              ]
            }
          )
        ] })
      ]
    }
  );
};

const PanelLayout = ({
  onSettingsClick,
  onMinimizeClick,
  activeTab,
  onTabChange,
  tabBadges,
  bottomBar,
  children
}) => {
  const showBottomBar = bottomBar?.visible ?? false;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-screen w-full bg-forge-bg text-forge-text overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(TopBar, { onSettingsClick, onMinimizeClick }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Navigation, { activeTab, onTabChange, badges: tabBadges }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "main",
      {
        id: `panel-${activeTab}`,
        role: "tabpanel",
        "aria-labelledby": `tab-${activeTab}`,
        className: "flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent",
        children
      }
    ),
    showBottomBar && bottomBar && /* @__PURE__ */ jsxRuntimeExports.jsx(
      BottomBar,
      {
        itemsCount: bottomBar.itemsCount,
        elapsedTime: bottomBar.elapsedTime,
        progress: bottomBar.progress,
        isPaused: bottomBar.isPaused,
        onPause: bottomBar.onPause,
        onResume: bottomBar.onResume,
        onStop: bottomBar.onStop,
        onViewData: bottomBar.onViewData
      }
    )
  ] });
};

function useAnimations() {
  const appAnimationsEnabled = useStore((s) => s.settings.general.animationsEnabled);
  const [prefersReducedMotion, setPrefersReducedMotion] = reactExports.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => {
      setPrefersReducedMotion(e.matches);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  const animationsEnabled = appAnimationsEnabled && !prefersReducedMotion;
  const shouldAnimate = animationsEnabled;
  const animClass = reactExports.useCallback(
    (className) => {
      return shouldAnimate ? className : "";
    },
    [shouldAnimate]
  );
  const staggerDelay = reactExports.useCallback(
    (index, baseDelayMs = 50) => {
      if (!shouldAnimate) return {};
      return {
        animationDelay: `${index * baseDelayMs}ms`,
        animationFillMode: "both"
      };
    },
    [shouldAnimate]
  );
  return reactExports.useMemo(
    () => ({
      animationsEnabled,
      prefersReducedMotion,
      shouldAnimate,
      animClass,
      staggerDelay
    }),
    [animationsEnabled, prefersReducedMotion, shouldAnimate, animClass, staggerDelay]
  );
}

const ToolCard = ({
  icon,
  title,
  description,
  onClick,
  badge,
  style,
  className = ""
}) => {
  const handleClick = reactExports.useCallback(() => {
    onClick();
  }, [onClick]);
  const handleKeyDown = reactExports.useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      role: "button",
      tabIndex: 0,
      onClick: handleClick,
      onKeyDown: handleKeyDown,
      style,
      className: [
        // Base layout
        "group relative flex items-center gap-3 p-3.5 rounded-xl cursor-pointer select-none",
        // Glassmorphism
        "bg-forge-bg-tertiary/60 backdrop-blur-xl",
        "border border-forge-border",
        // Transitions
        "transition-all duration-300 ease-out",
        "motion-reduce:transition-none",
        // Hover effects
        "hover:border-accent-primary/40",
        "hover:shadow-[0_0_20px_rgba(16,185,129,0.12),0_0_6px_rgba(16,185,129,0.08)]",
        "motion-safe:hover:translate-y-[-2px]",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50",
        "focus-visible:ring-offset-1 focus-visible:ring-offset-forge-bg",
        // Active press
        "motion-safe:active:scale-[0.98]",
        className
      ].join(" "),
      "aria-label": `Open ${title}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: [
              "flex items-center justify-center w-10 h-10 rounded-lg shrink-0",
              "bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20",
              "border border-accent-primary/10",
              "transition-all duration-300",
              "group-hover:from-accent-primary/30 group-hover:to-accent-secondary/30",
              "group-hover:border-accent-primary/20",
              "group-hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            ].join(" "),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg leading-none", children: icon })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "h3",
              {
                className: [
                  "text-sm font-semibold text-forge-text",
                  "transition-colors duration-200",
                  "group-hover:text-accent-primary"
                ].join(" "),
                children: title
              }
            ),
            badge && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: [
                  "inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold",
                  "leading-none tracking-wider uppercase",
                  "bg-accent-primary/15 text-accent-primary border border-accent-primary/20"
                ].join(" "),
                children: badge
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted mt-0.5 truncate", children: description })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "svg",
          {
            width: "16",
            height: "16",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            className: [
              "text-forge-text-muted/40 shrink-0",
              "transition-all duration-200",
              "group-hover:text-accent-primary group-hover:translate-x-0.5",
              "motion-reduce:group-hover:translate-x-0"
            ].join(" "),
            "aria-hidden": "true",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "9 18 15 12 9 6" })
          }
        )
      ]
    }
  );
};

function useChromeMessages() {
  const [lastMessage, setLastMessage] = reactExports.useState(null);
  const handlersRef = reactExports.useRef(/* @__PURE__ */ new Map());
  const on = reactExports.useCallback((type, handler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, /* @__PURE__ */ new Set());
    }
    handlersRef.current.get(type).add(handler);
    return () => {
      const handlers = handlersRef.current.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          handlersRef.current.delete(type);
        }
      }
    };
  }, []);
  reactExports.useEffect(() => {
    const removeListener = onMessage((rawMessage, _sender, _sendResponse) => {
      const message = rawMessage;
      if (!message || typeof message !== "object" || !("type" in message)) {
        return;
      }
      setLastMessage(message);
      const handlers = handlersRef.current.get(message.type);
      if (handlers) {
        for (const handler of handlers) {
          try {
            handler(message);
          } catch (err) {
            console.error(`[DataForge] Message handler error for ${message.type}:`, err);
          }
        }
      }
    });
    return removeListener;
  }, []);
  const sendMessage = reactExports.useCallback(async (message) => {
    try {
      const response = await sendRuntimeMessage(message);
      return response;
    } catch (err) {
      console.error("[DataForge] Failed to send runtime message:", err);
      throw err;
    }
  }, []);
  const sendToActiveTab = reactExports.useCallback(async (message) => {
    try {
      const tab = await getActiveTab();
      if (!tab?.id) {
        throw new Error("No active tab found");
      }
      const response = await sendTabMessage(tab.id, message);
      return response;
    } catch (err) {
      console.error("[DataForge] Failed to send tab message:", err);
      throw err;
    }
  }, []);
  return {
    sendMessage,
    sendToActiveTab,
    lastMessage,
    on
  };
}

function useExtraction() {
  const store = useStore();
  const { sendToActiveTab, on } = useChromeMessages();
  const cleanupRef = reactExports.useRef([]);
  const {
    extractionStatus: status,
    extractionProgress: progress,
    detectedPatterns: patterns,
    extractedRows,
    isScanning,
    error,
    setIsScanning,
    setDetectedPatterns,
    selectPattern: storeSelectPattern,
    setExtractionStatus,
    updateExtractionProgress,
    addExtractedRows,
    clearExtractedRows,
    setExtractionSummary,
    setError,
    buildExtractionConfig,
    resetListExtractor
  } = store;
  reactExports.useEffect(() => {
    const unsubs = [];
    unsubs.push(
      on("EXTRACTION_PROGRESS", (msg) => {
        if (msg.type === "EXTRACTION_PROGRESS") {
          updateExtractionProgress(msg.data);
        }
      })
    );
    unsubs.push(
      on("EXTRACTION_ROW", (msg) => {
        if (msg.type === "EXTRACTION_ROW") {
          addExtractedRows([msg.row]);
        }
      })
    );
    unsubs.push(
      on("EXTRACTION_BATCH", (msg) => {
        if (msg.type === "EXTRACTION_BATCH") {
          addExtractedRows(msg.rows);
        }
      })
    );
    unsubs.push(
      on("EXTRACTION_COMPLETE", (msg) => {
        if (msg.type === "EXTRACTION_COMPLETE") {
          setExtractionStatus("completed");
          setExtractionSummary(msg.summary);
        }
      })
    );
    unsubs.push(
      on("EXTRACTION_ERROR", (msg) => {
        if (msg.type === "EXTRACTION_ERROR") {
          setExtractionStatus("error");
          setError(msg.error);
        }
      })
    );
    cleanupRef.current = unsubs;
    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }, [on, updateExtractionProgress, addExtractedRows, setExtractionStatus, setExtractionSummary, setError]);
  const startScan = reactExports.useCallback(async () => {
    try {
      setIsScanning(true);
      setError(null);
      const response = await sendToActiveTab({ type: "SCAN_PAGE" });
      if (response && response.type === "SCAN_RESULT") {
        setDetectedPatterns(response.patterns);
        setIsScanning(false);
        return response.patterns;
      }
      setIsScanning(false);
      return [];
    } catch (err) {
      setIsScanning(false);
      const message = err instanceof Error ? err.message : "Failed to scan page";
      setError(message);
      return [];
    }
  }, [sendToActiveTab, setIsScanning, setDetectedPatterns, setError]);
  const selectPattern = reactExports.useCallback(
    (patternId) => {
      storeSelectPattern(patternId);
      sendToActiveTab({ type: "SELECT_PATTERN", patternId }).catch((err) => {
        console.error("[DataForge] Failed to select pattern:", err);
      });
    },
    [storeSelectPattern, sendToActiveTab]
  );
  const startExtraction = reactExports.useCallback(
    async (config) => {
      try {
        setError(null);
        clearExtractedRows();
        const extractionConfig = config ?? buildExtractionConfig();
        setExtractionStatus("running");
        await sendToActiveTab({
          type: "START_EXTRACTION",
          config: extractionConfig
        });
      } catch (err) {
        setExtractionStatus("error");
        const message = err instanceof Error ? err.message : "Failed to start extraction";
        setError(message);
      }
    },
    [sendToActiveTab, setExtractionStatus, setError, clearExtractedRows, buildExtractionConfig]
  );
  const pause = reactExports.useCallback(async () => {
    try {
      setExtractionStatus("paused");
      await sendToActiveTab({ type: "PAUSE_EXTRACTION" });
    } catch (err) {
      console.error("[DataForge] Failed to pause extraction:", err);
    }
  }, [sendToActiveTab, setExtractionStatus]);
  const resume = reactExports.useCallback(async () => {
    try {
      setExtractionStatus("running");
      await sendToActiveTab({ type: "RESUME_EXTRACTION" });
    } catch (err) {
      console.error("[DataForge] Failed to resume extraction:", err);
    }
  }, [sendToActiveTab, setExtractionStatus]);
  const stop = reactExports.useCallback(async () => {
    try {
      setExtractionStatus("completed");
      await sendToActiveTab({ type: "STOP_EXTRACTION" });
    } catch (err) {
      console.error("[DataForge] Failed to stop extraction:", err);
    }
  }, [sendToActiveTab, setExtractionStatus]);
  const reset = reactExports.useCallback(() => {
    resetListExtractor();
  }, [resetListExtractor]);
  return {
    status,
    progress,
    patterns,
    extractedRows,
    isScanning,
    error,
    startScan,
    selectPattern,
    startExtraction,
    pause,
    resume,
    stop,
    reset
  };
}

const QuickExtractButton = () => {
  const [isProcessing, setIsProcessing] = reactExports.useState(false);
  const { startScan, selectPattern, startExtraction, status } = useExtraction();
  const addToast = useStore((s) => s.addToast);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const isRunning = status === "running" || status === "paused";
  const isDisabled = isRunning || isProcessing;
  const handleClick = reactExports.useCallback(async () => {
    if (isDisabled) return;
    try {
      setIsProcessing(true);
      const patterns = await startScan();
      if (patterns.length === 0) {
        addToast({
          type: "warning",
          title: "No patterns found",
          message: "Try using a specific extractor tool instead.",
          duration: 5e3
        });
        setIsProcessing(false);
        return;
      }
      const topPattern = patterns.reduce(
        (best, current) => current.confidence > best.confidence ? current : best
      );
      selectPattern(topPattern.id);
      setActiveTool("list-extractor");
      await startExtraction();
      addToast({
        type: "success",
        title: "Quick Extract started",
        message: `Found ${topPattern.itemCount} items using ${topPattern.category} pattern`,
        duration: 4e3
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Quick extraction failed";
      addToast({
        type: "error",
        title: "Quick Extract failed",
        message,
        duration: 5e3
      });
    } finally {
      setIsProcessing(false);
    }
  }, [isDisabled, startScan, selectPattern, startExtraction, setActiveTool, addToast]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      onClick: handleClick,
      disabled: isDisabled,
      className: [
        // Layout
        "relative w-full flex items-center justify-center gap-2.5 h-12 px-5 rounded-xl",
        "select-none font-semibold text-sm tracking-wide",
        // Colors
        "text-forge-bg",
        // Gradient
        "bg-gradient-to-r from-accent-primary to-accent-secondary",
        // Transitions
        "transition-all duration-300 ease-out",
        "motion-reduce:transition-none",
        // Hover
        isDisabled ? "opacity-60 cursor-not-allowed" : [
          "cursor-pointer",
          "hover:shadow-[0_0_30px_rgba(16,185,129,0.4),0_0_10px_rgba(16,185,129,0.2)]",
          "motion-safe:hover:scale-[1.02]",
          "motion-safe:active:scale-[0.98]"
        ].join(" "),
        // Idle pulsing glow (only when not processing and not running)
        !isDisabled ? "animate-pulse-glow" : "",
        // Focus
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-forge-bg"
      ].join(" "),
      "aria-label": isProcessing ? "Scanning page..." : "Quick extract data from this page",
      children: isProcessing ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "svg",
          {
            className: "animate-spin w-5 h-5",
            viewBox: "0 0 24 24",
            fill: "none",
            "aria-hidden": "true",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "circle",
                {
                  cx: "12",
                  cy: "12",
                  r: "10",
                  stroke: "currentColor",
                  strokeWidth: "3",
                  strokeLinecap: "round",
                  className: "opacity-25"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  d: "M12 2a10 10 0 0 1 10 10",
                  stroke: "currentColor",
                  strokeWidth: "3",
                  strokeLinecap: "round",
                  className: "opacity-75"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Scanning Page..." })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "svg",
          {
            width: "20",
            height: "20",
            viewBox: "0 0 24 24",
            fill: "currentColor",
            className: [
              isDisabled ? "" : "drop-shadow-[0_0_6px_rgba(10,15,13,0.5)]",
              // Lightning flash animation when idle
              !isDisabled ? "animate-[lightningFlash_2s_ease-in-out_infinite]" : ""
            ].join(" "),
            "aria-hidden": "true",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Quick Extract" })
      ] })
    }
  );
};

const TOOLS = [
  {
    id: "list-extractor",
    icon: "📋",
    title: "List Extractor",
    description: "Extract repeating items like products, listings, and tables"
  },
  {
    id: "page-extractor",
    icon: "📄",
    title: "Page Extractor",
    description: "Scrape structured data from single or multiple pages"
  },
  {
    id: "email-extractor",
    icon: "📧",
    title: "Email Extractor",
    description: "Find and collect email addresses from any webpage"
  },
  {
    id: "image-downloader",
    icon: "🖼️",
    title: "Image Downloader",
    description: "Bulk download images with filtering by size and type"
  },
  {
    id: "text-extractor",
    icon: "📝",
    title: "Text Extractor",
    description: "Extract clean text content, articles, and paragraphs"
  },
  {
    id: "templates",
    icon: "💾",
    title: "Templates",
    description: "Save and reuse extraction configurations across sites"
  }
];
const ToolsMenu = () => {
  const setActiveTool = useStore((s) => s.setActiveTool);
  const { shouldAnimate, staggerDelay } = useAnimations();
  const toolCards = reactExports.useMemo(
    () => TOOLS.map((tool, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      ToolCard,
      {
        icon: tool.icon,
        title: tool.title,
        description: tool.description,
        badge: tool.badge,
        onClick: () => setActiveTool(tool.id),
        style: shouldAnimate ? staggerDelay(index + 1, 50) : void 0,
        className: shouldAnimate ? "animate-[staggerFadeInUp_0.4s_ease-out]" : ""
      },
      tool.id
    )),
    [setActiveTool, shouldAnimate, staggerDelay]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        style: shouldAnimate ? staggerDelay(0, 50) : void 0,
        className: shouldAnimate ? "animate-[staggerFadeInUp_0.4s_ease-out]" : "",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(QuickExtractButton, {})
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 px-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-forge-border/60" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold tracking-widest uppercase text-forge-text-muted/60", children: "Tools" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-px bg-forge-border/60" })
    ] }),
    toolCards
  ] });
};

const HISTORY_STORAGE_KEY = "dataforge_history";
function useHistory() {
  const [isLoading, setIsLoading] = reactExports.useState(false);
  const store = useStore();
  const {
    history,
    historySearchQuery: searchQuery,
    addHistory,
    removeHistory,
    clearHistory,
    setHistorySearch,
    searchHistory: getFilteredHistory
  } = store;
  const loadHistory = reactExports.useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await loadSetting(HISTORY_STORAGE_KEY, null);
      if (stored && Array.isArray(stored)) {
        clearHistory();
        for (let i = stored.length - 1; i >= 0; i--) {
          addHistory(stored[i]);
        }
      }
    } catch (err) {
      console.error("[DataForge] Failed to load history:", err);
    } finally {
      setIsLoading(false);
    }
  }, [addHistory, clearHistory]);
  const persistHistory = reactExports.useCallback(async (items) => {
    try {
      await saveSetting(HISTORY_STORAGE_KEY, items);
    } catch (err) {
      console.error("[DataForge] Failed to persist history:", err);
    }
  }, []);
  const addToHistory = reactExports.useCallback(
    async (item) => {
      addHistory(item);
      await persistHistory([item, ...history]);
    },
    [addHistory, history, persistHistory]
  );
  const removeFromHistory = reactExports.useCallback(
    async (id) => {
      removeHistory(id);
      const updated = history.filter((h) => h.id !== id);
      await persistHistory(updated);
    },
    [removeHistory, history, persistHistory]
  );
  const clearAllHistory = reactExports.useCallback(async () => {
    clearHistory();
    await persistHistory([]);
  }, [clearHistory, persistHistory]);
  const searchHistoryFn = reactExports.useCallback(
    (query) => {
      setHistorySearch(query);
    },
    [setHistorySearch]
  );
  const filteredHistory = reactExports.useMemo(() => {
    return getFilteredHistory();
  }, [getFilteredHistory, searchQuery, history]);
  reactExports.useEffect(() => {
    loadHistory();
  }, [loadHistory]);
  return {
    history,
    isLoading,
    filteredHistory,
    searchQuery,
    loadHistory,
    addToHistory,
    removeFromHistory,
    clearAllHistory,
    searchHistory: searchHistoryFn
  };
}

function useDebouncedCallback(callback, delayMs) {
  const timeoutRef = reactExports.useRef(null);
  const callbackRef = reactExports.useRef(callback);
  callbackRef.current = callback;
  reactExports.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  return reactExports.useCallback(
    (...args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs]
  );
}
const HistorySearch = ({
  value,
  onChange,
  placeholder = "Search history by name, domain, or tool..."
}) => {
  const [localValue, setLocalValue] = reactExports.useState(value);
  const inputRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    setLocalValue(value);
  }, [value]);
  const debouncedOnChange = useDebouncedCallback(
    (query) => onChange(query),
    200
  );
  const handleChange = reactExports.useCallback(
    (e) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange]
  );
  const handleClear = reactExports.useCallback(() => {
    setLocalValue("");
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);
  const handleKeyDown = reactExports.useCallback(
    (e) => {
      if (e.key === "Escape") {
        handleClear();
      }
    },
    [handleClear]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "svg",
      {
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        className: "text-forge-text-muted/50",
        "aria-hidden": "true",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "8" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 21l-4.35-4.35" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        ref: inputRef,
        type: "text",
        value: localValue,
        onChange: handleChange,
        onKeyDown: handleKeyDown,
        placeholder,
        className: [
          "w-full h-9 pl-9 pr-9 rounded-lg text-sm",
          "bg-forge-bg-secondary border border-forge-border",
          "text-forge-text placeholder:text-forge-text-muted/40",
          "focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30",
          "focus:outline-none",
          "transition-all duration-200 motion-reduce:transition-none"
        ].join(" "),
        "aria-label": "Search history"
      }
    ),
    localValue && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: handleClear,
        className: [
          "absolute right-2 top-1/2 -translate-y-1/2",
          "flex items-center justify-center w-5 h-5 rounded",
          "text-forge-text-muted hover:text-forge-text",
          "hover:bg-forge-bg-tertiary/60",
          "transition-colors duration-150 motion-reduce:transition-none"
        ].join(" "),
        "aria-label": "Clear search",
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "svg",
          {
            width: "14",
            height: "14",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            "aria-hidden": "true",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
            ]
          }
        )
      }
    )
  ] });
};

function formatNumber(value, locale = "en-US") {
  if (!Number.isFinite(value)) return String(value);
  return new Intl.NumberFormat(locale).format(value);
}
function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0s";
  if (seconds < 1) return "< 1s";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds % 3600 / 60);
  const secs = Math.floor(seconds % 60);
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  return parts.join(" ");
}
function formatFileSize(bytes, decimals = 1) {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const k = 1024;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / Math.pow(k, i);
  if (i === 0) return `${Math.round(value)} B`;
  return `${value.toFixed(decimals)} ${units[i]}`;
}
function formatDate(timestamp, options = "short") {
  if (!Number.isFinite(timestamp)) return "Invalid date";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Invalid date";
  if (options === "relative") {
    return formatRelativeTime(date);
  }
  const presets = {
    short: { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" },
    long: {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }
  };
  const formatOptions = typeof options === "string" ? presets[options] : options;
  return new Intl.DateTimeFormat("en-US", formatOptions).format(date);
}
function formatRelativeTime(date) {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1e3);
  if (diffSec < 10) return "just now";
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear}y ago`;
}
function truncateText(text, maxLength = 100, suffix = "...") {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  const truncateAt = Math.max(0, maxLength - suffix.length);
  return text.slice(0, truncateAt) + suffix;
}

const variantStyles = {
  default: {
    base: "bg-forge-bg-tertiary text-forge-text-secondary border-forge-border",
    hoverGlow: "hover:shadow-[0_0_8px_rgba(16,185,129,0.2)]"
  },
  success: {
    base: "bg-status-success/15 text-status-success border-status-success/30",
    hoverGlow: "hover:shadow-[0_0_8px_rgba(16,185,129,0.35)]"
  },
  warning: {
    base: "bg-status-warning/15 text-status-warning border-status-warning/30",
    hoverGlow: "hover:shadow-[0_0_8px_rgba(245,158,11,0.35)]"
  },
  error: {
    base: "bg-status-error/15 text-status-error border-status-error/30",
    hoverGlow: "hover:shadow-[0_0_8px_rgba(239,68,68,0.35)]"
  },
  info: {
    base: "bg-status-info/15 text-status-info border-status-info/30",
    hoverGlow: "hover:shadow-[0_0_8px_rgba(139,92,246,0.35)]"
  }
};
const Badge = ({ variant = "default", children, className = "" }) => {
  const { base, hoverGlow } = variantStyles[variant];
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      className: [
        // Shape
        "inline-flex items-center px-2 py-0.5 rounded-full",
        "text-[11px] font-semibold leading-none tracking-wide uppercase",
        "border select-none whitespace-nowrap",
        // Transition
        "transition-shadow duration-200 motion-reduce:transition-none",
        // Variant
        base,
        hoverGlow,
        className
      ].join(" "),
      children
    }
  );
};

const TOOL_ICONS = {
  "list-extractor": "📋",
  "page-extractor": "📄",
  "email-extractor": "📧",
  "image-downloader": "🖼️",
  "text-extractor": "📝",
  "templates": "💾"
};
const STATUS_VARIANT = {
  completed: "success",
  partial: "warning",
  error: "error"
};
const STATUS_LABEL = {
  completed: "Completed",
  partial: "Partial",
  error: "Error"
};
function extractDomain(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}
const HistoryItem = ({
  item,
  onView,
  onDelete,
  style,
  className = ""
}) => {
  const [showConfirm, setShowConfirm] = reactExports.useState(false);
  const handleClick = reactExports.useCallback(() => {
    onView(item);
  }, [item, onView]);
  const handleDeleteClick = reactExports.useCallback(
    (e) => {
      e.stopPropagation();
      if (showConfirm) {
        onDelete(item.id);
        setShowConfirm(false);
      } else {
        setShowConfirm(true);
      }
    },
    [showConfirm, item.id, onDelete]
  );
  const handleCancelDelete = reactExports.useCallback((e) => {
    e.stopPropagation();
    setShowConfirm(false);
  }, []);
  const handleMouseLeave = reactExports.useCallback(() => {
    if (showConfirm) {
      setShowConfirm(false);
    }
  }, [showConfirm]);
  const domain = extractDomain(item.sourceUrl);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      role: "button",
      tabIndex: 0,
      onClick: handleClick,
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      },
      onMouseLeave: handleMouseLeave,
      style,
      className: [
        "group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer select-none",
        "bg-forge-bg-tertiary/40 backdrop-blur-xl",
        "border border-forge-border",
        "transition-all duration-200 motion-reduce:transition-none",
        "hover:border-accent-primary/30",
        "hover:shadow-[0_0_15px_rgba(16,185,129,0.08)]",
        "hover:bg-forge-bg-tertiary/60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50",
        className
      ].join(" "),
      "aria-label": `View extraction: ${item.name}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: [
              "flex items-center justify-center w-9 h-9 rounded-lg shrink-0",
              "bg-gradient-to-br from-accent-primary/15 to-accent-secondary/15",
              "border border-accent-primary/10"
            ].join(" "),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base leading-none", "aria-hidden": "true", children: TOOL_ICONS[item.tool] || "📋" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-medium text-forge-text truncate", children: item.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: STATUS_VARIANT[item.status], className: "shrink-0", children: STATUS_LABEL[item.status] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted truncate mb-1", children: domain }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-[11px] text-forge-text-muted/70", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "svg",
                {
                  width: "12",
                  height: "12",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  "aria-hidden": "true",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "7", height: "7" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "3", width: "7", height: "7" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "14", width: "7", height: "7" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "14", width: "7", height: "7" })
                  ]
                }
              ),
              formatNumber(item.rowCount),
              " rows"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "svg",
                {
                  width: "12",
                  height: "12",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  "aria-hidden": "true",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "12 6 12 12 16 14" })
                  ]
                }
              ),
              formatDate(item.createdAt, "relative")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 shrink-0 mt-1", children: [
          showConfirm && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleCancelDelete,
              className: [
                "flex items-center justify-center w-6 h-6 rounded",
                "text-forge-text-muted hover:text-forge-text",
                "hover:bg-forge-bg-tertiary/60",
                "transition-colors duration-150 motion-reduce:transition-none",
                "animate-fade-in"
              ].join(" "),
              "aria-label": "Cancel delete",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "svg",
                {
                  width: "12",
                  height: "12",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2.5",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  "aria-hidden": "true",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleDeleteClick,
              className: [
                "flex items-center justify-center w-6 h-6 rounded",
                "transition-all duration-150 motion-reduce:transition-none",
                showConfirm ? "text-status-error bg-status-error/10 hover:bg-status-error/20" : [
                  "text-forge-text-muted/40",
                  "opacity-0 group-hover:opacity-100",
                  "hover:text-status-error hover:bg-status-error/10"
                ].join(" ")
              ].join(" "),
              "aria-label": showConfirm ? "Confirm delete" : "Delete extraction",
              title: showConfirm ? "Click again to confirm" : "Delete",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "svg",
                {
                  width: "14",
                  height: "14",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  "aria-hidden": "true",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "3 6 5 6 21 6" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M10 11v6" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M14 11v6" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" })
                  ]
                }
              )
            }
          )
        ] })
      ]
    }
  );
};

const HistoryView = () => {
  const {
    filteredHistory,
    isLoading,
    searchQuery,
    searchHistory,
    removeFromHistory,
    clearAllHistory
  } = useHistory();
  const { shouldAnimate, staggerDelay } = useAnimations();
  const setTab = useStore((s) => s.setTab);
  const setActiveTable = useStore((s) => s.setActiveTable);
  const handleView = reactExports.useCallback(
    (item) => {
      if (item.tableId) {
        setActiveTable(item.tableId);
        setTab("data");
      }
    },
    [setActiveTable, setTab]
  );
  const handleDelete = reactExports.useCallback(
    (id) => {
      removeFromHistory(id);
    },
    [removeFromHistory]
  );
  const handleClearAll = reactExports.useCallback(() => {
    if (window.confirm("Are you sure you want to clear all history? This cannot be undone.")) {
      clearAllHistory();
    }
  }, [clearAllHistory]);
  const renderedItems = reactExports.useMemo(
    () => filteredHistory.map((item, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      HistoryItem,
      {
        item,
        onView: handleView,
        onDelete: handleDelete,
        style: shouldAnimate ? staggerDelay(index, 30) : void 0,
        className: shouldAnimate ? "animate-[staggerFadeInUp_0.35s_ease-out]" : ""
      },
      item.id
    )),
    [filteredHistory, handleView, handleDelete, shouldAnimate, staggerDelay]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 pt-4 pb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-forge-text", children: "Extraction History" }),
      filteredHistory.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: handleClearAll,
          className: [
            "text-[11px] font-medium text-forge-text-muted/60",
            "hover:text-status-error transition-colors duration-150",
            "motion-reduce:transition-none"
          ].join(" "),
          children: "Clear All"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(HistorySearch, { value: searchQuery, onChange: searchHistory }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto px-4 pb-4", children: isLoading ? (
      /* Loading state */
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-16", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "svg",
          {
            className: "animate-spin w-8 h-8 text-accent-primary/50 mb-3",
            viewBox: "0 0 24 24",
            fill: "none",
            "aria-hidden": "true",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "circle",
                {
                  cx: "12",
                  cy: "12",
                  r: "10",
                  stroke: "currentColor",
                  strokeWidth: "3",
                  strokeLinecap: "round",
                  className: "opacity-25"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "path",
                {
                  d: "M12 2a10 10 0 0 1 10 10",
                  stroke: "currentColor",
                  strokeWidth: "3",
                  strokeLinecap: "round",
                  className: "opacity-75"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted", children: "Loading history..." })
      ] })
    ) : filteredHistory.length === 0 ? (
      /* Empty state */
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-16 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: [
              "flex items-center justify-center w-16 h-16 rounded-2xl mb-4",
              "bg-forge-bg-tertiary/60 border border-forge-border"
            ].join(" "),
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "svg",
              {
                width: "32",
                height: "32",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "1.5",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: "text-forge-text-muted/30",
                "aria-hidden": "true",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "12 6 12 12 16 14" })
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-medium text-forge-text-muted mb-1", children: searchQuery ? "No matching extractions" : "No extractions yet" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted/60 max-w-[200px]", children: searchQuery ? "Try a different search term or clear the filter." : "Your extraction history will appear here after your first data extraction." })
      ] })
    ) : (
      /* History items */
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-2", children: renderedItems })
    ) })
  ] });
};

const SettingsSection = ({
  title,
  icon,
  defaultExpanded = true,
  children,
  className = ""
}) => {
  const [isExpanded, setIsExpanded] = reactExports.useState(defaultExpanded);
  const contentRef = reactExports.useRef(null);
  const [contentHeight, setContentHeight] = reactExports.useState(void 0);
  reactExports.useEffect(() => {
    if (contentRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContentHeight(entry.contentRect.height);
        }
      });
      observer.observe(contentRef.current);
      return () => observer.disconnect();
    }
  }, []);
  const handleToggle = reactExports.useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);
  const handleKeyDown = reactExports.useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );
  const sectionId = `settings-section-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const contentId = `${sectionId}-content`;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: [
        "rounded-xl border border-forge-border overflow-hidden",
        "bg-forge-bg-tertiary/30 backdrop-blur-sm",
        "transition-colors duration-200 motion-reduce:transition-none",
        className
      ].join(" "),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: handleToggle,
            onKeyDown: handleKeyDown,
            "aria-expanded": isExpanded,
            "aria-controls": contentId,
            id: sectionId,
            className: [
              "w-full flex items-center gap-2.5 px-4 py-3",
              "text-left select-none cursor-pointer",
              "hover:bg-forge-bg-tertiary/40",
              "transition-colors duration-150 motion-reduce:transition-none",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset",
              "focus-visible:ring-accent-primary/50"
            ].join(" "),
            children: [
              icon && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm leading-none shrink-0", "aria-hidden": "true", children: icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-sm font-semibold text-forge-text", children: title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "svg",
                {
                  width: "16",
                  height: "16",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  className: [
                    "text-forge-text-muted shrink-0",
                    "transition-transform duration-200 motion-reduce:transition-none",
                    isExpanded ? "rotate-180" : "rotate-0"
                  ].join(" "),
                  "aria-hidden": "true",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "6 9 12 15 18 9" })
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            id: contentId,
            role: "region",
            "aria-labelledby": sectionId,
            className: "overflow-hidden transition-[max-height,opacity] duration-300 ease-out motion-reduce:transition-none",
            style: {
              maxHeight: isExpanded ? (contentHeight ?? 500) + 32 : 0,
              opacity: isExpanded ? 1 : 0
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: contentRef, className: "px-4 pb-4 pt-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px bg-forge-border/40 mb-3" }),
              children
            ] })
          }
        )
      ]
    }
  );
};

const SettingToggle = ({ label, description, checked, onChange }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 py-2", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-forge-text", children: label }),
    description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted/60 mt-0.5", children: description })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      role: "switch",
      "aria-checked": checked,
      "aria-label": label,
      onClick: () => onChange(!checked),
      "data-state": checked ? "checked" : "unchecked",
      className: "toggle-switch shrink-0",
      children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "toggle-switch-thumb" })
    }
  )
] });
const SettingNumber = ({ label, description, value, min, max, step = 1, onChange }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 py-2", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-forge-text", children: label }),
    description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted/60 mt-0.5", children: description })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "input",
    {
      type: "number",
      value,
      min,
      max,
      step,
      onChange: (e) => {
        const num = Number(e.target.value);
        if (!isNaN(num)) onChange(num);
      },
      className: [
        "w-20 h-8 px-2 rounded-lg text-sm text-right tabular-nums",
        "bg-forge-bg-secondary border border-forge-border text-forge-text",
        "focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30",
        "focus:outline-none",
        "transition-all duration-200 motion-reduce:transition-none"
      ].join(" "),
      "aria-label": label
    }
  )
] });
const SettingSelect = ({ label, description, value, options, onChange }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-3 py-2", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-forge-text", children: label }),
    description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted/60 mt-0.5", children: description })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "select",
    {
      value,
      onChange: (e) => onChange(e.target.value),
      className: [
        "h-8 px-2 pr-7 rounded-lg text-sm",
        "bg-forge-bg-secondary border border-forge-border text-forge-text",
        "focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30",
        "focus:outline-none appearance-none",
        "transition-all duration-200 motion-reduce:transition-none",
        'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%234ADE80%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%2F%3E%3C%2Fsvg%3E")]',
        "bg-[length:16px] bg-[right_4px_center] bg-no-repeat"
      ].join(" "),
      "aria-label": label,
      children: options.map((opt) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: opt.value, children: opt.label }, opt.value))
    }
  )
] });
const SettingSlider = ({ label, description, value, min, max, step = 1, unit = "", onChange }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "py-2", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-forge-text", children: label }),
      description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted/60 mt-0.5", children: description })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono text-accent-primary tabular-nums shrink-0", children: [
      value,
      unit
    ] })
  ] }),
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "input",
    {
      type: "range",
      value,
      min,
      max,
      step,
      onChange: (e) => onChange(Number(e.target.value)),
      className: [
        "w-full h-1.5 rounded-full appearance-none cursor-pointer",
        "bg-forge-bg-tertiary",
        "[&::-webkit-slider-thumb]:appearance-none",
        "[&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5",
        "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-primary",
        "[&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(16,185,129,0.4)]",
        "[&::-webkit-slider-thumb]:cursor-pointer",
        "[&::-webkit-slider-thumb]:transition-shadow [&::-webkit-slider-thumb]:duration-200",
        "[&::-webkit-slider-thumb]:hover:shadow-[0_0_12px_rgba(16,185,129,0.6)]",
        "[&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5",
        "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent-primary",
        "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
      ].join(" "),
      "aria-label": label
    }
  )
] });
const SettingsView = () => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const handleReset = reactExports.useCallback(() => {
    if (window.confirm("Reset all settings to factory defaults? Your current preferences will be lost.")) {
      resetSettings();
    }
  }, [resetSettings]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between mb-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-forge-text", children: "Settings" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsSection, { title: "General", icon: "⚙️", defaultExpanded: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingToggle,
        {
          label: "Animations",
          description: "Enable UI animations and transitions",
          checked: settings.general.animationsEnabled,
          onChange: (v) => updateSettings({ general: { animationsEnabled: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingToggle,
        {
          label: "Notifications",
          description: "Show system notifications on completion",
          checked: settings.general.notificationsEnabled,
          onChange: (v) => updateSettings({ general: { notificationsEnabled: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingToggle,
        {
          label: "Auto-save History",
          description: "Automatically save extractions to history",
          checked: settings.general.autoSaveHistory,
          onChange: (v) => updateSettings({ general: { autoSaveHistory: v } })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsSection, { title: "Extraction", icon: "⚡", defaultExpanded: false, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingSlider,
        {
          label: "Max Items",
          description: "Maximum number of items to extract",
          value: settings.extraction.defaultMaxItems,
          min: 10,
          max: 1e4,
          step: 10,
          onChange: (v) => updateSettings({ extraction: { defaultMaxItems: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingSlider,
        {
          label: "Max Pages",
          description: "Maximum number of pages to scrape",
          value: settings.extraction.defaultMaxPages,
          min: 1,
          max: 500,
          onChange: (v) => updateSettings({ extraction: { defaultMaxPages: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingSlider,
        {
          label: "Delay Between Pages",
          description: "Wait time in ms between page navigations",
          value: settings.extraction.defaultDelay,
          min: 200,
          max: 1e4,
          step: 100,
          unit: "ms",
          onChange: (v) => updateSettings({ extraction: { defaultDelay: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingToggle,
        {
          label: "Respect robots.txt",
          description: "Honor site crawling directives",
          checked: settings.extraction.respectRobotsTxt,
          onChange: (v) => updateSettings({ extraction: { respectRobotsTxt: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingToggle,
        {
          label: "Auto-clean Data",
          description: "Remove extra whitespace and formatting",
          checked: settings.extraction.autoCleanData,
          onChange: (v) => updateSettings({ extraction: { autoCleanData: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingToggle,
        {
          label: "Auto-deduplicate",
          description: "Remove duplicate rows automatically",
          checked: settings.extraction.autoDeduplicate,
          onChange: (v) => updateSettings({ extraction: { autoDeduplicate: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingNumber,
        {
          label: "Concurrent Tabs",
          description: "Number of tabs for parallel extraction",
          value: settings.extraction.concurrentTabs,
          min: 1,
          max: 5,
          onChange: (v) => updateSettings({ extraction: { concurrentTabs: v } })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsSection, { title: "Export", icon: "📤", defaultExpanded: false, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingSelect,
        {
          label: "Default Format",
          description: "Default file format for exports",
          value: settings.export.defaultFormat,
          options: [
            { value: "csv", label: "CSV" },
            { value: "xlsx", label: "Excel (XLSX)" },
            { value: "json", label: "JSON" }
          ],
          onChange: (v) => updateSettings({ export: { defaultFormat: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingSelect,
        {
          label: "CSV Delimiter",
          description: "Column separator for CSV files",
          value: settings.export.csvDelimiter,
          options: [
            { value: ",", label: "Comma (,)" },
            { value: ";", label: "Semicolon (;)" },
            { value: "	", label: "Tab" },
            { value: "|", label: "Pipe (|)" }
          ],
          onChange: (v) => updateSettings({ export: { csvDelimiter: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingSelect,
        {
          label: "CSV Encoding",
          description: "Character encoding for CSV files",
          value: settings.export.csvEncoding,
          options: [
            { value: "utf-8", label: "UTF-8" },
            { value: "utf-16", label: "UTF-16" },
            { value: "ascii", label: "ASCII" }
          ],
          onChange: (v) => updateSettings({ export: { csvEncoding: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingSelect,
        {
          label: "JSON Format",
          description: "Structure of exported JSON data",
          value: settings.export.jsonFormat,
          options: [
            { value: "array", label: "Array of arrays" },
            { value: "nested", label: "Array of objects" }
          ],
          onChange: (v) => updateSettings({ export: { jsonFormat: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingToggle,
        {
          label: "Include Headers",
          description: "Add column headers to exports",
          checked: settings.export.includeHeaders,
          onChange: (v) => updateSettings({ export: { includeHeaders: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingToggle,
        {
          label: "Include Timestamp",
          description: "Add extraction timestamp to filename",
          checked: settings.export.includeTimestamp,
          onChange: (v) => updateSettings({ export: { includeTimestamp: v } })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsSection, { title: "Advanced", icon: "🔧", defaultExpanded: false, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingSelect,
        {
          label: "Selector Strategy",
          description: "Algorithm for generating CSS selectors",
          value: settings.advanced.selectorStrategy,
          options: [
            { value: "auto", label: "Auto (recommended)" },
            { value: "data-attributes", label: "Data attributes" },
            { value: "semantic", label: "Semantic classes" },
            { value: "structural", label: "Structural path" }
          ],
          onChange: (v) => updateSettings({
            advanced: { selectorStrategy: v }
          })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingSelect,
        {
          label: "Scroll Speed",
          description: "Speed for infinite scroll extraction",
          value: settings.advanced.scrollSpeed,
          options: [
            { value: "slow", label: "Slow" },
            { value: "medium", label: "Medium" },
            { value: "fast", label: "Fast" }
          ],
          onChange: (v) => updateSettings({ advanced: { scrollSpeed: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingSlider,
        {
          label: "Mutation Wait",
          description: "Time to wait for DOM changes after navigation",
          value: settings.advanced.mutationWaitMs,
          min: 500,
          max: 1e4,
          step: 100,
          unit: "ms",
          onChange: (v) => updateSettings({ advanced: { mutationWaitMs: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingNumber,
        {
          label: "Max Retries",
          description: "Number of retries on extraction errors",
          value: settings.advanced.maxRetries,
          min: 0,
          max: 10,
          onChange: (v) => updateSettings({ advanced: { maxRetries: v } })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SettingToggle,
        {
          label: "Debug Mode",
          description: "Show detailed logs and debug overlays",
          checked: settings.advanced.debugMode,
          onChange: (v) => updateSettings({ advanced: { debugMode: v } })
        }
      )
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: handleReset,
        className: [
          "w-full flex items-center justify-center gap-2 h-10 mt-2 rounded-xl",
          "text-sm font-medium",
          "text-forge-text-muted border border-forge-border",
          "bg-transparent",
          "hover:text-status-error hover:border-status-error/40",
          "hover:bg-status-error/5",
          "transition-all duration-200 motion-reduce:transition-none",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
        ].join(" "),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "svg",
            {
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              "aria-hidden": "true",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "1 4 1 10 7 10" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M3.51 15a9 9 0 1 0 2.13-9.36L1 10" })
              ]
            }
          ),
          "Reset to Defaults"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-4" })
  ] });
};

const CATEGORY_ICONS = {
  product: "🛒",
  // shopping cart
  review: "⭐",
  // star
  listing: "📋",
  // clipboard
  article: "📰",
  // newspaper
  "table-row": "📊",
  // chart
  card: "🎴",
  // playing card
  "feed-item": "📡",
  // satellite
  generic: "🔍"
  // magnifier
};
const CATEGORY_LABELS = {
  product: "Product Listing",
  review: "Review Items",
  listing: "Listing Items",
  article: "Article Items",
  "table-row": "Table Rows",
  card: "Card Elements",
  "feed-item": "Feed Items",
  generic: "Repeating Pattern"
};
const ConfidenceBar = ({ value }) => {
  const pct = Math.round(value * 100);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-1.5 rounded-full bg-forge-border overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "h-full rounded-full transition-all duration-500",
        style: {
          width: `${pct}%`,
          background: pct >= 70 ? "linear-gradient(90deg, #10B981, #14B8A6)" : pct >= 40 ? "linear-gradient(90deg, #F59E0B, #FBBF24)" : "#EF4444"
        }
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] tabular-nums font-semibold text-forge-text-muted w-8 text-right", children: [
      pct,
      "%"
    ] })
  ] });
};
const PatternCard = ({
  pattern,
  isSelected,
  isTopSuggestion,
  onSelect
}) => {
  const icon = CATEGORY_ICONS[pattern.category] ?? CATEGORY_ICONS.generic;
  const label = CATEGORY_LABELS[pattern.category] ?? "Pattern";
  const handleClick = reactExports.useCallback(() => {
    onSelect(pattern.id);
  }, [pattern.id, onSelect]);
  const samplePreview = pattern.sampleElements.slice(0, 2).join(" | ");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: handleClick,
      className: [
        "relative w-full text-left flex flex-col gap-2 p-3 rounded-lg border transition-all duration-200",
        "hover:bg-accent-primary/5 active:scale-[0.99]",
        isSelected ? "border-accent-primary bg-accent-primary/5" : "border-forge-border bg-forge-bg-secondary hover:border-accent-primary/30"
      ].join(" "),
      style: isSelected ? { boxShadow: "0 0 12px rgba(16, 185, 129, 0.15), inset 0 0 0 1px rgba(16, 185, 129, 0.1)" } : void 0,
      "aria-pressed": isSelected,
      children: [
        isTopSuggestion && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white animate-float-badge",
            style: {
              background: "linear-gradient(135deg, #10B981, #14B8A6)",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
            },
            children: "Quick Extract"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg flex-shrink-0", children: icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-forge-text truncate", children: label }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "span",
                {
                  className: "inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums",
                  style: {
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "#10B981"
                  },
                  children: [
                    pattern.itemCount,
                    " items"
                  ]
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ConfidenceBar, { value: pattern.confidence }) })
          ] }),
          isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-shrink-0 w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "white", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) }) })
        ] }),
        samplePreview && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-forge-text-muted font-mono truncate pl-7 -mt-0.5", children: samplePreview })
      ]
    }
  );
};
const ScanSkeleton = () => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
  [0, 1, 2].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex items-center gap-3 p-3 rounded-lg border border-forge-border bg-forge-bg-secondary animate-pulse",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-lg bg-forge-bg-tertiary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-24 rounded bg-forge-bg-tertiary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 w-full rounded-full bg-forge-bg-tertiary" })
        ] })
      ]
    },
    i
  )),
  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2 py-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-forge-text-muted", children: "Analyzing page structure..." })
  ] })
] });
const DetectionSuggestions = ({
  patterns,
  selectedPatternId,
  onSelectPattern,
  isScanning,
  className = ""
}) => {
  const sortedPatterns = [...patterns].sort((a, b) => b.confidence - a.confidence);
  if (isScanning) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ScanSkeleton, {}) });
  }
  if (patterns.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex flex-col items-center gap-2 py-6 ${className}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-forge-bg-tertiary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-forge-text-muted", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "8" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-forge-text-muted text-center", children: [
        "No patterns detected yet.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "Activate selection mode to scan the page."
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex flex-col gap-2 ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "Detected Patterns" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-forge-text-muted tabular-nums", children: [
        patterns.length,
        " found"
      ] })
    ] }),
    sortedPatterns.map((pattern, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      PatternCard,
      {
        pattern,
        isSelected: pattern.id === selectedPatternId,
        isTopSuggestion: idx === 0,
        onSelect: onSelectPattern
      },
      pattern.id
    ))
  ] });
};
const DetectionSuggestions$1 = React$2.memo(DetectionSuggestions);

const SelectListStep = ({ onNext }) => {
  const selectionMode = useStore((s) => s.selectionMode);
  const setSelectionMode = useStore((s) => s.setSelectionMode);
  const detectedPatterns = useStore((s) => s.detectedPatterns);
  const setDetectedPatterns = useStore((s) => s.setDetectedPatterns);
  const selectedPatternId = useStore((s) => s.selectedPatternId);
  const selectPattern = useStore((s) => s.selectPattern);
  const selectorPath = useStore((s) => s.selectorPath);
  const setSelectorPath = useStore((s) => s.setSelectorPath);
  const manualSelector = useStore((s) => s.manualSelector);
  const setManualSelector = useStore((s) => s.setManualSelector);
  const matchCount = useStore((s) => s.matchCount);
  const setMatchCount = useStore((s) => s.setMatchCount);
  const isScanning = useStore((s) => s.isScanning);
  const setIsScanning = useStore((s) => s.setIsScanning);
  const setError = useStore((s) => s.setError);
  const [editingSelector, setEditingSelector] = reactExports.useState(false);
  const [selectorDraft, setSelectorDraft] = reactExports.useState(manualSelector);
  reactExports.useEffect(() => {
    setSelectorDraft(manualSelector);
  }, [manualSelector]);
  const handleActivateSelection = reactExports.useCallback(async () => {
    try {
      setIsScanning(true);
      setSelectionMode(true);
      const tab = await getActiveTab();
      if (!tab?.id) {
        setError("No active tab found");
        setIsScanning(false);
        return;
      }
      await sendTabMessage(tab.id, {
        type: "ACTIVATE_SELECTION_MODE",
        tool: "list-extractor"
      });
      const response = await sendTabMessage(tab.id, { type: "SCAN_PAGE" });
      if (response && "patterns" in response) {
        setDetectedPatterns(response.patterns);
        const firstPattern = response.patterns[0];
        if (firstPattern) {
          buildSelectorPath(firstPattern.selector);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate selection mode");
    } finally {
      setIsScanning(false);
    }
  }, [setIsScanning, setSelectionMode, setDetectedPatterns, setError]);
  const handleDeactivateSelection = reactExports.useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        await sendTabMessage(tab.id, { type: "DEACTIVATE_SELECTION_MODE" });
        await sendTabMessage(tab.id, { type: "CLEAR_HIGHLIGHTS" });
      }
    } catch {
    }
    setSelectionMode(false);
  }, [setSelectionMode]);
  const handleSelectPattern = reactExports.useCallback(
    async (id) => {
      selectPattern(id);
      const pattern = detectedPatterns.find((p) => p.id === id);
      if (!pattern) return;
      setMatchCount(pattern.itemCount);
      setManualSelector(pattern.selector);
      buildSelectorPath(pattern.selector);
      try {
        const tab = await getActiveTab();
        if (tab?.id) {
          await sendTabMessage(tab.id, {
            type: "SELECT_PATTERN",
            patternId: id
          });
          await sendTabMessage(tab.id, {
            type: "HIGHLIGHT_ELEMENTS",
            selector: pattern.selector
          });
        }
      } catch {
      }
    },
    [selectPattern, detectedPatterns, setMatchCount, setManualSelector]
  );
  const handleBroaden = reactExports.useCallback(async () => {
    if (!selectorPath || selectorPath.segments.length <= 1) return;
    const newSegments = selectorPath.segments.slice(0, -1);
    const newSelector = newSegments.map((s) => s.selector).join(" > ");
    setSelectorPath({ segments: newSegments, fullSelector: newSelector });
    setManualSelector(newSelector);
    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        const result = await sendTabMessage(tab.id, {
          type: "TEST_SELECTOR",
          selector: newSelector
        });
        if (result && "matchCount" in result) {
          setMatchCount(result.matchCount);
        }
        await sendTabMessage(tab.id, { type: "HIGHLIGHT_ELEMENTS", selector: newSelector });
      }
    } catch {
    }
  }, [selectorPath, setSelectorPath, setManualSelector, setMatchCount]);
  const handleNarrow = reactExports.useCallback(async () => {
    if (!manualSelector) return;
    const refinedSelector = manualSelector.includes(":first-child") ? manualSelector : `${manualSelector} > *`;
    setManualSelector(refinedSelector);
    buildSelectorPath(refinedSelector);
    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        const result = await sendTabMessage(tab.id, {
          type: "TEST_SELECTOR",
          selector: refinedSelector
        });
        if (result && "matchCount" in result) {
          setMatchCount(result.matchCount);
        }
        await sendTabMessage(tab.id, { type: "HIGHLIGHT_ELEMENTS", selector: refinedSelector });
      }
    } catch {
    }
  }, [manualSelector, setManualSelector, setMatchCount]);
  const handleSelectorSubmit = reactExports.useCallback(async () => {
    const trimmed = selectorDraft.trim();
    if (!trimmed) return;
    setManualSelector(trimmed);
    setEditingSelector(false);
    buildSelectorPath(trimmed);
    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        const result = await sendTabMessage(tab.id, {
          type: "TEST_SELECTOR",
          selector: trimmed
        });
        if (result && "matchCount" in result) {
          setMatchCount(result.matchCount);
        }
        await sendTabMessage(tab.id, { type: "HIGHLIGHT_ELEMENTS", selector: trimmed });
      }
    } catch (err) {
      setError("Invalid selector or no matches found");
    }
  }, [selectorDraft, setManualSelector, setMatchCount, setError]);
  const handleSelectorKeyDown = reactExports.useCallback(
    (e) => {
      if (e.key === "Enter") handleSelectorSubmit();
      if (e.key === "Escape") {
        setSelectorDraft(manualSelector);
        setEditingSelector(false);
      }
    },
    [handleSelectorSubmit, manualSelector]
  );
  const handleSegmentClick = reactExports.useCallback(
    async (segmentIndex) => {
      if (!selectorPath) return;
      const newSegments = selectorPath.segments.slice(0, segmentIndex + 1);
      const newSelector = newSegments.map((s) => s.selector).join(" > ");
      setSelectorPath({ segments: newSegments, fullSelector: newSelector });
      setManualSelector(newSelector);
      try {
        const tab = await getActiveTab();
        if (tab?.id) {
          const result = await sendTabMessage(tab.id, {
            type: "TEST_SELECTOR",
            selector: newSelector
          });
          if (result && "matchCount" in result) {
            setMatchCount(result.matchCount);
          }
          await sendTabMessage(tab.id, { type: "HIGHLIGHT_ELEMENTS", selector: newSelector });
        }
      } catch {
      }
    },
    [selectorPath, setSelectorPath, setManualSelector, setMatchCount]
  );
  function buildSelectorPath(selector) {
    const parts = selector.split(/\s*>\s*/).filter(Boolean);
    const segments = parts.map((part, idx) => {
      const tagMatch = part.match(/^([a-zA-Z][a-zA-Z0-9-]*)?/);
      const tag = tagMatch?.[1] ?? "div";
      const idMatch = part.match(/#([a-zA-Z0-9_-]+)/);
      const classMatches = [...part.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
      return {
        tag,
        classes: classMatches,
        id: idMatch?.[1],
        index: idx,
        selector: part
      };
    });
    setSelectorPath({ segments, fullSelector: selector });
  }
  const canProceed = selectedPatternId !== null && matchCount > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 animate-fade-in", children: [
    !selectionMode ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: handleActivateSelection,
        disabled: isScanning,
        className: "flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
        style: {
          background: "linear-gradient(135deg, #10B981, #14B8A6)",
          boxShadow: "0 0 20px rgba(16, 185, 129, 0.25), 0 2px 8px rgba(0, 0, 0, 0.2)"
        },
        children: isScanning ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" }),
          "Scanning Page..."
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "svg",
            {
              width: "16",
              height: "16",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              "aria-hidden": "true",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "6" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "2" })
              ]
            }
          ),
          "Activate Selection Mode"
        ] })
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: handleDeactivateSelection,
        className: "flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-semibold text-accent-primary border border-accent-primary/40 bg-accent-primary/5 hover:bg-accent-primary/10 transition-all duration-200 active:scale-[0.98]",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "svg",
            {
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              "aria-hidden": "true",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
              ]
            }
          ),
          "Deactivate Selection Mode"
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DetectionSuggestions$1,
      {
        patterns: detectedPatterns,
        selectedPatternId,
        onSelectPattern: handleSelectPattern,
        isScanning
      }
    ),
    selectedPatternId && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 animate-slide-in-up", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "Refine Selection" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-1 ml-auto", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleBroaden,
              className: "flex items-center justify-center w-7 h-7 rounded-md border border-forge-border text-forge-text-secondary hover:border-accent-primary/40 hover:text-accent-primary hover:bg-accent-primary/5 transition-all duration-150 active:scale-95",
              title: "Broaden selection (go up)",
              "aria-label": "Broaden selection",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "18 15 12 9 6 15" }) })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleNarrow,
              className: "flex items-center justify-center w-7 h-7 rounded-md border border-forge-border text-forge-text-secondary hover:border-accent-primary/40 hover:text-accent-primary hover:bg-accent-primary/5 transition-all duration-150 active:scale-95",
              title: "Narrow selection (go down)",
              "aria-label": "Narrow selection",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "6 9 12 15 18 9" }) })
            }
          )
        ] })
      ] }),
      selectorPath && selectorPath.segments.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 flex-wrap px-3 py-2 rounded-lg bg-forge-bg-tertiary/50 border border-forge-border overflow-x-auto", children: selectorPath.segments.map((segment, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(React$2.Fragment, { children: [
        idx > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-forge-text-muted text-[10px] mx-0.5", "aria-hidden": "true", children: "›" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleSegmentClick(idx),
            className: [
              "text-[11px] font-mono px-1.5 py-0.5 rounded transition-colors duration-150",
              idx === selectorPath.segments.length - 1 ? "bg-accent-primary/15 text-accent-primary font-semibold" : "text-forge-text-secondary hover:text-accent-primary hover:bg-accent-primary/5"
            ].join(" "),
            title: segment.selector,
            children: [
              segment.tag,
              segment.id && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-status-info", children: [
                "#",
                segment.id
              ] }),
              segment.classes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-accent-tertiary", children: [
                ".",
                segment.classes[0],
                segment.classes.length > 1 && `+${segment.classes.length - 1}`
              ] })
            ]
          }
        )
      ] }, idx)) }),
      matchCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-accent-primary/5 border border-accent-primary/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex-shrink-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-accent-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 w-2 h-2 rounded-full bg-accent-primary animate-ping opacity-75" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-semibold text-accent-primary", children: [
          matchCount,
          " items selected"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: editingSelector ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: selectorDraft,
            onChange: (e) => setSelectorDraft(e.target.value),
            onKeyDown: handleSelectorKeyDown,
            onBlur: () => {
              setSelectorDraft(manualSelector);
              setEditingSelector(false);
            },
            className: "flex-1 bg-forge-bg-tertiary border border-accent-primary/40 rounded-md px-3 py-1.5 text-xs font-mono text-forge-text outline-none focus:ring-1 focus:ring-accent-primary/50 placeholder-forge-text-muted",
            placeholder: "Enter CSS selector...",
            autoFocus: true
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onMouseDown: (e) => {
              e.preventDefault();
              handleSelectorSubmit();
            },
            className: "flex-shrink-0 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-accent-primary hover:brightness-110 transition-all",
            children: "Apply"
          }
        )
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => setEditingSelector(true),
          className: "flex items-center gap-1.5 text-[10px] text-forge-text-muted hover:text-accent-primary transition-colors",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })
            ] }),
            "Edit CSS selector manually"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: onNext,
        disabled: !canProceed,
        className: "flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
        style: canProceed ? {
          background: "linear-gradient(135deg, #10B981, #14B8A6)",
          color: "white",
          boxShadow: "0 0 16px rgba(16, 185, 129, 0.2)"
        } : {
          background: "rgba(16, 185, 129, 0.1)",
          color: "rgba(16, 185, 129, 0.4)"
        },
        children: [
          "Next: Configure Columns",
          /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "9 18 15 12 9 6" }) })
        ]
      }
    )
  ] });
};
const SelectListStep$1 = React$2.memo(SelectListStep);

const TYPE_ICONS = {
  text: { emoji: "🏷️", color: "#10B981" },
  // tag
  price: { emoji: "💰", color: "#F59E0B" },
  // money bag
  url: { emoji: "🔗", color: "#8B5CF6" },
  // link
  image: { emoji: "🖼️", color: "#EC4899" },
  // picture
  rating: { emoji: "⭐", color: "#F59E0B" },
  // star
  email: { emoji: "📧", color: "#3B82F6" },
  // email
  date: { emoji: "📅", color: "#14B8A6" },
  // calendar
  number: { emoji: "📝", color: "#6366F1" },
  // memo (description)
  phone: { emoji: "📞", color: "#10B981" },
  // phone
  location: { emoji: "📍", color: "#EF4444" }
  // pin
};
const ColumnChip = ({
  field,
  onToggle,
  onRename,
  onRemove,
  index,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragOver = false
}) => {
  const [isEditing, setIsEditing] = reactExports.useState(false);
  const [editValue, setEditValue] = reactExports.useState(field.name);
  const inputRef = reactExports.useRef(null);
  const typeInfo = TYPE_ICONS[field.dataType] ?? TYPE_ICONS.text;
  const samplePreview = field.sampleValues[0] ?? "--";
  reactExports.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  const handleNameClick = reactExports.useCallback(() => {
    if (field.enabled) {
      setEditValue(field.name);
      setIsEditing(true);
    }
  }, [field.enabled, field.name]);
  const commitRename = reactExports.useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== field.name) {
      onRename(field.id, trimmed);
    } else {
      setEditValue(field.name);
    }
    setIsEditing(false);
  }, [editValue, field.id, field.name, onRename]);
  const handleKeyDown = reactExports.useCallback(
    (e) => {
      if (e.key === "Enter") {
        commitRename();
      } else if (e.key === "Escape") {
        setEditValue(field.name);
        setIsEditing(false);
      }
    },
    [commitRename, field.name]
  );
  const handleToggle = reactExports.useCallback(() => {
    onToggle(field.id);
  }, [field.id, onToggle]);
  const handleRemove = reactExports.useCallback(
    (e) => {
      e.stopPropagation();
      onRemove(field.id);
    },
    [field.id, onRemove]
  );
  const handleDragStart = reactExports.useCallback(
    (e) => {
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", String(index));
      onDragStart?.(index);
    },
    [index, onDragStart]
  );
  const handleDragEnter = reactExports.useCallback(
    (e) => {
      e.preventDefault();
      onDragEnter?.(index);
    },
    [index, onDragEnter]
  );
  const handleDragOver = reactExports.useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: [
        "group flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-all duration-200",
        "cursor-default select-none",
        field.enabled ? "bg-forge-bg-secondary border-forge-border hover:border-accent-primary/40" : "bg-forge-bg-secondary/50 border-forge-border/50 opacity-60",
        isDragOver ? "border-accent-primary/60 bg-accent-primary/5 scale-[1.02]" : ""
      ].join(" "),
      draggable: true,
      onDragStart: handleDragStart,
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDragEnd,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex flex-col gap-0.5 cursor-grab active:cursor-grabbing opacity-40 group-hover:opacity-70 transition-opacity",
            "aria-hidden": "true",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 rounded-full bg-forge-text-muted" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 rounded-full bg-forge-text-muted" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 rounded-full bg-forge-text-muted" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 rounded-full bg-forge-text-muted" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-0.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 rounded-full bg-forge-text-muted" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-1 h-1 rounded-full bg-forge-text-muted" })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: "text-sm flex-shrink-0",
            title: field.dataType,
            "aria-label": `Type: ${field.dataType}`,
            children: typeInfo.emoji
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 flex flex-col gap-0.5", children: [
          isEditing ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              ref: inputRef,
              type: "text",
              value: editValue,
              onChange: (e) => setEditValue(e.target.value),
              onBlur: commitRename,
              onKeyDown: handleKeyDown,
              className: "w-full bg-forge-bg-tertiary border border-accent-primary/50 rounded px-1.5 py-0.5 text-xs font-medium text-forge-text outline-none focus:ring-1 focus:ring-accent-primary/40",
              maxLength: 40,
              "aria-label": "Field name"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleNameClick,
              className: "text-left text-xs font-medium text-forge-text truncate hover:text-accent-primary transition-colors",
              title: "Click to rename",
              children: field.name
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-forge-text-muted truncate font-mono", children: samplePreview.length > 30 ? samplePreview.slice(0, 30) + "..." : samplePreview })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleRemove,
            className: "flex-shrink-0 w-5 h-5 flex items-center justify-center rounded text-forge-text-muted hover:text-status-error hover:bg-status-error/10 transition-all opacity-0 group-hover:opacity-100",
            title: "Remove field",
            "aria-label": `Remove ${field.name}`,
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
            ] })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            role: "switch",
            "aria-checked": field.enabled,
            "aria-label": `Toggle ${field.name}`,
            onClick: handleToggle,
            className: [
              "relative flex-shrink-0 w-8 h-[18px] rounded-full transition-colors duration-200",
              field.enabled ? "bg-accent-primary" : "bg-forge-border"
            ].join(" "),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: [
                  "absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform duration-200",
                  field.enabled ? "translate-x-[16px]" : "translate-x-[2px]"
                ].join(" ")
              }
            )
          }
        )
      ]
    }
  );
};
const ColumnChip$1 = React$2.memo(ColumnChip);

const ColumnMapper = ({ onNext, onBack }) => {
  const fields = useStore((s) => s.fields);
  const toggleField = useStore((s) => s.toggleField);
  const renameField = useStore((s) => s.renameField);
  const removeField = useStore((s) => s.removeField);
  const reorderFields = useStore((s) => s.reorderFields);
  const addCustomField = useStore((s) => s.addCustomField);
  const setError = useStore((s) => s.setError);
  const [dragFromIndex, setDragFromIndex] = reactExports.useState(null);
  const [dragOverIndex, setDragOverIndex] = reactExports.useState(null);
  const [addingCustom, setAddingCustom] = reactExports.useState(false);
  const enabledFields = reactExports.useMemo(() => fields.filter((f) => f.enabled), [fields]);
  const handleDragStart = reactExports.useCallback((index) => {
    setDragFromIndex(index);
  }, []);
  const handleDragEnter = reactExports.useCallback((index) => {
    setDragOverIndex(index);
  }, []);
  const handleDragEnd = reactExports.useCallback(() => {
    if (dragFromIndex !== null && dragOverIndex !== null && dragFromIndex !== dragOverIndex) {
      reorderFields(dragFromIndex, dragOverIndex);
    }
    setDragFromIndex(null);
    setDragOverIndex(null);
  }, [dragFromIndex, dragOverIndex, reorderFields]);
  const handleAddCustomField = reactExports.useCallback(async () => {
    setAddingCustom(true);
    try {
      const tab = await getActiveTab();
      if (!tab?.id) {
        setError("No active tab found");
        setAddingCustom(false);
        return;
      }
      await sendTabMessage(tab.id, {
        type: "ACTIVATE_SELECTION_MODE",
        tool: "list-extractor-field"
      });
      const handleMessage = (message) => {
        const msg = message;
        if (msg.type === "ELEMENT_CLICKED") {
          const newField = {
            id: generatePrefixedId("fld"),
            name: "Custom Field",
            relativeSelector: msg.selector ?? "",
            sampleValues: [],
            dataType: "text",
            confidence: 1,
            enabled: true
          };
          addCustomField(newField);
          setAddingCustom(false);
          chrome.runtime.onMessage.removeListener(handleMessage);
        }
      };
      chrome.runtime.onMessage.addListener(handleMessage);
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(handleMessage);
        setAddingCustom(false);
      }, 3e4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add custom field");
      setAddingCustom(false);
    }
  }, [addCustomField, setError]);
  const previewRows = reactExports.useMemo(() => {
    if (enabledFields.length === 0) return [];
    const maxRows = Math.min(
      5,
      Math.max(...enabledFields.map((f) => f.sampleValues.length), 0)
    );
    return Array.from(
      { length: maxRows },
      (_, rowIdx) => enabledFields.reduce(
        (acc, field) => {
          acc[field.id] = field.sampleValues[rowIdx] ?? "--";
          return acc;
        },
        {}
      )
    );
  }, [enabledFields]);
  const canProceed = enabledFields.length > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 animate-fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-forge-text", children: "Configure Columns" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-forge-text-muted mt-0.5", children: "Toggle, rename, and reorder the fields to extract" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] tabular-nums text-forge-text-muted px-2 py-1 rounded-full bg-forge-bg-tertiary", children: [
        enabledFields.length,
        "/",
        fields.length,
        " enabled"
      ] })
    ] }),
    fields.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2 py-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-full bg-forge-bg-tertiary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-forge-text-muted", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "21", x2: "9", y2: "9" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-forge-text-muted text-center", children: [
        "No fields detected.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "Go back and select a pattern first."
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-1.5", children: fields.map((field, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      ColumnChip$1,
      {
        field,
        index: idx,
        onToggle: toggleField,
        onRename: renameField,
        onRemove: removeField,
        onDragStart: handleDragStart,
        onDragEnter: handleDragEnter,
        onDragEnd: handleDragEnd,
        isDragOver: dragOverIndex === idx && dragFromIndex !== idx
      },
      field.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        onClick: handleAddCustomField,
        disabled: addingCustom,
        className: "flex items-center justify-center gap-1.5 w-full py-2 rounded-lg border border-dashed border-forge-border text-xs font-medium text-forge-text-muted hover:text-accent-primary hover:border-accent-primary/40 hover:bg-accent-primary/5 transition-all duration-200 disabled:opacity-50",
        children: addingCustom ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-3.5 h-3.5 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" }),
          "Click an element on the page..."
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "5", y1: "12", x2: "19", y2: "12" })
          ] }),
          "Add Custom Field"
        ] })
      }
    ),
    previewRows.length > 0 && enabledFields.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: [
        "Preview (",
        previewRows.length,
        " rows)"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto rounded-lg border border-forge-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-[10px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { className: "bg-forge-bg-tertiary/50", children: enabledFields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "th",
          {
            className: "px-2 py-1.5 text-left font-semibold text-forge-text-muted uppercase tracking-wider whitespace-nowrap",
            children: field.name
          },
          field.id
        )) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: previewRows.map((row, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "tr",
          {
            className: "border-t border-forge-border/50 hover:bg-forge-bg-secondary/50",
            children: enabledFields.map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "td",
              {
                className: "px-2 py-1 text-forge-text-secondary font-mono whitespace-nowrap truncate max-w-[120px]",
                children: row[field.id]?.length > 30 ? row[field.id].slice(0, 30) + "..." : row[field.id]
              },
              field.id
            ))
          },
          idx
        )) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: onBack,
          className: "flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg text-xs font-semibold text-forge-text-secondary border border-forge-border hover:border-accent-primary/30 hover:text-forge-text hover:bg-forge-bg-tertiary/40 transition-all duration-200 active:scale-[0.98]",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "15 18 9 12 15 6" }) }),
            "Back"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: onNext,
          disabled: !canProceed,
          className: "flex items-center justify-center gap-2 flex-[2] py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
          style: canProceed ? {
            background: "linear-gradient(135deg, #10B981, #14B8A6)",
            color: "white",
            boxShadow: "0 0 16px rgba(16, 185, 129, 0.2)"
          } : {
            background: "rgba(16, 185, 129, 0.1)",
            color: "rgba(16, 185, 129, 0.4)"
          },
          children: [
            "Next: Pagination",
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "9 18 15 12 9 6" }) })
          ]
        }
      )
    ] })
  ] });
};
const ColumnMapper$1 = React$2.memo(ColumnMapper);

const MODE_INFO = {
  "auto-scroll": {
    icon: "⇵",
    // up-down arrow
    name: "Auto-Scroll",
    description: "Scroll down to load more content automatically"
  },
  "click-next": {
    icon: "➡️",
    // right arrow
    name: "Click Next",
    description: 'Click "Next" button to navigate between pages'
  },
  "url-pattern": {
    icon: "🔗",
    // link
    name: "URL Pattern",
    description: "Iterate through sequential page URLs"
  },
  "load-more": {
    icon: "➕",
    // plus
    name: "Load More",
    description: 'Click "Load More" button to append content'
  },
  "api-intercept": {
    icon: "⚡",
    // lightning
    name: "API Intercept",
    description: "Intercept API requests for data pagination"
  },
  "manual-urls": {
    icon: "📋",
    // clipboard
    name: "Manual URLs",
    description: "Provide a list of URLs to scrape"
  }
};
const ConfidenceMeter = ({ value }) => {
  const pct = Math.round(value * 100);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 h-1 rounded-full bg-forge-border overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "h-full rounded-full transition-all duration-500",
        style: {
          width: `${pct}%`,
          background: pct >= 70 ? "linear-gradient(90deg, #10B981, #14B8A6)" : pct >= 40 ? "#F59E0B" : "#EF4444"
        }
      }
    ) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] tabular-nums font-medium text-forge-text-muted w-7 text-right", children: [
      pct,
      "%"
    ] })
  ] });
};
const PaginationModeCard = ({
  mode,
  config,
  isRecommended,
  isSelected,
  onClick
}) => {
  const info = MODE_INFO[mode];
  const confidence = config?.confidence ?? 0;
  const handleClick = reactExports.useCallback(() => {
    onClick(mode);
  }, [mode, onClick]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: handleClick,
      className: [
        "relative w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all duration-200",
        "hover:bg-accent-primary/5 active:scale-[0.99]",
        isSelected ? "border-accent-primary bg-accent-primary/5" : "border-forge-border bg-forge-bg-secondary hover:border-accent-primary/30"
      ].join(" "),
      style: isSelected ? {
        boxShadow: "0 0 16px rgba(16, 185, 129, 0.15), inset 0 0 0 1px rgba(16, 185, 129, 0.1)"
      } : void 0,
      "aria-pressed": isSelected,
      children: [
        isRecommended && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white",
            style: {
              background: "linear-gradient(135deg, #10B981, #14B8A6)",
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)"
            },
            children: "Recommended"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: [
              "flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg",
              isSelected ? "bg-accent-primary/15" : "bg-forge-bg-tertiary"
            ].join(" "),
            children: info.icon
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 flex flex-col gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-forge-text", children: info.name }),
            isSelected && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 rounded-full bg-accent-primary flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "svg",
              {
                width: "10",
                height: "10",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "white",
                strokeWidth: "3",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                "aria-hidden": "true",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" })
              }
            ) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-forge-text-muted leading-snug", children: info.description }),
          confidence > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ConfidenceMeter, { value: confidence }) })
        ] })
      ]
    }
  );
};
const PaginationModeCard$1 = React$2.memo(PaginationModeCard);

const ALL_MODES = [
  "auto-scroll",
  "click-next",
  "url-pattern",
  "load-more",
  "api-intercept",
  "manual-urls"
];
function estimateTime(config, matchCount) {
  const pages = config.maxPages;
  const delay = config.delayMs / 1e3;
  let seconds;
  switch (config.mode) {
    case "auto-scroll":
      seconds = pages * (delay + 2);
      break;
    case "click-next":
    case "load-more":
      seconds = pages * (delay + 1.5);
      break;
    case "url-pattern":
      seconds = pages * (delay + 3);
      break;
    case "api-intercept":
      seconds = pages * (delay + 0.5);
      break;
    case "manual-urls":
      seconds = (config.manualUrls?.length ?? 1) * (delay + 3);
      break;
    default:
      seconds = pages * delay;
  }
  if (seconds < 60) return `~${Math.ceil(seconds)}s`;
  const mins = Math.ceil(seconds / 60);
  return `~${mins}m`;
}
const PaginationConfig = ({ onNext, onBack }) => {
  const detectedConfigs = useStore((s) => s.detectedPaginationConfigs);
  const setDetectedConfigs = useStore((s) => s.setDetectedPaginationConfigs);
  const selectedMode = useStore((s) => s.selectedPaginationMode);
  const selectMode = useStore((s) => s.selectPaginationMode);
  const paginationConfig = useStore((s) => s.paginationConfig);
  const updateConfig = useStore((s) => s.updatePaginationConfig);
  const matchCount = useStore((s) => s.matchCount);
  const setError = useStore((s) => s.setError);
  const [detectingPagination, setDetectingPagination] = reactExports.useState(false);
  const [manualUrlText, setManualUrlText] = reactExports.useState(
    paginationConfig.manualUrls?.join("\n") ?? ""
  );
  reactExports.useEffect(() => {
    if (detectedConfigs.length > 0) return;
    const detect = async () => {
      setDetectingPagination(true);
      try {
        const tab = await getActiveTab();
        if (!tab?.id) return;
        const result = await sendTabMessage(tab.id, { type: "DETECT_PAGINATION" });
        if (result && "configs" in result) {
          const configs = result.configs;
          setDetectedConfigs(configs);
          if (configs.length > 0) {
            const best = [...configs].sort((a, b) => b.confidence - a.confidence)[0];
            selectMode(best.mode);
          }
        }
      } catch {
      } finally {
        setDetectingPagination(false);
      }
    };
    detect();
  }, []);
  const configByMode = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    detectedConfigs.forEach((c) => map.set(c.mode, c));
    return map;
  }, [detectedConfigs]);
  const recommendedMode = reactExports.useMemo(() => {
    if (detectedConfigs.length === 0) return null;
    return [...detectedConfigs].sort((a, b) => b.confidence - a.confidence)[0].mode;
  }, [detectedConfigs]);
  const orderedModes = reactExports.useMemo(() => {
    const detected = detectedConfigs.map((c) => c.mode);
    const remaining = ALL_MODES.filter((m) => !detected.includes(m));
    return [...detected, ...remaining];
  }, [detectedConfigs]);
  const handleSelectClickTarget = reactExports.useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (!tab?.id) return;
      await sendTabMessage(tab.id, {
        type: "ACTIVATE_SELECTION_MODE",
        tool: "list-extractor-pagination"
      });
      const handleMessage = (message) => {
        const msg = message;
        if (msg.type === "ELEMENT_CLICKED") {
          updateConfig({ selector: msg.selector ?? "" });
          chrome.runtime.onMessage.removeListener(handleMessage);
        }
      };
      chrome.runtime.onMessage.addListener(handleMessage);
      setTimeout(() => {
        chrome.runtime.onMessage.removeListener(handleMessage);
      }, 3e4);
    } catch (err) {
      setError("Failed to select pagination element");
    }
  }, [updateConfig, setError]);
  const handleManualUrlsChange = reactExports.useCallback(
    (e) => {
      setManualUrlText(e.target.value);
      const urls = e.target.value.split("\n").map((u) => u.trim()).filter((u) => u.length > 0);
      updateConfig({ manualUrls: urls, maxPages: urls.length || 1 });
    },
    [updateConfig]
  );
  const estimatedTime = reactExports.useMemo(
    () => estimateTime(paginationConfig),
    [paginationConfig, matchCount]
  );
  const canProceed = selectedMode !== null;
  const renderModeOptions = () => {
    if (!selectedMode) return null;
    switch (selectedMode) {
      case "auto-scroll":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 animate-fade-in", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "Scroll Speed" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-forge-text-muted w-8", children: "Slow" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "range",
                  min: 0,
                  max: 2,
                  step: 1,
                  value: paginationConfig.scrollSpeed === "slow" ? 0 : paginationConfig.scrollSpeed === "medium" ? 1 : 2,
                  onChange: (e) => {
                    const val = Number(e.target.value);
                    const speed = val === 0 ? "slow" : val === 1 ? "medium" : "fast";
                    updateConfig({ scrollSpeed: speed });
                  },
                  className: "flex-1 accent-[#10B981] h-1.5"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-forge-text-muted w-8 text-right", children: "Fast" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "Max Scrolls" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: 1,
                max: 100,
                value: paginationConfig.maxPages,
                onChange: (e) => updateConfig({ maxPages: Number(e.target.value) || 1 }),
                className: "w-16 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "Wait (ms)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: 200,
                max: 1e4,
                step: 100,
                value: paginationConfig.delayMs,
                onChange: (e) => updateConfig({ delayMs: Number(e.target.value) || 1e3 }),
                className: "w-20 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              }
            )
          ] })
        ] });
      case "click-next":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 animate-fade-in", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: '"Next" Button Selector' }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: paginationConfig.selector ?? "",
                  onChange: (e) => updateConfig({ selector: e.target.value }),
                  placeholder: "CSS selector for Next button",
                  className: "flex-1 bg-forge-bg-tertiary border border-forge-border rounded px-2.5 py-1.5 text-xs font-mono text-forge-text outline-none focus:border-accent-primary/50 placeholder-forge-text-muted"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: handleSelectClickTarget,
                  className: "flex-shrink-0 px-2.5 py-1.5 rounded border border-forge-border text-[10px] font-semibold text-forge-text-secondary hover:border-accent-primary/40 hover:text-accent-primary hover:bg-accent-primary/5 transition-all",
                  title: "Click to select on page",
                  children: "Pick"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "Max Pages" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: 1,
                max: 500,
                value: paginationConfig.maxPages,
                onChange: (e) => updateConfig({ maxPages: Number(e.target.value) || 1 }),
                className: "w-16 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "Delay (ms)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: 200,
                max: 1e4,
                step: 100,
                value: paginationConfig.delayMs,
                onChange: (e) => updateConfig({ delayMs: Number(e.target.value) || 1e3 }),
                className: "w-20 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              }
            )
          ] })
        ] });
      case "url-pattern":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 animate-fade-in", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "URL Pattern" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: paginationConfig.urlPattern ?? "",
                onChange: (e) => updateConfig({ urlPattern: e.target.value }),
                placeholder: "https://example.com/page/{page}",
                className: "w-full bg-forge-bg-tertiary border border-forge-border rounded px-2.5 py-1.5 text-xs font-mono text-forge-text outline-none focus:border-accent-primary/50 placeholder-forge-text-muted"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-forge-text-muted", children: [
              "Use ",
              "{page}",
              " as a placeholder for the page number"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "Max Pages" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: 1,
                max: 500,
                value: paginationConfig.maxPages,
                onChange: (e) => updateConfig({ maxPages: Number(e.target.value) || 1 }),
                className: "w-16 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              }
            )
          ] })
        ] });
      case "load-more":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 animate-fade-in", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: '"Load More" Button Selector' }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: paginationConfig.selector ?? "",
                  onChange: (e) => updateConfig({ selector: e.target.value }),
                  placeholder: "CSS selector for Load More",
                  className: "flex-1 bg-forge-bg-tertiary border border-forge-border rounded px-2.5 py-1.5 text-xs font-mono text-forge-text outline-none focus:border-accent-primary/50 placeholder-forge-text-muted"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: handleSelectClickTarget,
                  className: "flex-shrink-0 px-2.5 py-1.5 rounded border border-forge-border text-[10px] font-semibold text-forge-text-secondary hover:border-accent-primary/40 hover:text-accent-primary hover:bg-accent-primary/5 transition-all",
                  title: "Click to select on page",
                  children: "Pick"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "Max Clicks" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: 1,
                max: 200,
                value: paginationConfig.maxPages,
                onChange: (e) => updateConfig({ maxPages: Number(e.target.value) || 1 }),
                className: "w-16 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              }
            )
          ] })
        ] });
      case "api-intercept":
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 animate-fade-in", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "Detected API Endpoint" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-2 rounded-lg bg-forge-bg-tertiary/50 border border-forge-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-[10px] text-accent-primary font-mono break-all", children: paginationConfig.apiEndpoint || "No endpoint detected yet" }) })
          ] }),
          paginationConfig.apiPageParam && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "Page Parameter" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "text-[10px] font-mono text-accent-secondary", children: paginationConfig.apiPageParam })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "Max Pages" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "number",
                min: 1,
                max: 500,
                value: paginationConfig.maxPages,
                onChange: (e) => updateConfig({ maxPages: Number(e.target.value) || 1 }),
                className: "w-16 bg-forge-bg-tertiary border border-forge-border rounded px-2 py-1 text-xs font-mono text-forge-text text-right outline-none focus:border-accent-primary/50"
              }
            )
          ] })
        ] });
      case "manual-urls":
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-3 animate-fade-in", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted", children: "URLs (one per line)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: manualUrlText,
              onChange: handleManualUrlsChange,
              placeholder: "https://example.com/page/1\nhttps://example.com/page/2\nhttps://example.com/page/3",
              rows: 5,
              className: "w-full bg-forge-bg-tertiary border border-forge-border rounded px-2.5 py-2 text-xs font-mono text-forge-text outline-none focus:border-accent-primary/50 placeholder-forge-text-muted resize-y"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-forge-text-muted tabular-nums", children: [
            paginationConfig.manualUrls?.length ?? 0,
            " URL(s) entered"
          ] })
        ] }) });
      default:
        return null;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 animate-fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-forge-text", children: "Pagination" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-forge-text-muted mt-0.5", children: "Configure how to navigate through multiple pages of data" })
    ] }),
    detectingPagination && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-2 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-forge-text-muted", children: "Detecting pagination..." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-2", children: orderedModes.map((mode) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      PaginationModeCard$1,
      {
        mode,
        config: configByMode.get(mode),
        isRecommended: mode === recommendedMode,
        isSelected: mode === selectedMode,
        onClick: selectMode
      },
      mode
    )) }),
    selectedMode && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "pl-3 border-l-2 border-accent-primary/30", children: renderModeOptions() }),
    selectedMode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-forge-bg-tertiary/50 border border-forge-border", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-forge-text-muted flex-shrink-0", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "12 6 12 12 16 14" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-forge-text-secondary", children: [
        "Estimated time: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-accent-primary", children: estimatedTime })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: onBack,
          className: "flex items-center justify-center gap-1.5 flex-1 py-2.5 rounded-lg text-xs font-semibold text-forge-text-secondary border border-forge-border hover:border-accent-primary/30 hover:text-forge-text hover:bg-forge-bg-tertiary/40 transition-all duration-200 active:scale-[0.98]",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "15 18 9 12 15 6" }) }),
            "Back"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: onNext,
          disabled: !canProceed,
          className: "flex items-center justify-center gap-2 flex-[2] py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
          style: canProceed ? {
            background: "linear-gradient(135deg, #10B981, #14B8A6)",
            color: "white",
            boxShadow: "0 0 16px rgba(16, 185, 129, 0.2)"
          } : {
            background: "rgba(16, 185, 129, 0.1)",
            color: "rgba(16, 185, 129, 0.4)"
          },
          children: [
            "Start Extraction",
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "5 3 19 12 5 21 5 3" }) })
          ]
        }
      )
    ] })
  ] });
};
const PaginationConfig$1 = React$2.memo(PaginationConfig);

const ProgressRing = ({
  value,
  size = 120,
  strokeWidth = 8,
  children,
  className = ""
}) => {
  const gradientId = reactExports.useId();
  const filterId = reactExports.useId();
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - clamped / 100 * circumference;
  const center = size / 2;
  const displayPct = reactExports.useMemo(() => Math.round(clamped), [clamped]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `relative inline-flex items-center justify-center ${className}`,
      style: { width: size, height: size },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "svg",
          {
            width: size,
            height: size,
            viewBox: `0 0 ${size} ${size}`,
            className: "transform -rotate-90",
            "aria-hidden": "true",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("defs", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: gradientId, x1: "0%", y1: "0%", x2: "100%", y2: "0%", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#10B981" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#14B8A6" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("filter", { id: filterId, x: "-50%", y: "-50%", width: "200%", height: "200%", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "3", result: "blur" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("feMerge", { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("feMergeNode", { in: "blur" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("feMergeNode", { in: "SourceGraphic" })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "circle",
                {
                  cx: center,
                  cy: center,
                  r: radius,
                  fill: "none",
                  stroke: "rgba(16, 185, 129, 0.1)",
                  strokeWidth
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "circle",
                {
                  cx: center,
                  cy: center,
                  r: radius,
                  fill: "none",
                  stroke: `url(#${gradientId})`,
                  strokeWidth,
                  strokeLinecap: "round",
                  strokeDasharray: circumference,
                  strokeDashoffset: offset,
                  filter: `url(#${filterId})`,
                  className: "transition-[stroke-dashoffset] duration-500 ease-out"
                }
              )
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-0 rounded-full pointer-events-none animate-pulse-glow",
            style: {
              boxShadow: clamped > 0 ? "0 0 20px rgba(16, 185, 129, 0.15), inset 0 0 20px rgba(16, 185, 129, 0.05)" : "none"
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: children ?? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: "text-2xl font-bold tabular-nums text-accent-primary",
            style: { textShadow: "0 0 12px rgba(16, 185, 129, 0.5)" },
            children: [
              displayPct,
              "%"
            ]
          }
        ) })
      ]
    }
  );
};
const ProgressRing$1 = React$2.memo(ProgressRing);

const MILESTONES = /* @__PURE__ */ new Set([100, 250, 500, 1e3, 2500, 5e3, 1e4]);
const DigitRoller = ({ digit }) => {
  const [prev, setPrev] = reactExports.useState(digit);
  const [rolling, setRolling] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (digit !== prev) {
      setRolling(true);
      const timer = setTimeout(() => {
        setPrev(digit);
        setRolling(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [digit, prev]);
  if (digit === ",") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-block w-[0.35em] text-center text-forge-text-muted", children: "," });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative inline-block w-[0.65em] h-[1.2em] overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        className: [
          "absolute inset-0 flex items-center justify-center transition-transform duration-350 ease-out",
          rolling ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
        ].join(" "),
        style: { transitionDuration: "350ms" },
        "aria-hidden": rolling,
        children: prev
      }
    ),
    rolling && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        className: "absolute inset-0 flex items-center justify-center animate-counter-roll",
        "aria-hidden": !rolling,
        children: digit
      }
    )
  ] });
};
const LiveCounter = ({
  value,
  label = "items extracted",
  className = ""
}) => {
  const wrapperRef = reactExports.useRef(null);
  const prevValueRef = reactExports.useRef(value);
  const [pulse, setPulse] = reactExports.useState(false);
  const formatted = reactExports.useMemo(() => {
    return value.toLocaleString("en-US");
  }, [value]);
  reactExports.useEffect(() => {
    if (MILESTONES.has(value) && value !== prevValueRef.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 600);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value]);
  const digits = formatted.split("");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: wrapperRef,
      className: `flex flex-col items-center gap-1 select-none ${className}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: [
              "flex items-center text-3xl font-bold tabular-nums text-forge-text transition-transform duration-300",
              pulse ? "scale-110" : "scale-100"
            ].join(" "),
            style: { textShadow: "0 0 16px rgba(16, 185, 129, 0.4)" },
            "aria-live": "polite",
            "aria-label": `${value} ${label}`,
            children: digits.map((d, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(DigitRoller, { digit: d }, `${i}-${digits.length}`))
          }
        ),
        pulse && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute w-16 h-16 rounded-full border-2 border-accent-primary/40 animate-shockwave pointer-events-none",
            "aria-hidden": "true"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-forge-text-muted uppercase tracking-wider", children: label })
      ]
    }
  );
};
const LiveCounter$1 = React$2.memo(LiveCounter);

const LiveDataFeed = ({
  rows,
  fields,
  maxVisible = 5,
  className = ""
}) => {
  const [entries, setEntries] = reactExports.useState([]);
  const prevLenRef = reactExports.useRef(0);
  const enabledFields = fields.filter((f) => f.enabled);
  reactExports.useEffect(() => {
    const prevLen = prevLenRef.current;
    const currentLen = rows.length;
    if (currentLen > prevLen) {
      const tail = rows.slice(Math.max(0, currentLen - maxVisible));
      const newIds = new Set(rows.slice(prevLen).map((r) => r.id));
      setEntries(
        tail.map((row) => ({
          row,
          key: row.id,
          isNew: newIds.has(row.id)
        }))
      );
      const timer = setTimeout(() => {
        setEntries(
          (prev) => prev.map((e) => e.isNew ? { ...e, isNew: false } : e)
        );
      }, 600);
      prevLenRef.current = currentLen;
      return () => clearTimeout(timer);
    }
    prevLenRef.current = currentLen;
  }, [rows, maxVisible]);
  const getCellValue = reactExports.useCallback((row, field) => {
    const val = row.data[field.name] ?? row.data[field.id];
    if (val == null) return "--";
    return truncateText(String(val), 28);
  }, []);
  if (entries.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-center text-xs text-forge-text-muted py-4 ${className}`, children: "Waiting for data..." });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `overflow-hidden rounded-lg border border-forge-border ${className}`, children: [
    enabledFields.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2 px-3 py-1.5 bg-forge-bg-tertiary/50 border-b border-forge-border", children: enabledFields.slice(0, 4).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "span",
      {
        className: "flex-1 text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted truncate",
        children: field.name
      },
      field.id
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative", children: entries.map((entry, idx) => {
      const isFirst = idx === 0 && entries.length >= maxVisible;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: [
            "flex items-center gap-2 px-3 py-1.5 border-l-2 transition-all duration-200",
            entry.isNew ? "border-l-accent-primary bg-accent-primary/5 animate-slide-in-right" : "border-l-transparent",
            isFirst ? "opacity-50" : "opacity-100"
          ].join(" "),
          children: enabledFields.slice(0, 4).map((field) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "flex-1 text-xs text-forge-text-secondary truncate font-mono",
              children: getCellValue(entry.row, field)
            },
            field.id
          ))
        },
        entry.key
      );
    }) })
  ] });
};
const LiveDataFeed$1 = React$2.memo(LiveDataFeed);

const SpeedGraph = ({
  data,
  width = 200,
  height = 48,
  className = ""
}) => {
  const gradientId = reactExports.useId();
  const fillGradientId = reactExports.useId();
  const { linePath, areaPath } = reactExports.useMemo(() => {
    if (data.length < 2) {
      return { linePath: "", areaPath: "" };
    }
    const maxSpeed = Math.max(...data.map((d) => d.itemsPerSec), 1);
    const padding = 2;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;
    const points = data.map((entry, i) => {
      const x = padding + i / (data.length - 1) * chartW;
      const y = padding + chartH - entry.itemsPerSec / maxSpeed * chartH;
      return { x, y };
    });
    let line = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      line += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }
    const lastPt = points[points.length - 1];
    const firstPt = points[0];
    const area = `${line} L ${lastPt.x},${height - padding} L ${firstPt.x},${height - padding} Z`;
    return { linePath: line, areaPath: area };
  }, [data, width, height]);
  const currentSpeed = data.length > 0 ? data[data.length - 1].itemsPerSec : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex flex-col gap-1 ${className}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-medium text-forge-text-muted uppercase tracking-wider", children: "Speed" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "span",
        {
          className: "text-xs font-bold tabular-nums text-accent-primary",
          style: { textShadow: "0 0 8px rgba(16, 185, 129, 0.4)" },
          children: [
            currentSpeed.toFixed(1),
            " items/s"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "svg",
      {
        width,
        height,
        viewBox: `0 0 ${width} ${height}`,
        className: "w-full",
        preserveAspectRatio: "none",
        "aria-hidden": "true",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("defs", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: gradientId, x1: "0%", y1: "0%", x2: "100%", y2: "0%", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#10B981" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#14B8A6" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: fillGradientId, x1: "0", y1: "0", x2: "0", y2: "1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "#10B981", stopOpacity: "0.2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "#10B981", stopOpacity: "0" })
            ] })
          ] }),
          areaPath && /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: areaPath, fill: `url(#${fillGradientId})` }),
          linePath && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "path",
            {
              d: linePath,
              fill: "none",
              stroke: `url(#${gradientId})`,
              strokeWidth: "1.5",
              strokeLinecap: "round",
              strokeLinejoin: "round"
            }
          ),
          data.length < 2 && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "text",
            {
              x: width / 2,
              y: height / 2,
              textAnchor: "middle",
              dominantBaseline: "middle",
              fill: "rgba(74, 222, 128, 0.3)",
              fontSize: "10",
              fontFamily: "Inter, sans-serif",
              children: "Collecting data..."
            }
          )
        ]
      }
    )
  ] });
};
const SpeedGraph$1 = React$2.memo(SpeedGraph);

const CONFETTI_COLORS = ["#10B981", "#14B8A6", "#34D399", "#6EE7B7", "#A7F3D0"];
function generateParticles(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * 20,
    // percentage around center
    y: 30 + Math.random() * 10,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 4 + Math.random() * 4,
    delay: Math.random() * 0.3
  }));
}
const AnimatedCheckmark = ({ size = 64 }) => {
  const filterId = reactExports.useId();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 64 64",
      fill: "none",
      className: "mx-auto",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("filter", { id: filterId, x: "-50%", y: "-50%", width: "200%", height: "200%", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("feGaussianBlur", { in: "SourceGraphic", stdDeviation: "2", result: "blur" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("feMerge", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("feMergeNode", { in: "blur" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("feMergeNode", { in: "SourceGraphic" })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "circle",
          {
            cx: "32",
            cy: "32",
            r: "28",
            fill: "rgba(16, 185, 129, 0.1)",
            stroke: "#10B981",
            strokeWidth: "2",
            strokeDasharray: "176",
            strokeDashoffset: "176",
            className: "animate-[drawCircle_0.6s_ease-out_forwards]",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "animate",
              {
                attributeName: "stroke-dashoffset",
                from: "176",
                to: "0",
                dur: "0.6s",
                fill: "freeze",
                calcMode: "spline",
                keySplines: "0.65 0 0.35 1",
                keyTimes: "0;1"
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "path",
          {
            d: "M20 33 L28 41 L44 25",
            stroke: "#10B981",
            strokeWidth: "3.5",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            fill: "none",
            filter: `url(#${filterId})`,
            strokeDasharray: "40",
            strokeDashoffset: "40",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "animate",
              {
                attributeName: "stroke-dashoffset",
                from: "40",
                to: "0",
                dur: "0.4s",
                begin: "0.4s",
                fill: "freeze",
                calcMode: "spline",
                keySplines: "0.65 0 0.35 1",
                keyTimes: "0;1"
              }
            )
          }
        )
      ]
    }
  );
};
const CompletionCard = ({
  summary,
  onOpenDataTable,
  onExport,
  onNewExtraction,
  className = ""
}) => {
  const [showConfetti, setShowConfetti] = reactExports.useState(true);
  const particles = reactExports.useMemo(() => generateParticles(16), []);
  reactExports.useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2e3);
    return () => clearTimeout(timer);
  }, []);
  const stats = reactExports.useMemo(
    () => [
      { label: "Total Items", value: formatNumber(summary.totalItems) },
      { label: "Total Time", value: formatDuration(summary.totalTime / 1e3) },
      { label: "Data Size", value: formatFileSize(summary.dataSize) }
    ],
    [summary]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: `relative flex flex-col items-center gap-5 p-6 rounded-xl bg-forge-bg-secondary border border-forge-border overflow-hidden ${className}`,
      children: [
        showConfetti && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 pointer-events-none overflow-hidden", "aria-hidden": "true", children: particles.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute rounded-sm animate-confetti",
            style: {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
              transform: `rotate(${p.rotation}deg)`
            }
          },
          p.id
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AnimatedCheckmark, { size: 64 }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "h3",
            {
              className: "text-lg font-bold text-forge-text",
              style: { textShadow: "0 0 12px rgba(16, 185, 129, 0.4)" },
              children: "Extraction Complete"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-forge-text-muted mt-1", children: "All data has been extracted successfully" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center gap-4 w-full", children: stats.map((stat) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg bg-forge-bg-tertiary/50",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: "text-base font-bold tabular-nums text-accent-primary",
                  style: { textShadow: "0 0 8px rgba(16, 185, 129, 0.3)" },
                  children: stat.value
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-medium text-forge-text-muted uppercase tracking-wider", children: stat.label })
            ]
          },
          stat.label
        )) }),
        summary.errors > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 text-xs text-status-warning", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
          ] }),
          summary.errors,
          " error",
          summary.errors !== 1 ? "s" : "",
          " encountered"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 w-full mt-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: onOpenDataTable,
              className: "flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]",
              style: {
                background: "linear-gradient(135deg, #10B981, #14B8A6)",
                boxShadow: "0 0 16px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)"
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "15", x2: "21", y2: "15" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "3", x2: "9", y2: "21" })
                ] }),
                "Open Data Table"
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: onExport,
                className: "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-accent-primary border border-forge-border hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all duration-200 active:scale-[0.98]",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "7 10 12 15 17 10" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
                  ] }),
                  "Export"
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: onNewExtraction,
                className: "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-forge-text-secondary hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-all duration-200 active:scale-[0.98]",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "1 4 1 10 7 10" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M3.51 15a9 9 0 1 0 2.13-9.36L1 10" })
                  ] }),
                  "New Extraction"
                ]
              }
            )
          ] })
        ] })
      ]
    }
  );
};
const CompletionCard$1 = React$2.memo(CompletionCard);

const ExtractionProgress = ({
  onViewData,
  onExport,
  onNewExtraction
}) => {
  const extractionStatus = useStore((s) => s.extractionStatus);
  const setExtractionStatus = useStore((s) => s.setExtractionStatus);
  const progress = useStore((s) => s.extractionProgress);
  const updateProgress = useStore((s) => s.updateExtractionProgress);
  const extractedRows = useStore((s) => s.extractedRows);
  const addExtractedRows = useStore((s) => s.addExtractedRows);
  const summary = useStore((s) => s.extractionSummary);
  const setExtractionSummary = useStore((s) => s.setExtractionSummary);
  const speedHistory = useStore((s) => s.speedHistory);
  const addSpeedEntry = useStore((s) => s.addSpeedEntry);
  const fields = useStore((s) => s.fields);
  const buildExtractionConfig = useStore((s) => s.buildExtractionConfig);
  const setError = useStore((s) => s.setError);
  const resetListExtractor = useStore((s) => s.resetListExtractor);
  const startTimeRef = reactExports.useRef(Date.now());
  const timerRef = reactExports.useRef();
  const prevItemsRef = reactExports.useRef(0);
  reactExports.useEffect(() => {
    if (extractionStatus === "idle" || extractionStatus === "configuring") {
      startExtraction();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);
  const startExtraction = reactExports.useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (!tab?.id) {
        setError("No active tab found");
        return;
      }
      const config = buildExtractionConfig();
      setExtractionStatus("running");
      startTimeRef.current = Date.now();
      prevItemsRef.current = 0;
      await sendTabMessage(tab.id, {
        type: "START_EXTRACTION",
        config
      });
      timerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTimeRef.current) / 1e3;
        updateProgress({ elapsed });
        const currentItems = useStore.getState().extractionProgress.items;
        const delta = currentItems - prevItemsRef.current;
        const speed = delta / 1;
        prevItemsRef.current = currentItems;
        const entry = {
          timestamp: Date.now(),
          itemsPerSec: Math.max(0, speed)
        };
        addSpeedEntry(entry);
        updateProgress({ speed });
      }, 1e3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start extraction");
      setExtractionStatus("error");
    }
  }, [buildExtractionConfig, setExtractionStatus, updateProgress, addSpeedEntry, setError]);
  reactExports.useEffect(() => {
    const unsubscribe = onMessage((message) => {
      const msg = message;
      switch (msg.type) {
        case "EXTRACTION_PROGRESS": {
          updateProgress(msg.data);
          break;
        }
        case "EXTRACTION_ROW": {
          addExtractedRows([msg.row]);
          updateProgress({ items: useStore.getState().extractionProgress.items + 1 });
          break;
        }
        case "EXTRACTION_BATCH": {
          addExtractedRows(msg.rows);
          updateProgress({
            items: useStore.getState().extractionProgress.items + msg.rows.length
          });
          break;
        }
        case "EXTRACTION_COMPLETE": {
          setExtractionStatus("completed");
          setExtractionSummary(msg.summary);
          if (timerRef.current) clearInterval(timerRef.current);
          break;
        }
        case "EXTRACTION_ERROR": {
          updateProgress({
            errors: useStore.getState().extractionProgress.errors + 1
          });
          if (!msg.url) {
            setExtractionStatus("error");
            setError(msg.error);
            if (timerRef.current) clearInterval(timerRef.current);
          }
          break;
        }
      }
    });
    return unsubscribe;
  }, [updateProgress, addExtractedRows, setExtractionStatus, setExtractionSummary, setError]);
  const handlePause = reactExports.useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        await sendTabMessage(tab.id, { type: "PAUSE_EXTRACTION" });
      }
      setExtractionStatus("paused");
    } catch {
    }
  }, [setExtractionStatus]);
  const handleResume = reactExports.useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        await sendTabMessage(tab.id, { type: "RESUME_EXTRACTION" });
      }
      setExtractionStatus("running");
    } catch {
    }
  }, [setExtractionStatus]);
  const handleStop = reactExports.useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (tab?.id) {
        await sendTabMessage(tab.id, { type: "STOP_EXTRACTION" });
      }
    } catch {
    }
    if (timerRef.current) clearInterval(timerRef.current);
    const currentProgress = useStore.getState().extractionProgress;
    const summaryFromProgress = {
      totalItems: currentProgress.items,
      totalPages: currentProgress.pages,
      totalTime: currentProgress.elapsed * 1e3,
      avgSpeed: currentProgress.elapsed > 0 ? currentProgress.items / currentProgress.elapsed : 0,
      errors: currentProgress.errors,
      dataSize: JSON.stringify(useStore.getState().extractedRows).length
    };
    setExtractionSummary(summaryFromProgress);
    setExtractionStatus("completed");
  }, [setExtractionStatus, setExtractionSummary]);
  const handleNewExtraction = reactExports.useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    resetListExtractor();
    onNewExtraction();
  }, [resetListExtractor, onNewExtraction]);
  const maxItems = 1e3;
  const progressPct = Math.min(100, progress.items / maxItems * 100);
  if (extractionStatus === "completed" && summary) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      CompletionCard$1,
      {
        summary,
        onOpenDataTable: onViewData,
        onExport,
        onNewExtraction: handleNewExtraction
      }
    );
  }
  const error = useStore((s) => s.error);
  if (extractionStatus === "error") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-4 p-6 animate-fade-in", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-status-error/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "#EF4444", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "9", x2: "15", y2: "15" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-status-error", children: "Extraction Failed" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted mt-1 max-w-[240px]", children: error ?? "An unexpected error occurred during extraction." })
      ] }),
      progress.items > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-forge-text-secondary", children: [
        formatNumber(progress.items),
        " items were extracted before the error."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 w-full", children: [
        progress.items > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: onViewData,
            className: "flex-1 py-2 rounded-lg text-xs font-semibold text-accent-primary border border-accent-primary/30 hover:bg-accent-primary/5 transition-all",
            children: "View Partial Data"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleNewExtraction,
            className: "flex-1 py-2 rounded-lg text-xs font-semibold text-forge-text-secondary border border-forge-border hover:bg-forge-bg-tertiary/40 transition-all",
            children: "Start Over"
          }
        )
      ] })
    ] });
  }
  const isPaused = extractionStatus === "paused";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-5 p-4 animate-fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ProgressRing$1, { value: progressPct, size: 100, strokeWidth: 7 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(LiveCounter$1, { value: progress.items })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2 w-full", children: [
      { label: "Pages", value: formatNumber(progress.pages) },
      { label: "Elapsed", value: formatDuration(progress.elapsed) },
      {
        label: "Remaining",
        value: progress.estimatedRemaining > 0 ? formatDuration(progress.estimatedRemaining) : "--"
      },
      {
        label: "Speed",
        value: `${progress.speed.toFixed(1)}/s`
      },
      { label: "Errors", value: String(progress.errors) },
      {
        label: "Data Size",
        value: formatFileSize(JSON.stringify(extractedRows).length)
      }
    ].map((stat) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-forge-bg-tertiary/40",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "span",
            {
              className: "text-xs font-bold tabular-nums text-forge-text",
              style: { textShadow: "0 0 6px rgba(16, 185, 129, 0.2)" },
              children: stat.value
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-medium text-forge-text-muted uppercase tracking-wider", children: stat.label })
        ]
      },
      stat.label
    )) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SpeedGraph$1, { data: speedHistory, className: "w-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(LiveDataFeed$1, { rows: extractedRows, fields, className: "w-full" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: onViewData,
          disabled: extractedRows.length === 0,
          className: "flex items-center justify-center gap-1.5 flex-[2] py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
          style: {
            background: "linear-gradient(135deg, #10B981, #14B8A6)",
            boxShadow: "0 0 12px rgba(16, 185, 129, 0.2)"
          },
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "3", x2: "9", y2: "21" })
            ] }),
            "View Data"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: isPaused ? handleResume : handlePause,
          className: "flex items-center justify-center gap-1 flex-1 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-200 active:scale-[0.98]",
          style: {
            color: isPaused ? "#10B981" : void 0,
            borderColor: isPaused ? "rgba(16, 185, 129, 0.3)" : void 0
          },
          title: isPaused ? "Resume" : "Pause",
          children: isPaused ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "5 3 19 12 5 21 5 3" }) }),
            "Resume"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-forge-text-secondary", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "6", y: "4", width: "4", height: "16" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "4", width: "4", height: "16" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-forge-text-secondary", children: "Pause" })
          ] })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: handleStop,
          className: "flex items-center justify-center gap-1 flex-1 py-2.5 rounded-lg text-xs font-semibold text-status-error border border-status-error/20 hover:bg-status-error/5 transition-all duration-200 active:scale-[0.98]",
          title: "Stop extraction",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "6", y: "6", width: "12", height: "12", rx: "1" }) }),
            "Stop"
          ]
        }
      )
    ] }),
    isPaused && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-status-warning/5 border border-status-warning/20 w-full", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "#F59E0B", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "6", y: "4", width: "4", height: "16" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "4", width: "4", height: "16" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-status-warning font-medium", children: "Extraction paused" })
    ] })
  ] });
};
const ExtractionProgress$1 = React$2.memo(ExtractionProgress);

const StepIndicator = ({
  step,
  label,
  isActive,
  isCompleted,
  isClickable,
  onClick
}) => {
  const handleClick = reactExports.useCallback(() => {
    if (isClickable) onClick(step);
  }, [step, isClickable, onClick]);
  const stepNumber = step + 1;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: handleClick,
      disabled: !isClickable,
      className: [
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 w-full text-left",
        isActive ? "bg-accent-primary/10 border border-accent-primary/30" : isCompleted ? "bg-forge-bg-tertiary/30 border border-transparent hover:border-accent-primary/20" : "bg-transparent border border-transparent",
        isClickable && !isActive ? "cursor-pointer hover:bg-forge-bg-tertiary/40" : "",
        !isClickable && !isActive ? "opacity-50 cursor-default" : ""
      ].join(" "),
      "aria-current": isActive ? "step" : void 0,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: [
              "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300",
              isCompleted ? "bg-accent-primary text-white" : isActive ? "border-2 border-accent-primary text-accent-primary" : "border-2 border-forge-border text-forge-text-muted"
            ].join(" "),
            style: isCompleted ? { boxShadow: "0 0 10px rgba(16, 185, 129, 0.3)" } : isActive ? { boxShadow: "0 0 8px rgba(16, 185, 129, 0.15)" } : void 0,
            children: isCompleted ? /* @__PURE__ */ jsxRuntimeExports.jsx(
              "svg",
              {
                width: "14",
                height: "14",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "3",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                "aria-hidden": "true",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" })
              }
            ) : stepNumber
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "span",
          {
            className: [
              "text-xs font-semibold transition-colors duration-200",
              isActive ? "text-accent-primary" : isCompleted ? "text-forge-text-secondary" : "text-forge-text-muted"
            ].join(" "),
            style: isActive ? { textShadow: "0 0 8px rgba(16, 185, 129, 0.4)" } : void 0,
            children: label
          }
        ),
        isActive && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-auto flex-shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "svg",
          {
            width: "12",
            height: "12",
            viewBox: "0 0 24 24",
            fill: "none",
            stroke: "currentColor",
            strokeWidth: "2",
            strokeLinecap: "round",
            strokeLinejoin: "round",
            className: "text-accent-primary",
            "aria-hidden": "true",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "6 9 12 15 18 9" })
          }
        ) })
      ]
    }
  );
};
const StepConnector = ({ isCompleted }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-center h-4 ml-[26px]", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: [
      "w-0.5 h-full rounded-full transition-colors duration-300",
      isCompleted ? "bg-accent-primary/50" : "bg-forge-border"
    ].join(" ")
  }
) });
const ListExtractorView = () => {
  const currentStep = useStore((s) => s.currentStep);
  const completedSteps = useStore((s) => s.completedSteps);
  const goToStep = useStore((s) => s.goToStep);
  const nextStep = useStore((s) => s.nextStep);
  const prevStep = useStore((s) => s.prevStep);
  const markStepCompleted = useStore((s) => s.markStepCompleted);
  const error = useStore((s) => s.error);
  const setError = useStore((s) => s.setError);
  const resetListExtractor = useStore((s) => s.resetListExtractor);
  const steps = [0, 1, 2, 3];
  const handleNext = reactExports.useCallback(() => {
    markStepCompleted(currentStep);
    nextStep();
  }, [currentStep, markStepCompleted, nextStep]);
  const handleBack = reactExports.useCallback(() => {
    prevStep();
  }, [prevStep]);
  const handleGoToStep = reactExports.useCallback(
    (step) => {
      if (completedSteps.has(step) || step === currentStep) {
        goToStep(step);
      }
    },
    [completedSteps, currentStep, goToStep]
  );
  const handleViewData = reactExports.useCallback(() => {
    console.log("[DataForge] Navigate to data table view");
  }, []);
  const handleExport = reactExports.useCallback(() => {
    console.log("[DataForge] Trigger export");
  }, []);
  const handleNewExtraction = reactExports.useCallback(() => {
    resetListExtractor();
  }, [resetListExtractor]);
  const isStepClickable = reactExports.useCallback(
    (step) => {
      if (completedSteps.has(step)) return true;
      if (step === currentStep) return true;
      return false;
    },
    [completedSteps, currentStep]
  );
  const stepContent = reactExports.useMemo(() => {
    switch (currentStep) {
      case 0:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(SelectListStep$1, { onNext: handleNext });
      case 1:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(ColumnMapper$1, { onNext: handleNext, onBack: handleBack });
      case 2:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(PaginationConfig$1, { onNext: handleNext, onBack: handleBack });
      case 3:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(
          ExtractionProgress$1,
          {
            onViewData: handleViewData,
            onExport: handleExport,
            onNewExtraction: handleNewExtraction
          }
        );
      default:
        return null;
    }
  }, [currentStep, handleNext, handleBack, handleViewData, handleExport, handleNewExtraction]);
  const renderError = () => {
    if (!error) return null;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mx-4 mt-2 px-3 py-2 rounded-lg bg-status-error/5 border border-status-error/20 animate-slide-in-up", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "svg",
        {
          width: "14",
          height: "14",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "#EF4444",
          strokeWidth: "2",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          "aria-hidden": "true",
          className: "flex-shrink-0",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1 text-xs text-status-error", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setError(null),
          className: "flex-shrink-0 text-status-error/60 hover:text-status-error transition-colors",
          "aria-label": "Dismiss error",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
          ] })
        }
      )
    ] });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 pt-4 pb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "h2",
          {
            className: "text-base font-bold text-forge-text",
            style: { textShadow: "0 0 10px rgba(16, 185, 129, 0.3)" },
            children: "List Extractor"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-forge-text-muted mt-0.5", children: "Extract structured data from any web page" })
      ] }),
      currentStep > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: handleNewExtraction,
          className: "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium text-forge-text-muted hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-all",
          title: "Reset and start over",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "1 4 1 10 7 10" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M3.51 15a9 9 0 1 0 2.13-9.36L1 10" })
            ] }),
            "Reset"
          ]
        }
      )
    ] }),
    renderError(),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col px-4 py-2", children: steps.map((step, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(React$2.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        StepIndicator,
        {
          step,
          label: STEP_LABELS$1[step],
          isActive: step === currentStep,
          isCompleted: completedSteps.has(step),
          isClickable: isStepClickable(step),
          onClick: handleGoToStep
        }
      ),
      idx < steps.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(StepConnector, { isCompleted: completedSteps.has(step) })
    ] }, step)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 px-4 pb-4 overflow-y-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "animate-fade-in",
        children: stepContent
      },
      currentStep
    ) })
  ] });
};
const ListExtractorView$1 = React$2.memo(ListExtractorView);

const URL_REGEX = /^https?:\/\/(?:[\w-]+\.)+[\w-]+(?:\/[\w\-.~:/?#[\]@!$&'()*+,;=%]*)?$/i;
function validateUrl(raw) {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return URL_REGEX.test(raw.trim());
  }
}
function parseUrlsFromText(text) {
  return text.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
}
function parseCSVContent(text) {
  const lines = text.split(/[\n\r]+/).filter(Boolean);
  const urls = [];
  for (const line of lines) {
    const cols = line.split(/[,;\t]/);
    for (const col of cols) {
      const trimmed = col.trim().replace(/^["']|["']$/g, "");
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        urls.push(trimmed);
      }
    }
  }
  return urls;
}
const URLInput = ({
  urls,
  onUrlsChange,
  previousExtractions = [],
  disabled = false
}) => {
  const [textValue, setTextValue] = reactExports.useState(urls.join("\n"));
  const [dragOver, setDragOver] = reactExports.useState(false);
  const [importOpen, setImportOpen] = reactExports.useState(false);
  const fileInputRef = reactExports.useRef(null);
  const importRef = reactExports.useRef(null);
  const parsed = reactExports.useMemo(
    () => urls.map((raw) => ({
      raw,
      valid: validateUrl(raw)
    })),
    [urls]
  );
  const validCount = reactExports.useMemo(() => parsed.filter((p) => p.valid).length, [parsed]);
  const invalidCount = reactExports.useMemo(() => parsed.filter((p) => !p.valid).length, [parsed]);
  const handleTextChange = reactExports.useCallback(
    (e) => {
      const value = e.target.value;
      setTextValue(value);
      const newUrls = parseUrlsFromText(value);
      onUrlsChange(newUrls);
    },
    [onUrlsChange]
  );
  const handleFileUpload = reactExports.useCallback(
    (file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result;
        const ext = file.name.split(".").pop()?.toLowerCase();
        const newUrls = ext === "csv" ? parseCSVContent(content) : parseUrlsFromText(content);
        const combined = [...urls, ...newUrls];
        const deduped = [...new Set(combined)];
        onUrlsChange(deduped);
        setTextValue(deduped.join("\n"));
      };
      reader.readAsText(file);
    },
    [urls, onUrlsChange]
  );
  const handleFileChange = reactExports.useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) handleFileUpload(file);
      e.target.value = "";
    },
    [handleFileUpload]
  );
  const handleDragOver = reactExports.useCallback((e) => {
    e.preventDefault();
    setDragOver(true);
  }, []);
  const handleDragLeave = reactExports.useCallback(() => {
    setDragOver(false);
  }, []);
  const handleDrop = reactExports.useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );
  const handleImport = reactExports.useCallback(
    (extraction) => {
      const combined = [...urls, ...extraction.urls];
      const deduped = [...new Set(combined)];
      onUrlsChange(deduped);
      setTextValue(deduped.join("\n"));
      setImportOpen(false);
    },
    [urls, onUrlsChange]
  );
  const handleClear = reactExports.useCallback(() => {
    onUrlsChange([]);
    setTextValue("");
  }, [onUrlsChange]);
  const handleRemoveInvalid = reactExports.useCallback(() => {
    const validUrls = parsed.filter((p) => p.valid).map((p) => p.raw);
    onUrlsChange(validUrls);
    setTextValue(validUrls.join("\n"));
  }, [parsed, onUrlsChange]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary", children: "Target URLs" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: urls.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5 text-[11px] font-mono", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded bg-accent-primary/15 text-accent-primary font-bold", children: validCount }),
        invalidCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded bg-status-error/15 text-status-error font-bold", children: invalidCount }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-forge-text-muted", children: "URLs" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: [
          "relative rounded-lg border transition-colors duration-200",
          dragOver ? "border-accent-primary bg-accent-primary/5" : "border-forge-border hover:border-forge-border-active/50",
          disabled ? "opacity-50 pointer-events-none" : ""
        ].join(" "),
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDrop: handleDrop,
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "textarea",
            {
              value: textValue,
              onChange: handleTextChange,
              disabled,
              placeholder: "Paste URLs here, one per line...\n\nhttps://example.com/page-1\nhttps://example.com/page-2\nhttps://example.com/page-3",
              className: [
                "w-full h-40 px-3 py-2.5 bg-transparent text-sm text-forge-text font-mono",
                "placeholder:text-forge-text-muted/40 resize-none",
                "focus:outline-none",
                "scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent"
              ].join(" "),
              spellCheck: false
            }
          ),
          invalidCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 right-0 mt-2 mr-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: handleRemoveInvalid,
              className: "text-[10px] font-medium px-2 py-1 rounded bg-status-error/10 text-status-error hover:bg-status-error/20 transition-colors",
              title: "Remove invalid URLs",
              children: [
                "Remove ",
                invalidCount,
                " invalid"
              ]
            }
          ) }),
          dragOver && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-accent-primary/10 rounded-lg backdrop-blur-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-2 text-accent-primary", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "17 8 12 3 7 8" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold", children: "Drop CSV or TXT file" })
          ] }) })
        ]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          type: "button",
          onClick: () => fileInputRef.current?.click(),
          disabled,
          className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-forge-bg-tertiary text-forge-text-secondary hover:text-forge-text hover:bg-forge-border/40 border border-forge-border transition-colors disabled:opacity-40",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "17 8 12 3 7 8" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })
            ] }),
            "Upload CSV/TXT"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ref: fileInputRef,
          type: "file",
          accept: ".csv,.txt,.tsv",
          className: "hidden",
          onChange: handleFileChange
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", ref: importRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setImportOpen(!importOpen),
            disabled: disabled || previousExtractions.length === 0,
            className: "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-forge-bg-tertiary text-forge-text-secondary hover:text-forge-text hover:bg-forge-border/40 border border-forge-border transition-colors disabled:opacity-40",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 3v12" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "m8 11 4 4 4-4" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M8 5H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-4" })
              ] }),
              "Import Previous"
            ]
          }
        ),
        importOpen && previousExtractions.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-full left-0 mt-1 w-56 rounded-lg border border-forge-border bg-forge-bg-secondary shadow-xl z-20 animate-scale-in overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-48 overflow-y-auto", children: previousExtractions.map((ext) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => handleImport(ext),
            className: "w-full flex items-center justify-between px-3 py-2 text-xs text-forge-text-secondary hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-colors",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: ext.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-forge-text-muted font-mono ml-2", children: ext.urls.length })
            ]
          },
          ext.id
        )) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
      urls.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: handleClear,
          disabled,
          className: "text-xs font-medium text-forge-text-muted hover:text-status-error transition-colors disabled:opacity-40",
          children: "Clear all"
        }
      )
    ] }),
    invalidCount > 0 && urls.length <= 20 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-forge-border bg-forge-bg-secondary/50 p-2 max-h-32 overflow-y-auto", children: parsed.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: [
          "flex items-center gap-2 px-2 py-1 rounded text-[11px] font-mono truncate",
          p.valid ? "text-forge-text-muted" : "text-status-error bg-status-error/5"
        ].join(" "),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0", children: p.valid ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", className: "text-accent-primary", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", className: "text-status-error", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: p.raw })
        ]
      },
      i
    )) })
  ] });
};

const sizeClasses = {
  sm: "h-7 px-2.5 text-xs gap-1.5 rounded-md",
  md: "h-9 px-4 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-base gap-2.5 rounded-lg"
};
const variantClasses = {
  primary: [
    "text-forge-bg font-semibold",
    "bg-gradient-to-br from-accent-primary to-accent-secondary",
    "shadow-[0_0_12px_rgba(16,185,129,0.3)]",
    "hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]"
  ].join(" "),
  secondary: [
    "text-accent-primary font-medium",
    "bg-transparent border border-accent-primary/50",
    "hover:border-accent-primary hover:bg-accent-primary/10",
    "hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]"
  ].join(" "),
  danger: [
    "text-white font-semibold",
    "bg-status-error",
    "hover:bg-red-600 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]"
  ].join(" "),
  ghost: [
    "text-forge-text-secondary font-medium",
    "bg-transparent",
    "hover:text-forge-text hover:bg-forge-bg-tertiary/60"
  ].join(" ")
};
const Spinner = ({ className = "w-4 h-4" }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  "svg",
  {
    className: `animate-spin ${className}`,
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": "true",
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "circle",
        {
          cx: "12",
          cy: "12",
          r: "10",
          stroke: "currentColor",
          strokeWidth: "3",
          strokeLinecap: "round",
          className: "opacity-25"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "path",
        {
          d: "M12 2a10 10 0 0 1 10 10",
          stroke: "currentColor",
          strokeWidth: "3",
          strokeLinecap: "round",
          className: "opacity-75"
        }
      )
    ]
  }
);
const Button = reactExports.forwardRef(
  ({
    variant = "primary",
    size = "md",
    loading = false,
    disabled,
    iconLeft,
    iconRight,
    children,
    className = "",
    ...rest
  }, ref) => {
    const isDisabled = disabled || loading;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        ref,
        type: "button",
        disabled: isDisabled,
        className: [
          // Base
          "inline-flex items-center justify-center select-none whitespace-nowrap",
          "transition-all duration-150 ease-out",
          // Motion-safe interactions
          "motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]",
          // Reduced motion
          "motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
          // Focus
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-forge-bg",
          // Disabled
          isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "cursor-pointer",
          // Variant + size
          variantClasses[variant],
          sizeClasses[size],
          className
        ].join(" "),
        "aria-busy": loading,
        ...rest,
        children: [
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Spinner, { className: size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4" }) : iconLeft && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 flex items-center", children: iconLeft }),
          children && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children }),
          !loading && iconRight && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 flex items-center", children: iconRight })
        ]
      }
    );
  }
);
Button.displayName = "Button";

const DATA_TYPE_LABELS = {
  text: "Text",
  number: "Number",
  price: "Price",
  url: "URL",
  image: "Image",
  email: "Email",
  date: "Date",
  rating: "Rating",
  phone: "Phone",
  location: "Location"
};
const FieldSelector = ({
  fields,
  onFieldsChange,
  onAddField,
  sampleUrl
}) => {
  const [editingFieldId, setEditingFieldId] = reactExports.useState(null);
  const [editName, setEditName] = reactExports.useState("");
  const [testingFieldId, setTestingFieldId] = reactExports.useState(null);
  const [testResults, setTestResults] = reactExports.useState({});
  const handleToggle = reactExports.useCallback(
    (id) => {
      onFieldsChange(
        fields.map((f) => f.id === id ? { ...f, enabled: !f.enabled } : f)
      );
    },
    [fields, onFieldsChange]
  );
  const handleStartRename = reactExports.useCallback((field) => {
    setEditingFieldId(field.id);
    setEditName(field.name);
  }, []);
  const handleCommitRename = reactExports.useCallback(
    (id) => {
      if (editName.trim()) {
        onFieldsChange(
          fields.map((f) => f.id === id ? { ...f, name: editName.trim() } : f)
        );
      }
      setEditingFieldId(null);
      setEditName("");
    },
    [editName, fields, onFieldsChange]
  );
  const handleTypeChange = reactExports.useCallback(
    (id, dataType) => {
      onFieldsChange(
        fields.map((f) => f.id === id ? { ...f, dataType } : f)
      );
    },
    [fields, onFieldsChange]
  );
  const handleRemove = reactExports.useCallback(
    (id) => {
      onFieldsChange(fields.filter((f) => f.id !== id));
    },
    [fields, onFieldsChange]
  );
  const handleTestField = reactExports.useCallback(
    async (field) => {
      setTestingFieldId(field.id);
      try {
        const tab = await getActiveTab();
        if (!tab?.id) return;
        const response = await sendRuntimeMessage({
          type: "TEST_SELECTOR",
          selector: field.relativeSelector
        });
        if (response) {
          setTestResults((prev) => ({
            ...prev,
            [field.id]: response.sampleValues ?? []
          }));
        }
      } catch {
        setTestResults((prev) => ({
          ...prev,
          [field.id]: ["Error: Could not test selector"]
        }));
      } finally {
        setTestingFieldId(null);
      }
    },
    []
  );
  const handleMoveField = reactExports.useCallback(
    (id, direction) => {
      const idx = fields.findIndex((f) => f.id === id);
      if (idx === -1) return;
      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= fields.length) return;
      const next = [...fields];
      const [moved] = next.splice(idx, 1);
      next.splice(targetIdx, 0, moved);
      onFieldsChange(next);
    },
    [fields, onFieldsChange]
  );
  const enabledCount = fields.filter((f) => f.enabled).length;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary", children: "Fields" }),
        fields.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "success", children: [
          enabledCount,
          "/",
          fields.length
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "secondary",
          size: "sm",
          onClick: onAddField,
          iconLeft: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "8", x2: "12", y2: "16" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "12", x2: "16", y2: "12" })
          ] }),
          children: "Click Element"
        }
      )
    ] }),
    fields.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-8 gap-3 rounded-xl border border-dashed border-forge-border/60 bg-forge-bg-secondary/30", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: "text-accent-primary", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "21", x2: "9", y2: "9" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-forge-text-secondary", children: "No fields configured" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted mt-1", children: 'Click "Click Element" to select elements on the page' })
      ] })
    ] }),
    fields.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-2", children: fields.map((field, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: [
          "group rounded-lg border p-3 transition-all duration-200",
          field.enabled ? "border-accent-primary/20 bg-forge-bg-secondary/60 hover:border-accent-primary/40" : "border-forge-border/40 bg-forge-bg-secondary/30 opacity-60"
        ].join(" "),
        children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => handleToggle(field.id),
              className: [
                "mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                field.enabled ? "bg-accent-primary border-accent-primary" : "bg-transparent border-forge-border hover:border-forge-text-muted"
              ].join(" "),
              "aria-label": field.enabled ? "Disable field" : "Enable field",
              children: field.enabled && /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", className: "text-forge-bg", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              editingFieldId === field.id ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: editName,
                  onChange: (e) => setEditName(e.target.value),
                  onBlur: () => handleCommitRename(field.id),
                  onKeyDown: (e) => {
                    if (e.key === "Enter") handleCommitRename(field.id);
                    if (e.key === "Escape") setEditingFieldId(null);
                  },
                  className: "h-6 px-1.5 rounded bg-forge-bg-tertiary border border-accent-primary/50 text-xs text-forge-text font-medium focus:outline-none",
                  autoFocus: true
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleStartRename(field),
                  className: "text-xs font-medium text-forge-text hover:text-accent-primary transition-colors truncate",
                  title: "Click to rename",
                  children: field.name
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "select",
                {
                  value: field.dataType,
                  onChange: (e) => handleTypeChange(field.id, e.target.value),
                  className: "h-5 px-1 rounded bg-accent-primary/10 text-accent-primary text-[10px] font-semibold border-none focus:outline-none focus:ring-1 focus:ring-accent-primary/50 cursor-pointer appearance-none",
                  children: Object.keys(DATA_TYPE_LABELS).map((dt) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: dt, children: DATA_TYPE_LABELS[dt] }, dt))
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[10px] font-mono text-forge-text-muted truncate", title: field.relativeSelector, children: field.relativeSelector }),
            field.sampleValues.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5 flex flex-wrap gap-1", children: field.sampleValues.slice(0, 3).map((val, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "inline-block max-w-[140px] truncate px-1.5 py-0.5 rounded bg-forge-bg-tertiary/60 text-[10px] text-forge-text-muted",
                children: val
              },
              i
            )) }),
            testResults[field.id] && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 p-2 rounded bg-forge-bg-tertiary/40 border border-forge-border/30", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-semibold text-forge-text-secondary mb-1", children: [
                "Test Results (",
                testResults[field.id].length,
                " values)"
              ] }),
              testResults[field.id].slice(0, 5).map((val, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-forge-text-muted font-mono truncate", children: val }, i))
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => handleMoveField(field.id, "up"),
                disabled: index === 0,
                className: "p-1 rounded hover:bg-forge-bg-tertiary text-forge-text-muted hover:text-forge-text-secondary transition-colors disabled:opacity-30",
                title: "Move up",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "18 15 12 9 6 15" }) })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => handleMoveField(field.id, "down"),
                disabled: index === fields.length - 1,
                className: "p-1 rounded hover:bg-forge-bg-tertiary text-forge-text-muted hover:text-forge-text-secondary transition-colors disabled:opacity-30",
                title: "Move down",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "6 9 12 15 18 9" }) })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => handleTestField(field),
                disabled: testingFieldId === field.id,
                className: "p-1 rounded hover:bg-forge-bg-tertiary text-forge-text-muted hover:text-accent-primary transition-colors disabled:opacity-50",
                title: "Test on current page",
                children: testingFieldId === field.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", className: "animate-spin", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10", className: "opacity-25" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2a10 10 0 0 1 10 10", className: "opacity-75" })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "5 3 19 12 5 21 5 3" }) })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: () => handleRemove(field.id),
                className: "p-1 rounded hover:bg-status-error/10 text-forge-text-muted hover:text-status-error transition-colors",
                title: "Remove field",
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
                ] })
              }
            )
          ] })
        ] })
      },
      field.id
    )) })
  ] });
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "text-forge-text-muted",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-forge-text-muted", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "12 6 12 12 16 14" })
    ] })
  },
  processing: {
    label: "Processing",
    color: "text-accent-primary",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-accent-primary animate-spin", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10", className: "opacity-25" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2a10 10 0 0 1 10 10", className: "opacity-75" })
    ] })
  },
  success: {
    label: "Success",
    color: "text-status-success",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", className: "text-status-success", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) })
  },
  partial: {
    label: "Partial",
    color: "text-status-warning",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-status-warning", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
    ] })
  },
  failed: {
    label: "Failed",
    color: "text-status-error",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-status-error", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "9", x2: "15", y2: "15" })
    ] })
  }
};
const BulkProgress = ({ entries, isExtracting }) => {
  const [expandedErrors, setExpandedErrors] = reactExports.useState(/* @__PURE__ */ new Set());
  const stats = reactExports.useMemo(() => {
    const total = entries.length;
    const completed = entries.filter(
      (e) => e.status === "success" || e.status === "partial" || e.status === "failed"
    ).length;
    const success = entries.filter((e) => e.status === "success").length;
    const partial = entries.filter((e) => e.status === "partial").length;
    const failed = entries.filter((e) => e.status === "failed").length;
    const processing = entries.filter((e) => e.status === "processing").length;
    const pending = entries.filter((e) => e.status === "pending").length;
    const totalRows = entries.reduce((sum, e) => sum + e.rowCount, 0);
    const percentage = total > 0 ? Math.round(completed / total * 100) : 0;
    return { total, completed, success, partial, failed, processing, pending, totalRows, percentage };
  }, [entries]);
  const toggleError = reactExports.useCallback((id) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);
  const getDomain = (url) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };
  const getPath = (url) => {
    try {
      const u = new URL(url);
      return u.pathname + u.search;
    } catch {
      return url;
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-forge-text-secondary", children: isExtracting ? "Extracting..." : stats.completed === stats.total ? "Complete" : "Paused" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-forge-text-muted", children: [
          stats.completed,
          "/",
          stats.total
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-2 rounded-full bg-forge-bg-tertiary overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
            style: {
              width: `${stats.total > 0 ? stats.success / stats.total * 100 : 0}%`,
              background: "linear-gradient(90deg, #10B981, #14B8A6)",
              boxShadow: "0 0 8px rgba(16, 185, 129, 0.4)"
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-y-0 rounded-full bg-status-warning transition-all duration-500 ease-out",
            style: {
              left: `${stats.total > 0 ? stats.success / stats.total * 100 : 0}%`,
              width: `${stats.total > 0 ? stats.partial / stats.total * 100 : 0}%`
            }
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-y-0 rounded-full bg-status-error transition-all duration-500 ease-out",
            style: {
              left: `${stats.total > 0 ? (stats.success + stats.partial) / stats.total * 100 : 0}%`,
              width: `${stats.total > 0 ? stats.failed / stats.total * 100 : 0}%`
            }
          }
        ),
        isExtracting && stats.processing > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: "absolute inset-y-0 w-16 animate-scanner",
            style: {
              background: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)"
            }
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-[10px] font-semibold", children: [
        stats.success > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-status-success flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-status-success" }),
          stats.success,
          " success"
        ] }),
        stats.partial > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-status-warning flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-status-warning" }),
          stats.partial,
          " partial"
        ] }),
        stats.failed > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-status-error flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-status-error" }),
          stats.failed,
          " failed"
        ] }),
        stats.totalRows > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-forge-text-muted ml-auto", children: [
          stats.totalRows,
          " rows total"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-col gap-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent rounded-lg border border-forge-border bg-forge-bg-secondary/30 p-2", children: entries.map((entry) => {
      const config = STATUS_CONFIG[entry.status];
      const hasError = entry.status === "failed" && entry.error;
      const isExpanded = expandedErrors.has(entry.id);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: [
              "flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors",
              entry.status === "processing" ? "bg-accent-primary/5" : "hover:bg-forge-bg-tertiary/30"
            ].join(" "),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0", children: config.icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] font-mono text-forge-text-secondary truncate block", children: [
                getDomain(entry.url),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-forge-text-muted", children: getPath(entry.url) })
              ] }) }),
              entry.rowCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-mono text-accent-primary shrink-0", children: [
                entry.rowCount,
                " rows"
              ] }),
              entry.status === "processing" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-1 rounded-full bg-forge-bg-tertiary overflow-hidden shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "h-full w-1/2 rounded-full animate-scanner",
                  style: {
                    background: "linear-gradient(90deg, transparent, #10B981, transparent)"
                  }
                }
              ) }),
              hasError && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => toggleError(entry.id),
                  className: "p-0.5 rounded text-forge-text-muted hover:text-status-error transition-colors shrink-0",
                  title: "Show error details",
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "svg",
                    {
                      width: "12",
                      height: "12",
                      viewBox: "0 0 24 24",
                      fill: "none",
                      stroke: "currentColor",
                      strokeWidth: "2",
                      className: [
                        "transition-transform duration-200",
                        isExpanded ? "rotate-180" : ""
                      ].join(" "),
                      "aria-hidden": "true",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "6 9 12 15 18 9" })
                    }
                  )
                }
              )
            ]
          }
        ),
        hasError && isExpanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "ml-6 mr-2 mt-1 mb-2 p-2 rounded bg-status-error/5 border border-status-error/20 text-[10px] text-status-error/80 font-mono animate-scale-in", children: entry.error })
      ] }, entry.id);
    }) })
  ] });
};
const BulkProgress$1 = React$2.memo(BulkProgress);

const STEP_LABELS = {
  0: "URLs",
  1: "Template",
  2: "Extract"
};
const STEP_DESCRIPTIONS = {
  0: "Add the URLs you want to extract data from",
  1: "Configure which fields to extract from each page",
  2: "Run bulk extraction across all URLs"
};
const PageExtractorView = () => {
  const { error, setError } = useStore();
  const [step, setStep] = reactExports.useState(0);
  const [completedSteps, setCompletedSteps] = reactExports.useState(/* @__PURE__ */ new Set());
  const [urls, setUrls] = reactExports.useState([]);
  const previousExtractions = useStore((s) => s.history);
  const [fields, setFields] = reactExports.useState([]);
  const [sampleUrl, setSampleUrl] = reactExports.useState("");
  const [rateLimit, setRateLimit] = reactExports.useState({
    delayMs: 1e3,
    concurrentTabs: 2
  });
  const [bulkEntries, setBulkEntries] = reactExports.useState([]);
  const [isExtracting, setIsExtracting] = reactExports.useState(false);
  const [isPaused, setIsPaused] = reactExports.useState(false);
  const abortRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    if (urls.length > 0 && !sampleUrl) {
      setSampleUrl(urls[0]);
    }
  }, [urls, sampleUrl]);
  const goToStep = reactExports.useCallback((target) => {
    setStep(target);
  }, []);
  const nextStep = reactExports.useCallback(() => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(step);
      return next;
    });
    if (step < 2) {
      setStep(step + 1);
    }
  }, [step]);
  const prevStep = reactExports.useCallback(() => {
    if (step > 0) {
      setStep(step - 1);
    }
  }, [step]);
  const canProceedFrom = reactExports.useCallback(
    (s) => {
      switch (s) {
        case 0:
          return urls.length > 0;
        case 1:
          return fields.filter((f) => f.enabled).length > 0;
        case 2:
          return true;
        default:
          return false;
      }
    },
    [urls, fields]
  );
  const startExtraction = reactExports.useCallback(async () => {
    if (urls.length === 0 || fields.filter((f) => f.enabled).length === 0) return;
    setIsExtracting(true);
    setIsPaused(false);
    abortRef.current = false;
    setError(null);
    const entries = urls.map((url) => ({
      id: generatePrefixedId("burl"),
      url,
      status: "pending",
      rowCount: 0
    }));
    setBulkEntries(entries);
    const activeFields = fields.filter((f) => f.enabled);
    const concurrency = rateLimit.concurrentTabs;
    let cursor = 0;
    const processUrl = async (entry) => {
      const updated = {
        ...entry,
        status: "processing",
        startedAt: Date.now()
      };
      setBulkEntries(
        (prev) => prev.map((e) => e.id === entry.id ? updated : e)
      );
      try {
        const response = await sendRuntimeMessage({
          type: "EXTRACT_PAGE_DATA",
          url: entry.url,
          fields: activeFields
        });
        if (response?.error) {
          return {
            ...updated,
            status: "failed",
            error: response.error,
            completedAt: Date.now()
          };
        }
        const rowCount = response?.rows?.length ?? 0;
        return {
          ...updated,
          status: response?.partial ? "partial" : "success",
          rowCount,
          completedAt: Date.now()
        };
      } catch (err) {
        return {
          ...updated,
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
          completedAt: Date.now()
        };
      }
    };
    const processNext = async () => {
      while (cursor < entries.length && !abortRef.current) {
        while (isPaused && !abortRef.current) {
          await new Promise((r) => setTimeout(r, 200));
        }
        if (abortRef.current) break;
        const idx = cursor++;
        if (idx >= entries.length) break;
        const result = await processUrl(entries[idx]);
        setBulkEntries(
          (prev) => prev.map((e) => e.id === result.id ? result : e)
        );
        if (rateLimit.delayMs > 0 && idx < entries.length - 1) {
          await new Promise((r) => setTimeout(r, rateLimit.delayMs));
        }
      }
    };
    const workers = Array.from(
      { length: Math.min(concurrency, entries.length) },
      () => processNext()
    );
    await Promise.all(workers);
    setIsExtracting(false);
  }, [urls, fields, rateLimit, isPaused, setError]);
  const stopExtraction = reactExports.useCallback(() => {
    abortRef.current = true;
    setIsExtracting(false);
    setIsPaused(false);
  }, []);
  const togglePause = reactExports.useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);
  const handleAddField = reactExports.useCallback(
    async () => {
      try {
        const tab = await getActiveTab();
        if (!tab?.id) return;
        const result = await sendRuntimeMessage({
          type: "ACTIVATE_SELECTION_MODE",
          tool: "page-extractor"
        });
        if (result?.selector) {
          const newField = {
            id: generatePrefixedId("fld"),
            name: result.name || `Field ${fields.length + 1}`,
            relativeSelector: result.selector,
            sampleValues: result.sampleValues || [],
            dataType: "text",
            confidence: 0.9,
            enabled: true
          };
          setFields((prev) => [...prev, newField]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to select element");
      }
    },
    [fields, setError]
  );
  const handleNavigateSample = reactExports.useCallback(async () => {
    if (!sampleUrl) return;
    try {
      await sendRuntimeMessage({ type: "NAVIGATE_URL", url: sampleUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to navigate");
    }
  }, [sampleUrl, setError]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 px-4 pt-4 pb-3", children: [0, 1, 2].map((s) => {
      const isActive = s === step;
      const isCompleted = completedSteps.has(s);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(React$2.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => goToStep(s),
            disabled: s > step && !canProceedFrom(s - 1),
            className: [
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
              isActive ? "bg-accent-primary/15 text-accent-primary shadow-[0_0_12px_rgba(16,185,129,0.15)]" : isCompleted ? "bg-forge-bg-tertiary/60 text-accent-tertiary hover:bg-forge-bg-tertiary" : "bg-forge-bg-tertiary/30 text-forge-text-muted hover:text-forge-text-secondary",
              s > step && !canProceedFrom(s - 1) ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
            ].join(" "),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: [
                    "inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold",
                    isActive ? "bg-accent-primary text-forge-bg" : isCompleted ? "bg-accent-primary/25 text-accent-primary" : "bg-forge-border/50 text-forge-text-muted"
                  ].join(" "),
                  children: isCompleted && !isActive ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) }) : s + 1
                }
              ),
              STEP_LABELS[s]
            ]
          }
        ),
        s < 2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: [
          "flex-1 h-px max-w-6",
          isCompleted || s < step ? "bg-accent-primary/40" : "bg-forge-border/40"
        ].join(" ") })
      ] }, s);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "px-4 pb-3 text-[11px] text-forge-text-muted", children: STEP_DESCRIPTIONS[step] }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-4 mb-3 px-3 py-2 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-xs flex items-start gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "shrink-0 mt-0.5", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "9", x2: "15", y2: "15" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: error }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setError(null),
          className: "text-status-error/60 hover:text-status-error transition-colors",
          children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent", children: [
      step === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-fade-in", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
        URLInput,
        {
          urls,
          onUrlsChange: setUrls,
          previousExtractions: previousExtractions.map((h) => ({
            id: h.id,
            name: h.name,
            urls: [h.sourceUrl]
          }))
        }
      ) }),
      step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 animate-fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary", children: "Sample Page" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: sampleUrl,
                onChange: (e) => setSampleUrl(e.target.value),
                placeholder: "Enter URL to navigate to...",
                className: "flex-1 h-8 px-3 rounded-lg bg-forge-bg-secondary border border-forge-border text-xs text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "sm", variant: "secondary", onClick: handleNavigateSample, children: "Navigate" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          FieldSelector,
          {
            fields,
            onFieldsChange: setFields,
            onAddField: handleAddField,
            sampleUrl
          }
        )
      ] }),
      step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 animate-fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary", children: "Delay Between Requests" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "range",
                  min: 500,
                  max: 1e4,
                  step: 500,
                  value: rateLimit.delayMs,
                  onChange: (e) => setRateLimit((prev) => ({ ...prev, delayMs: Number(e.target.value) })),
                  className: "flex-1 h-1.5 rounded-full appearance-none bg-forge-border accent-accent-primary cursor-pointer",
                  disabled: isExtracting
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono text-forge-text-secondary min-w-[40px] text-right", children: [
                (rateLimit.delayMs / 1e3).toFixed(1),
                "s"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary", children: "Parallel Tabs" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "range",
                  min: 1,
                  max: 5,
                  step: 1,
                  value: rateLimit.concurrentTabs,
                  onChange: (e) => setRateLimit((prev) => ({
                    ...prev,
                    concurrentTabs: Number(e.target.value)
                  })),
                  className: "flex-1 h-1.5 rounded-full appearance-none bg-forge-border accent-accent-primary cursor-pointer",
                  disabled: isExtracting
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-forge-text-secondary min-w-[20px] text-right", children: rateLimit.concurrentTabs })
            ] })
          ] })
        ] }),
        !isExtracting && bulkEntries.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-forge-border bg-forge-bg-secondary/50 p-4 flex flex-col items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "success", children: [
              urls.length,
              " URLs"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "default", children: [
              fields.filter((f) => f.enabled).length,
              " fields"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-forge-text-muted text-center", children: [
            "Ready to extract ",
            fields.filter((f) => f.enabled).length,
            " fields from",
            " ",
            urls.length,
            " pages"
          ] })
        ] }),
        !isExtracting && bulkEntries.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "primary",
            onClick: startExtraction,
            disabled: urls.length === 0 || fields.filter((f) => f.enabled).length === 0,
            iconLeft: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "5 3 19 12 5 21 5 3" }) }),
            children: "Start Extraction"
          }
        ),
        isExtracting && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "sm", onClick: togglePause, children: isPaused ? "Resume" : "Pause" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "danger", size: "sm", onClick: stopExtraction, children: "Stop" })
        ] }),
        bulkEntries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
          BulkProgress$1,
          {
            entries: bulkEntries,
            isExtracting
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-4 py-3 border-t border-forge-border bg-forge-bg-secondary/50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: prevStep,
          disabled: step === 0,
          iconLeft: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "15 18 9 12 15 6" }) }),
          children: "Back"
        }
      ),
      step < 2 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "primary",
          size: "sm",
          onClick: nextStep,
          disabled: !canProceedFrom(step),
          iconRight: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "9 18 15 12 9 6" }) }),
          children: "Next"
        }
      )
    ] })
  ] });
};

const CrawlConfig = ({
  settings,
  onChange,
  disabled = false
}) => {
  const update = reactExports.useCallback(
    (partial) => {
      onChange({ ...settings, ...partial });
    },
    [settings, onChange]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: [
        "flex flex-col gap-4 rounded-xl border border-forge-border bg-forge-bg-secondary/40 p-4",
        disabled ? "opacity-50 pointer-events-none" : ""
      ].join(" "),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-xs font-bold uppercase tracking-wider text-forge-text-secondary flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-accent-primary", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" })
          ] }),
          "Crawl Configuration"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-forge-text-secondary", children: "Crawl Depth" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono font-bold text-accent-primary", children: [
              settings.depth,
              " ",
              settings.depth === 1 ? "level" : "levels"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: 1,
              max: 5,
              step: 1,
              value: settings.depth,
              onChange: (e) => update({ depth: Number(e.target.value) }),
              className: "w-full h-1.5 rounded-full appearance-none bg-forge-border accent-accent-primary cursor-pointer"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[9px] text-forge-text-muted font-mono", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "3" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "5" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-forge-text-secondary", children: "Max Pages" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "number",
              min: 1,
              max: 500,
              value: settings.maxPages,
              onChange: (e) => update({ maxPages: Math.max(1, Math.min(500, Number(e.target.value) || 1)) }),
              className: "h-8 px-3 rounded-lg bg-forge-bg-tertiary/40 border border-forge-border text-xs text-forge-text font-mono focus:outline-none focus:border-accent-primary/50 transition-colors"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-forge-text-secondary", children: "Delay Between Requests" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono font-bold text-accent-primary", children: [
              (settings.delayMs / 1e3).toFixed(1),
              "s"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: 500,
              max: 5e3,
              step: 250,
              value: settings.delayMs,
              onChange: (e) => update({ delayMs: Number(e.target.value) }),
              className: "w-full h-1.5 rounded-full appearance-none bg-forge-border accent-accent-primary cursor-pointer"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: [
                  "relative w-9 h-5 rounded-full transition-colors duration-200",
                  settings.respectRobots ? "bg-accent-primary" : "bg-forge-border"
                ].join(" "),
                onClick: () => update({ respectRobots: !settings.respectRobots }),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: [
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                      settings.respectRobots ? "translate-x-[18px]" : "translate-x-0.5"
                    ].join(" ")
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-forge-text-secondary group-hover:text-forge-text transition-colors", children: "Respect robots.txt" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-forge-text-muted", children: "Skip disallowed paths" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer group", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: [
                  "relative w-9 h-5 rounded-full transition-colors duration-200",
                  settings.internalOnly ? "bg-accent-primary" : "bg-forge-border"
                ].join(" "),
                onClick: () => update({ internalOnly: !settings.internalOnly }),
                children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: [
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                      settings.internalOnly ? "translate-x-[18px]" : "translate-x-0.5"
                    ].join(" ")
                  }
                )
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-forge-text-secondary group-hover:text-forge-text transition-colors", children: "Internal links only" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-forge-text-muted", children: "Stay on the same domain" })
            ] })
          ] })
        ] })
      ]
    }
  );
};
const CrawlConfig$1 = React$2.memo(CrawlConfig);

const EmailResults = ({ emails }) => {
  const [groupByDomain, setGroupByDomain] = reactExports.useState(false);
  const [copiedId, setCopiedId] = reactExports.useState(null);
  const [copiedAll, setCopiedAll] = reactExports.useState(false);
  const listRef = reactExports.useRef(null);
  const prevCountRef = reactExports.useRef(emails.length);
  const [animatingIds, setAnimatingIds] = reactExports.useState(/* @__PURE__ */ new Set());
  reactExports.useEffect(() => {
    if (emails.length > prevCountRef.current) {
      const newEmails = emails.slice(prevCountRef.current);
      const newIds = new Set(newEmails.map((e) => e.id));
      setAnimatingIds((prev) => /* @__PURE__ */ new Set([...prev, ...newIds]));
      const timer = setTimeout(() => {
        setAnimatingIds((prev) => {
          const next = new Set(prev);
          for (const id of newIds) next.delete(id);
          return next;
        });
      }, 600);
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
      prevCountRef.current = emails.length;
      return () => clearTimeout(timer);
    }
    prevCountRef.current = emails.length;
  }, [emails]);
  const domainGroups = reactExports.useMemo(() => {
    if (!groupByDomain) return [];
    const map = /* @__PURE__ */ new Map();
    for (const email of emails) {
      const domain = email.email.split("@")[1] || "unknown";
      const existing = map.get(domain) || [];
      existing.push(email);
      map.set(domain, existing);
    }
    return Array.from(map.entries()).map(([domain, entries]) => ({ domain, emails: entries })).sort((a, b) => b.emails.length - a.emails.length);
  }, [emails, groupByDomain]);
  const handleCopyEmail = reactExports.useCallback(async (email, id) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2e3);
    } catch {
    }
  }, []);
  const handleCopyAll = reactExports.useCallback(async () => {
    try {
      const text = emails.map((e) => e.email).join("\n");
      await navigator.clipboard.writeText(text);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2e3);
    } catch {
    }
  }, [emails]);
  const handleExport = reactExports.useCallback(() => {
    const header = "Email,Source URL,Page Title,Found At\n";
    const rows = emails.map(
      (e) => [
        `"${e.email}"`,
        `"${e.sourceUrl}"`,
        `"${e.pageTitle}"`,
        `"${new Date(e.foundAt).toISOString()}"`
      ].join(",")
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dataforge-emails-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [emails]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 animate-fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold uppercase tracking-wider text-forge-text-secondary", children: "Results" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "success", children: emails.length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setGroupByDomain(!groupByDomain),
            className: [
              "flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-semibold transition-colors",
              groupByDomain ? "bg-accent-primary/15 text-accent-primary" : "bg-forge-bg-tertiary text-forge-text-muted hover:text-forge-text-secondary"
            ].join(" "),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "7", height: "7" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "3", width: "7", height: "7" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "14", width: "7", height: "7" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "14", width: "7", height: "7" })
              ] }),
              "Group"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: handleCopyAll, children: copiedAll ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-accent-primary text-[10px]", children: "Copied!" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: handleExport, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "7 10 12 15 17 10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
        ] }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        ref: listRef,
        className: "flex flex-col gap-1 max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent rounded-lg border border-forge-border bg-forge-bg-secondary/30 p-2",
        children: !groupByDomain ? (
          // Flat list
          emails.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: [
                "relative flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 group",
                "hover:bg-forge-bg-tertiary/40",
                animatingIds.has(entry.id) ? "animate-slide-in-right" : ""
              ].join(" "),
              children: [
                animatingIds.has(entry.id) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-lg overflow-hidden pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "div",
                  {
                    className: "absolute inset-0 animate-shockwave opacity-20 rounded-lg",
                    style: { background: "radial-gradient(circle, rgba(16, 185, 129, 0.4), transparent)" }
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-6 h-6 rounded-full bg-accent-primary/10 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-accent-primary", children: "@" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-forge-text truncate", children: entry.email }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-forge-text-muted truncate", title: entry.sourceUrl, children: entry.pageTitle || entry.sourceUrl })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] text-forge-text-muted font-mono shrink-0 hidden group-hover:inline", children: formatDate(entry.foundAt, "relative") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => handleCopyEmail(entry.email, entry.id),
                    className: "p-1 rounded hover:bg-forge-bg-tertiary text-forge-text-muted hover:text-accent-primary transition-colors shrink-0 opacity-0 group-hover:opacity-100",
                    title: "Copy email",
                    children: copiedId === entry.id ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", className: "text-accent-primary", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
                    ] })
                  }
                )
              ]
            },
            entry.id
          ))
        ) : (
          // Grouped by domain
          domainGroups.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 last:mb-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-2 py-1.5 rounded-md bg-forge-bg-tertiary/30 mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold uppercase tracking-wider text-forge-text-secondary", children: [
                "@",
                group.domain
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "default", children: group.emails.length })
            ] }),
            group.emails.map((entry) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "div",
              {
                className: "flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-forge-bg-tertiary/20 group transition-colors",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "flex-1 text-xs text-forge-text truncate", children: entry.email }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => handleCopyEmail(entry.email, entry.id),
                      className: "p-1 rounded text-forge-text-muted hover:text-accent-primary transition-colors opacity-0 group-hover:opacity-100",
                      children: copiedId === entry.id ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", className: "text-accent-primary", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
                      ] })
                    }
                  )
                ]
              },
              entry.id
            ))
          ] }, group.domain))
        )
      }
    )
  ] });
};
const EmailResults$1 = React$2.memo(EmailResults);

const DEFAULT_CRAWL = {
  depth: 2,
  maxPages: 50,
  respectRobots: true,
  internalOnly: true,
  delayMs: 1e3
};
const EmailExtractorView = () => {
  const { error, setError } = useStore();
  const [inputMode, setInputMode] = reactExports.useState("single");
  const [singleUrl, setSingleUrl] = reactExports.useState("");
  const [urlList, setUrlList] = reactExports.useState("");
  const [crawlSettings, setCrawlSettings] = reactExports.useState(DEFAULT_CRAWL);
  const [status, setStatus] = reactExports.useState("idle");
  const [emails, setEmails] = reactExports.useState([]);
  const [crawledPages, setCrawledPages] = reactExports.useState(0);
  const [totalPages, setTotalPages] = reactExports.useState(0);
  const abortRef = reactExports.useRef(false);
  const handleUseCurrentUrl = reactExports.useCallback(async () => {
    try {
      const tab = await getActiveTab();
      if (tab?.url) {
        setSingleUrl(tab.url);
      }
    } catch {
      setError("Could not get current tab URL");
    }
  }, [setError]);
  const handleStartExtraction = reactExports.useCallback(async () => {
    setError(null);
    setEmails([]);
    setCrawledPages(0);
    setStatus("crawling");
    abortRef.current = false;
    let targetUrls = [];
    if (inputMode === "single") {
      if (!singleUrl.trim()) {
        setError("Please enter a URL");
        setStatus("idle");
        return;
      }
      targetUrls = [singleUrl.trim()];
    } else if (inputMode === "list") {
      targetUrls = urlList.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
      if (targetUrls.length === 0) {
        setError("Please enter at least one URL");
        setStatus("idle");
        return;
      }
    } else {
      if (!singleUrl.trim()) {
        setError("Please enter a seed URL for crawling");
        setStatus("idle");
        return;
      }
      targetUrls = [singleUrl.trim()];
    }
    setTotalPages(inputMode === "crawl" ? crawlSettings.maxPages : targetUrls.length);
    try {
      const removeListener = chrome.runtime.onMessage.addListener(
        (message) => {
          if (message.type === "EMAIL_FOUND" && message.email) {
            setEmails((prev) => {
              if (prev.some((e) => e.email === message.email.email)) return prev;
              return [...prev, { ...message.email, id: generatePrefixedId("eml"), foundAt: Date.now() }];
            });
          }
          if (message.type === "CRAWL_PROGRESS" && message.progress) {
            setCrawledPages(message.progress.crawled);
            setTotalPages(message.progress.total);
          }
        }
      );
      await sendRuntimeMessage({
        type: "EXTRACT_EMAILS",
        urls: targetUrls,
        mode: inputMode,
        crawlSettings: inputMode === "crawl" ? crawlSettings : void 0
      });
      chrome.runtime.onMessage.removeListener(removeListener);
      setStatus("completed");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Extraction failed");
    }
  }, [inputMode, singleUrl, urlList, crawlSettings, setError]);
  const handleStop = reactExports.useCallback(() => {
    abortRef.current = true;
    sendRuntimeMessage({ type: "STOP_EXTRACTION" }).catch(() => {
    });
    setStatus("completed");
  }, []);
  const handleTogglePause = reactExports.useCallback(() => {
    if (status === "crawling") {
      setStatus("paused");
      sendRuntimeMessage({ type: "PAUSE_EXTRACTION" }).catch(() => {
      });
    } else if (status === "paused") {
      setStatus("crawling");
      sendRuntimeMessage({ type: "RESUME_EXTRACTION" }).catch(() => {
      });
    }
  }, [status]);
  const isBusy = status === "crawling" || status === "paused";
  const progressPct = totalPages > 0 ? Math.round(crawledPages / totalPages * 100) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pt-4 pb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-sm font-bold text-forge-text flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-accent-primary", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "22,6 12,13 2,6" })
      ] }),
      "Email Extractor",
      emails.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: "success", children: [
        emails.length,
        " found"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary", children: "Source" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex rounded-lg border border-forge-border overflow-hidden", children: ["single", "list", "crawl"].map((mode) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setInputMode(mode),
            disabled: isBusy,
            className: [
              "flex-1 py-2 text-xs font-semibold capitalize transition-all duration-200",
              inputMode === mode ? "bg-accent-primary/15 text-accent-primary" : "bg-forge-bg-secondary text-forge-text-muted hover:text-forge-text-secondary hover:bg-forge-bg-tertiary/40"
            ].join(" "),
            children: mode === "single" ? "Single URL" : mode === "list" ? "URL List" : "Domain Crawl"
          },
          mode
        )) })
      ] }),
      inputMode === "single" || inputMode === "crawl" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary", children: inputMode === "crawl" ? "Seed URL" : "Target URL" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: singleUrl,
              onChange: (e) => setSingleUrl(e.target.value),
              placeholder: "https://example.com",
              disabled: isBusy,
              className: "flex-1 h-9 px-3 rounded-lg bg-forge-bg-secondary border border-forge-border text-sm text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors disabled:opacity-50"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: handleUseCurrentUrl, disabled: isBusy, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "15 3 21 3 21 9" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "10", y1: "14", x2: "21", y2: "3" })
          ] }) })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary", children: "URLs (one per line)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: urlList,
            onChange: (e) => setUrlList(e.target.value),
            placeholder: "https://example.com/page-1\nhttps://example.com/page-2\nhttps://example.com/page-3",
            disabled: isBusy,
            className: "w-full h-32 px-3 py-2 rounded-lg bg-forge-bg-secondary border border-forge-border text-sm text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors resize-none disabled:opacity-50 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent",
            spellCheck: false
          }
        )
      ] }),
      inputMode === "crawl" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        CrawlConfig$1,
        {
          settings: crawlSettings,
          onChange: setCrawlSettings,
          disabled: isBusy
        }
      ),
      inputMode !== "crawl" && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 py-2 cursor-pointer group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: [
              "relative w-9 h-5 rounded-full transition-colors duration-200",
              crawlSettings.respectRobots ? "bg-accent-primary" : "bg-forge-border"
            ].join(" "),
            onClick: () => setCrawlSettings((prev) => ({ ...prev, respectRobots: !prev.respectRobots })),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: [
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                  crawlSettings.respectRobots ? "translate-x-[18px]" : "translate-x-0.5"
                ].join(" ")
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-forge-text-secondary group-hover:text-forge-text transition-colors", children: "Respect robots.txt" }) })
      ] }),
      isBusy && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 animate-fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-accent-primary", children: status === "paused" ? "Paused" : "Crawling..." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-forge-text-muted", children: [
            crawledPages,
            "/",
            totalPages,
            " pages"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-1.5 rounded-full bg-forge-bg-tertiary overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
              style: {
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, #10B981, #14B8A6)",
                boxShadow: "0 0 8px rgba(16, 185, 129, 0.4)"
              }
            }
          ),
          status === "crawling" && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "absolute inset-y-0 w-16 animate-scanner",
              style: {
                background: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)"
              }
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        !isBusy && status !== "completed" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "primary",
            onClick: handleStartExtraction,
            iconLeft: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "8" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
            ] }),
            children: "Extract Emails"
          }
        ),
        isBusy && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "secondary", size: "sm", onClick: handleTogglePause, children: status === "paused" ? "Resume" : "Pause" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "danger", size: "sm", onClick: handleStop, children: "Stop" })
        ] }),
        status === "completed" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "secondary",
            size: "sm",
            onClick: () => {
              setStatus("idle");
              setEmails([]);
              setCrawledPages(0);
            },
            children: "New Extraction"
          }
        )
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-2 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-xs flex items-start gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "shrink-0 mt-0.5", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "9", x2: "15", y2: "15" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: error })
      ] }),
      emails.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(EmailResults$1, { emails }),
      status === "completed" && emails.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-8 gap-3 rounded-xl border border-dashed border-forge-border/60 bg-forge-bg-secondary/30 animate-fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-forge-bg-tertiary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: "text-forge-text-muted", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "22,6 12,13 2,6" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-forge-text-secondary", children: "No emails found" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted text-center max-w-[200px]", children: "Try a different URL or increase crawl depth" })
      ] })
    ] }) })
  ] });
};

const FORMAT_COLORS = {
  jpg: "bg-emerald-500/20 text-emerald-400",
  jpeg: "bg-emerald-500/20 text-emerald-400",
  png: "bg-teal-500/20 text-teal-400",
  gif: "bg-amber-500/20 text-amber-400",
  webp: "bg-violet-500/20 text-violet-400",
  svg: "bg-rose-500/20 text-rose-400",
  avif: "bg-cyan-500/20 text-cyan-400",
  ico: "bg-slate-500/20 text-slate-400"
};
function getFormatColor(format) {
  return FORMAT_COLORS[format.toLowerCase()] ?? "bg-forge-bg-tertiary text-forge-text-muted";
}
const LazyImage = ({
  src,
  alt,
  className = ""
}) => {
  const [loaded, setLoaded] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(false);
  const imgRef = reactExports.useRef(null);
  const observerRef = reactExports.useRef(null);
  const [inView, setInView] = reactExports.useState(false);
  reactExports.useEffect(() => {
    const el = imgRef.current;
    if (!el) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    observerRef.current.observe(el);
    return () => observerRef.current?.disconnect();
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: imgRef, className: `relative ${className}`, children: inView ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    !loaded && !error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-forge-bg-tertiary/60", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-4 h-4 rounded-full border-2 border-accent-primary/30 border-t-accent-primary animate-spin" }) }),
    error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-forge-bg-tertiary/60", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-forge-text-muted", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "9", x2: "15", y2: "15" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "15", y1: "9", x2: "9", y2: "15" })
    ] }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
      "img",
      {
        src,
        alt,
        onLoad: () => setLoaded(true),
        onError: () => setError(true),
        className: [
          "w-full h-full object-cover transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        ].join(" "),
        loading: "lazy"
      }
    )
  ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-forge-bg-tertiary/40" }) });
};
const ImageCard = ({ image, onToggleSelect }) => {
  const handleClick = reactExports.useCallback(() => {
    onToggleSelect(image.id);
  }, [image.id, onToggleSelect]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "button",
    {
      type: "button",
      onClick: handleClick,
      className: [
        "relative group rounded-lg overflow-hidden border transition-all duration-200 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60",
        image.selected ? "border-accent-primary shadow-[0_0_12px_rgba(16,185,129,0.2)]" : "border-forge-border/50 hover:border-forge-border"
      ].join(" "),
      style: { breakInside: "avoid" },
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative bg-forge-bg-tertiary/40", style: { aspectRatio: `${Math.max(image.width, 1)} / ${Math.max(image.height, 1)}`, maxHeight: 200, minHeight: 60 }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          LazyImage,
          {
            src: image.src,
            alt: image.alt,
            className: "w-full h-full"
          }
        ),
        image.selected && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-accent-primary/10 pointer-events-none" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: [
              "absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200",
              image.selected ? "bg-accent-primary scale-100 motion-safe:animate-[scaleIn_0.2s_ease-out]" : "bg-forge-bg/70 backdrop-blur-sm border border-forge-border/50 opacity-0 group-hover:opacity-100"
            ].join(" "),
            children: image.selected ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", className: "text-forge-bg", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-2 h-2 rounded-full bg-forge-text-muted/30" })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-forge-bg/80 backdrop-blur-sm text-[9px] font-mono text-forge-text-secondary opacity-0 group-hover:opacity-100 transition-opacity", children: [
          image.width,
          "×",
          image.height
        ] }),
        image.fileSize > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-forge-bg/80 backdrop-blur-sm text-[9px] font-mono text-forge-text-muted opacity-0 group-hover:opacity-100 transition-opacity", children: formatFileSize(image.fileSize) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: [
              "absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
              getFormatColor(image.format)
            ].join(" "),
            children: image.format
          }
        )
      ] })
    }
  );
};
const ImageGrid = ({ images, onToggleSelect }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: "columns-2 gap-2 space-y-2",
      style: { columnFill: "balance" },
      children: images.map((image) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        ImageCard,
        {
          image,
          onToggleSelect
        },
        image.id
      ))
    }
  );
};
const ImageGrid$1 = React$2.memo(ImageGrid);

const CATEGORIES = [
  {
    key: "all",
    label: "All",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "7", height: "7" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "3", width: "7", height: "7" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "14", width: "7", height: "7" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "14", width: "7", height: "7" })
    ] })
  },
  {
    key: "photos",
    label: "Photos",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "21 15 16 10 5 21" })
    ] })
  },
  {
    key: "icons",
    label: "Icons",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "12", x2: "16", y2: "12" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "8", x2: "12", y2: "16" })
    ] })
  },
  {
    key: "logos",
    label: "Logos",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polygon", { points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" }) })
  },
  {
    key: "banners",
    label: "Banners",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "2", y: "7", width: "20", height: "10", rx: "2", ry: "2" }) })
  },
  {
    key: "svg",
    label: "SVG",
    icon: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "16 18 22 12 16 6" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "8 6 2 12 8 18" })
    ] })
  }
];
const CategoryFilter = ({
  activeCategory,
  onCategoryChange,
  counts
}) => {
  const scrollRef = reactExports.useRef(null);
  const activeRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const tab = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();
      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        tab.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeCategory]);
  const handleClick = reactExports.useCallback(
    (category) => {
      onCategoryChange(category);
    },
    [onCategoryChange]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref: scrollRef,
      className: "flex items-center gap-1 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1",
      role: "tablist",
      "aria-label": "Image categories",
      children: CATEGORIES.map(({ key, label, icon }) => {
        const isActive = activeCategory === key;
        const count = counts[key] ?? 0;
        if (key !== "all" && count === 0) return null;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            ref: isActive ? activeRef : void 0,
            type: "button",
            role: "tab",
            "aria-selected": isActive,
            onClick: () => handleClick(key),
            className: [
              "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0",
              isActive ? "bg-accent-primary/15 text-accent-primary" : "text-forge-text-muted hover:text-forge-text-secondary hover:bg-forge-bg-tertiary/40"
            ].join(" "),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0", children: icon }),
              label,
              count > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: [
                    "inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold leading-none",
                    isActive ? "bg-accent-primary/25 text-accent-primary" : "bg-forge-bg-tertiary text-forge-text-muted"
                  ].join(" "),
                  children: count
                }
              ),
              isActive && /* @__PURE__ */ jsxRuntimeExports.jsx(
                "div",
                {
                  className: "absolute bottom-0 left-2 right-2 h-0.5 rounded-full",
                  style: {
                    background: "linear-gradient(90deg, #10B981, #14B8A6)",
                    boxShadow: "0 0 6px rgba(16, 185, 129, 0.4)"
                  }
                }
              )
            ]
          },
          key
        );
      })
    }
  );
};
const CategoryFilter$1 = React$2.memo(CategoryFilter);

const DownloadProgress = ({ state }) => {
  const {
    isDownloading,
    mode,
    completed,
    total,
    currentFile,
    errors,
    zipReady,
    zipUrl
  } = state;
  const percentage = reactExports.useMemo(
    () => total > 0 ? Math.round(completed / total * 100) : 0,
    [completed, total]
  );
  const isComplete = !isDownloading && completed === total && total > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 rounded-xl border border-forge-border bg-forge-bg-secondary/40 p-4 animate-fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold uppercase tracking-wider text-forge-text-secondary flex items-center gap-2", children: isDownloading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-accent-primary animate-spin", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10", className: "opacity-25" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2a10 10 0 0 1 10 10", className: "opacity-75" })
        ] }),
        mode === "zip" ? "Creating ZIP..." : "Downloading..."
      ] }) : isComplete ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", className: "text-status-success", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) }),
        mode === "zip" ? "ZIP Ready" : "Download Complete"
      ] }) : "Download" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[11px] font-mono text-forge-text-muted", children: [
        completed,
        "/",
        total
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative h-2 rounded-full bg-forge-bg-tertiary overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
          style: {
            width: `${percentage}%`,
            background: errors.length > 0 ? "linear-gradient(90deg, #10B981, #F59E0B)" : "linear-gradient(90deg, #10B981, #14B8A6)",
            boxShadow: isComplete ? "0 0 12px rgba(16, 185, 129, 0.5)" : "0 0 8px rgba(16, 185, 129, 0.3)"
          }
        }
      ),
      isDownloading && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "absolute inset-y-0 w-16 animate-scanner",
          style: {
            background: "linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)"
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono font-bold text-accent-primary", children: [
        percentage,
        "%"
      ] }),
      isDownloading && currentFile && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-forge-text-muted truncate max-w-[180px] font-mono text-[10px]", children: currentFile })
    ] }),
    mode === "zip" && isDownloading && completed === total && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-forge-text-secondary animate-pulse", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-accent-primary", "aria-hidden": "true", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "7 10 12 15 17 10" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
      ] }),
      "Compressing files into ZIP archive..."
    ] }),
    zipReady && zipUrl && /* @__PURE__ */ jsxRuntimeExports.jsx(
      Button,
      {
        variant: "primary",
        size: "sm",
        onClick: () => {
          const a = document.createElement("a");
          a.href = zipUrl;
          a.download = `dataforge-images-${Date.now()}.zip`;
          a.click();
        },
        iconLeft: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "7 10 12 15 17 10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
        ] }),
        children: "Save ZIP"
      }
    ),
    errors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1 mt-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] font-semibold text-status-error", children: [
        errors.length,
        " error",
        errors.length !== 1 ? "s" : "",
        ":"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent", children: errors.map((err, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-status-error/70 font-mono truncate", children: err }, i)) })
    ] })
  ] });
};
const DownloadProgress$1 = React$2.memo(DownloadProgress);

function categorizeImage(img) {
  if (img.format === "svg" || img.src.endsWith(".svg")) return "svg";
  const ratio = img.width / Math.max(img.height, 1);
  if (img.width <= 64 && img.height <= 64) return "icons";
  if (img.width <= 300 && img.height <= 100 && ratio > 1.5) return "logos";
  if (ratio > 3 && img.width > 300) return "banners";
  if (img.width >= 200 && img.height >= 200) return "photos";
  return "photos";
}
const ImageDownloaderView = () => {
  const { error, setError } = useStore();
  const [images, setImages] = reactExports.useState([]);
  const [isScanning, setIsScanning] = reactExports.useState(false);
  const [activeCategory, setActiveCategory] = reactExports.useState("all");
  const [minWidth, setMinWidth] = reactExports.useState(0);
  const [minHeight, setMinHeight] = reactExports.useState(0);
  const [downloadState, setDownloadState] = reactExports.useState({
    isDownloading: false,
    mode: "zip",
    completed: 0,
    total: 0,
    currentFile: "",
    errors: [],
    zipReady: false,
    zipUrl: null
  });
  const [filenamePattern, setFilenamePattern] = reactExports.useState("{original}");
  const handleScan = reactExports.useCallback(async () => {
    setIsScanning(true);
    setError(null);
    setImages([]);
    try {
      const tab = await getActiveTab();
      if (!tab?.id) {
        setError("No active tab found");
        setIsScanning(false);
        return;
      }
      const response = await sendRuntimeMessage({ type: "EXTRACT_IMAGES" });
      if (response?.error) {
        setError(response.error);
        setIsScanning(false);
        return;
      }
      const detected = (response?.images ?? []).map((img) => ({
        id: generatePrefixedId("img"),
        src: img.src,
        alt: img.alt || "",
        width: img.width || 0,
        height: img.height || 0,
        fileSize: img.fileSize || 0,
        format: img.format || "unknown",
        category: categorizeImage(img),
        selected: false
      }));
      setImages(detected);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan page");
    } finally {
      setIsScanning(false);
    }
  }, [setError]);
  reactExports.useEffect(() => {
    handleScan();
  }, []);
  const filteredImages = reactExports.useMemo(() => {
    return images.filter((img) => {
      if (activeCategory !== "all" && img.category !== activeCategory) return false;
      if (img.width < minWidth) return false;
      if (img.height < minHeight) return false;
      return true;
    });
  }, [images, activeCategory, minWidth, minHeight]);
  const categoryCounts = reactExports.useMemo(() => {
    const counts = {
      all: images.length,
      photos: 0,
      icons: 0,
      logos: 0,
      banners: 0,
      svg: 0
    };
    for (const img of images) {
      if (img.category in counts && img.category !== "all") {
        counts[img.category]++;
      }
    }
    return counts;
  }, [images]);
  const selectedImages = reactExports.useMemo(
    () => filteredImages.filter((img) => img.selected),
    [filteredImages]
  );
  const handleToggleSelect = reactExports.useCallback((id) => {
    setImages(
      (prev) => prev.map((img) => img.id === id ? { ...img, selected: !img.selected } : img)
    );
  }, []);
  const handleSelectAll = reactExports.useCallback(() => {
    const filteredIds = new Set(filteredImages.map((img) => img.id));
    const allSelected = filteredImages.every((img) => img.selected);
    setImages(
      (prev) => prev.map(
        (img) => filteredIds.has(img.id) ? { ...img, selected: !allSelected } : img
      )
    );
  }, [filteredImages]);
  reactExports.useCallback(
    (category) => {
      setImages(
        (prev) => prev.map(
          (img) => img.category === category ? { ...img, selected: true } : img
        )
      );
    },
    []
  );
  const handleDeselectAll = reactExports.useCallback(() => {
    setImages((prev) => prev.map((img) => ({ ...img, selected: false })));
  }, []);
  const handleDownload = reactExports.useCallback(
    async (mode) => {
      if (selectedImages.length === 0) return;
      setDownloadState({
        isDownloading: true,
        mode,
        completed: 0,
        total: selectedImages.length,
        currentFile: "",
        errors: [],
        zipReady: false,
        zipUrl: null
      });
      try {
        const response = await sendRuntimeMessage({
          type: "DOWNLOAD_IMAGES",
          images: selectedImages.map((img) => ({
            src: img.src,
            filename: filenamePattern.replace("{original}", img.src.split("/").pop()?.split("?")[0] || "image").replace("{index}", String(selectedImages.indexOf(img) + 1)).replace("{width}", String(img.width)).replace("{height}", String(img.height))
          })),
          mode
        });
        setDownloadState((prev) => ({
          ...prev,
          isDownloading: false,
          completed: prev.total,
          zipReady: mode === "zip" && !!response?.zipUrl,
          zipUrl: response?.zipUrl ?? null,
          errors: response?.errors ?? []
        }));
      } catch (err) {
        setDownloadState((prev) => ({
          ...prev,
          isDownloading: false,
          errors: [...prev.errors, err instanceof Error ? err.message : "Download failed"]
        }));
      }
    },
    [selectedImages, filenamePattern]
  );
  const totalSelectedSize = reactExports.useMemo(
    () => selectedImages.reduce((sum, img) => sum + img.fileSize, 0),
    [selectedImages]
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pt-4 pb-2 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-sm font-bold text-forge-text flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-accent-primary", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "21 15 16 10 5 21" })
        ] }),
        "Images",
        images.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "default", children: images.length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: handleScan,
          loading: isScanning,
          children: isScanning ? "Scanning" : "Rescan"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
      images.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        CategoryFilter$1,
        {
          activeCategory,
          onCategoryChange: setActiveCategory,
          counts: categoryCounts
        }
      ),
      images.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold text-forge-text-muted uppercase", children: "Min W" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: 0,
              max: 1e3,
              step: 50,
              value: minWidth,
              onChange: (e) => setMinWidth(Number(e.target.value)),
              className: "w-16 h-1 rounded-full appearance-none bg-forge-border accent-accent-primary"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-mono text-forge-text-muted w-8", children: [
            minWidth,
            "px"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] font-semibold text-forge-text-muted uppercase", children: "Min H" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "range",
              min: 0,
              max: 1e3,
              step: 50,
              value: minHeight,
              onChange: (e) => setMinHeight(Number(e.target.value)),
              className: "w-16 h-1 rounded-full appearance-none bg-forge-border accent-accent-primary"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-mono text-forge-text-muted w-8", children: [
            minHeight,
            "px"
          ] })
        ] })
      ] }),
      filteredImages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleSelectAll,
            className: "font-medium text-accent-primary hover:text-accent-tertiary transition-colors",
            children: filteredImages.every((img) => img.selected) ? "Deselect all" : "Select all"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-forge-text-muted", children: "|" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: handleDeselectAll,
            className: "font-medium text-forge-text-muted hover:text-forge-text-secondary transition-colors",
            children: "None"
          }
        ),
        selectedImages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-forge-text-muted", children: "|" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-forge-text-secondary font-medium", children: [
            selectedImages.length,
            " selected"
          ] }),
          totalSelectedSize > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-forge-text-muted font-mono text-[10px]", children: [
            "(",
            formatFileSize(totalSelectedSize),
            ")"
          ] })
        ] })
      ] }),
      isScanning && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 gap-4 animate-fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative w-16 h-16", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full border-2 border-accent-primary/20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-full border-2 border-transparent border-t-accent-primary animate-spin" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-3 rounded-full bg-accent-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-accent-primary", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "21 15 16 10 5 21" })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-forge-text-secondary", children: "Detecting images..." })
      ] }),
      !isScanning && images.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 gap-3 rounded-xl border border-dashed border-forge-border/60 bg-forge-bg-secondary/30 animate-fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-forge-bg-tertiary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: "text-forge-text-muted", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "8.5", cy: "8.5", r: "1.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "21 15 16 10 5 21" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-forge-text-secondary", children: "No images found" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted text-center max-w-[200px]", children: "Navigate to a page with images and click Rescan" })
      ] }),
      !isScanning && filteredImages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        ImageGrid$1,
        {
          images: filteredImages,
          onToggleSelect: handleToggleSelect
        }
      ),
      selectedImages.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary", children: "Filename Pattern" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: filenamePattern,
            onChange: (e) => setFilenamePattern(e.target.value),
            placeholder: "{original}",
            className: "h-8 px-3 rounded-lg bg-forge-bg-secondary border border-forge-border text-xs text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] text-forge-text-muted", children: [
          "Variables: ",
          "{original}",
          ", ",
          "{index}",
          ", ",
          "{width}",
          ", ",
          "{height}"
        ] })
      ] }),
      selectedImages.length > 0 && !downloadState.isDownloading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Button,
          {
            variant: "primary",
            size: "sm",
            onClick: () => handleDownload("zip"),
            iconLeft: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "7 10 12 15 17 10" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
            ] }),
            children: [
              "Download ZIP (",
              selectedImages.length,
              ")"
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "secondary",
            size: "sm",
            onClick: () => handleDownload("individual"),
            children: "Individual"
          }
        )
      ] }),
      (downloadState.isDownloading || downloadState.zipReady) && /* @__PURE__ */ jsxRuntimeExports.jsx(DownloadProgress$1, { state: downloadState }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-3 py-2 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-xs", children: error })
    ] }) })
  ] });
};

function useTypewriter(text, enabled, speed = 15) {
  const [displayedText, setDisplayedText] = reactExports.useState("");
  const indexRef = reactExports.useRef(0);
  const timeoutRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!enabled) {
      setDisplayedText(text);
      return;
    }
    setDisplayedText("");
    indexRef.current = 0;
    const type = () => {
      if (indexRef.current < text.length) {
        const chunkSize = Math.min(3, text.length - indexRef.current);
        indexRef.current += chunkSize;
        setDisplayedText(text.slice(0, indexRef.current));
        timeoutRef.current = setTimeout(type, speed);
      }
    };
    timeoutRef.current = setTimeout(type, 100);
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, enabled, speed]);
  return enabled ? displayedText : text;
}
const TextPreview = ({
  text,
  formattedOutput,
  outputFormat,
  typewriterEnabled,
  onCopy,
  onExport
}) => {
  const [copied, setCopied] = reactExports.useState(false);
  const displayText = useTypewriter(formattedOutput, typewriterEnabled);
  const handleCopy = reactExports.useCallback(() => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2e3);
  }, [onCopy]);
  const renderedContent = reactExports.useMemo(() => {
    if (outputFormat === "json") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { className: "text-xs font-mono text-forge-text-secondary whitespace-pre-wrap break-words leading-relaxed", children: displayText });
    }
    if (outputFormat === "plaintext") {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-forge-text-secondary whitespace-pre-wrap break-words leading-relaxed", children: displayText });
    }
    const lines = displayText.split("\n");
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "prose-forge text-xs leading-relaxed", children: lines.map((line, i) => {
      if (line.startsWith("# ")) {
        return /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-base font-bold text-forge-text mb-2 mt-1", children: line.slice(2) }, i);
      }
      if (line.startsWith("## ")) {
        return /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-bold text-forge-text mb-1.5 mt-3", children: line.slice(3) }, i);
      }
      if (line.startsWith("### ")) {
        return /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xs font-bold text-forge-text mb-1 mt-2", children: line.slice(4) }, i);
      }
      if (line.trim() === "---") {
        return /* @__PURE__ */ jsxRuntimeExports.jsx("hr", { className: "my-3 border-forge-border" }, i);
      }
      if (line.includes("**")) {
        const parts = line.split(/(\*\*[^*]+\*\*)/);
        return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-forge-text-secondary mb-1", children: parts.map((part, j) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "font-bold text-forge-text", children: part.slice(2, -2) }, j);
          }
          return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: part }, j);
        }) }, i);
      }
      if (line.trim() === "") {
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2" }, i);
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-forge-text-secondary mb-1", children: line }, i);
    }) });
  }, [displayText, outputFormat]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3 animate-fade-in", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-2 rounded-xl border border-forge-border bg-forge-bg-secondary/40 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-forge-text leading-tight", children: text.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-x-3 gap-y-1", children: [
        text.author && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-[10px] text-forge-text-secondary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "7", r: "4" })
          ] }),
          text.author
        ] }),
        text.date && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-[10px] text-forge-text-muted", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2", ry: "2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "16", y1: "2", x2: "16", y2: "6" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "2", x2: "8", y2: "6" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "10", x2: "21", y2: "10" })
          ] }),
          text.date
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-[10px] text-forge-text-muted", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "14 2 14 8 20 8" })
          ] }),
          formatNumber(text.wordCount),
          " words"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex items-center gap-1 text-[10px] text-forge-text-muted", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "12 6 12 12 16 14" })
          ] }),
          text.readingTime,
          " min read"
        ] }),
        text.language && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "default", children: text.language.toUpperCase() })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: handleCopy,
          iconLeft: copied ? /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", className: "text-accent-primary", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
          ] }),
          children: copied ? "Copied" : "Copy"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: onExport,
          iconLeft: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "7 10 12 15 17 10" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "15", x2: "12", y2: "3" })
          ] }),
          children: "Export"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
      typewriterEnabled && displayText.length < formattedOutput.length && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-accent-primary animate-pulse text-sm font-mono", children: "|" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-forge-border bg-forge-bg-secondary/30 p-4 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent", children: renderedContent })
  ] });
};
const TextPreview$1 = React$2.memo(TextPreview);

function estimateReadingTime(wordCount) {
  return Math.ceil(wordCount / 225);
}
function convertToFormat(text, format) {
  switch (format) {
    case "markdown":
      return [
        `# ${text.title}`,
        "",
        text.author ? `**Author:** ${text.author}` : "",
        text.date ? `**Date:** ${text.date}` : "",
        text.language ? `**Language:** ${text.language}` : "",
        `**Word Count:** ${formatNumber(text.wordCount)}`,
        `**Reading Time:** ${text.readingTime} min`,
        "",
        "---",
        "",
        text.body
      ].filter(Boolean).join("\n");
    case "plaintext":
      return [
        text.title,
        "=".repeat(text.title.length),
        "",
        text.author ? `Author: ${text.author}` : "",
        text.date ? `Date: ${text.date}` : "",
        `Word Count: ${text.wordCount}`,
        `Reading Time: ${text.readingTime} min`,
        "",
        text.body
      ].filter(Boolean).join("\n");
    case "json":
      return JSON.stringify(
        {
          title: text.title,
          author: text.author || null,
          date: text.date || null,
          language: text.language || null,
          wordCount: text.wordCount,
          readingTimeMinutes: text.readingTime,
          url: text.url,
          extractedAt: new Date(text.extractedAt).toISOString(),
          body: text.body
        },
        null,
        2
      );
    default:
      return text.body;
  }
}
const TextExtractorView = () => {
  const { error, setError } = useStore();
  const [isBulkMode, setIsBulkMode] = reactExports.useState(false);
  const [bulkUrls, setBulkUrls] = reactExports.useState("");
  const [outputFormat, setOutputFormat] = reactExports.useState("markdown");
  const [typewriterEnabled, setTypewriterEnabled] = reactExports.useState(false);
  const [status, setStatus] = reactExports.useState("idle");
  const [extractedTexts, setExtractedTexts] = reactExports.useState([]);
  const [activeTextId, setActiveTextId] = reactExports.useState(null);
  const abortRef = reactExports.useRef(false);
  const activeText = reactExports.useMemo(
    () => extractedTexts.find((t) => t.id === activeTextId) ?? extractedTexts[0] ?? null,
    [extractedTexts, activeTextId]
  );
  const formattedOutput = reactExports.useMemo(
    () => activeText ? convertToFormat(activeText, outputFormat) : "",
    [activeText, outputFormat]
  );
  const handleExtractCurrent = reactExports.useCallback(async () => {
    setError(null);
    setStatus("extracting");
    try {
      const tab = await getActiveTab();
      if (!tab?.id || !tab.url) {
        setError("No active tab found");
        setStatus("error");
        return;
      }
      const response = await sendRuntimeMessage({ type: "EXTRACT_TEXT" });
      if (response?.error) {
        setError(response.error);
        setStatus("error");
        return;
      }
      const body = response?.body ?? "";
      const wordCount = body.split(/\s+/).filter(Boolean).length;
      const extracted = {
        id: generatePrefixedId("txt"),
        url: tab.url,
        title: response?.title ?? tab.title ?? "Untitled",
        author: response?.author ?? "",
        date: response?.date ?? "",
        body,
        wordCount,
        readingTime: estimateReadingTime(wordCount),
        language: response?.language ?? "",
        extractedAt: Date.now()
      };
      setExtractedTexts([extracted]);
      setActiveTextId(extracted.id);
      setStatus("completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Extraction failed");
      setStatus("error");
    }
  }, [setError]);
  const handleBulkExtract = reactExports.useCallback(async () => {
    const urls = bulkUrls.split(/[\n\r]+/).map((l) => l.trim()).filter(Boolean);
    if (urls.length === 0) {
      setError("Enter at least one URL");
      return;
    }
    setError(null);
    setStatus("extracting");
    setExtractedTexts([]);
    abortRef.current = false;
    const results = [];
    for (const url of urls) {
      if (abortRef.current) break;
      try {
        const response = await sendRuntimeMessage({
          type: "EXTRACT_TEXT",
          url
        });
        const body = response?.body ?? "";
        const wordCount = body.split(/\s+/).filter(Boolean).length;
        const extracted = {
          id: generatePrefixedId("txt"),
          url,
          title: response?.title ?? "Untitled",
          author: response?.author ?? "",
          date: response?.date ?? "",
          body,
          wordCount,
          readingTime: estimateReadingTime(wordCount),
          language: response?.language ?? "",
          extractedAt: Date.now()
        };
        results.push(extracted);
        setExtractedTexts([...results]);
        if (!activeTextId && results.length === 1) {
          setActiveTextId(extracted.id);
        }
      } catch {
      }
    }
    setStatus("completed");
  }, [bulkUrls, activeTextId, setError]);
  const handleStop = reactExports.useCallback(() => {
    abortRef.current = true;
    setStatus("completed");
  }, []);
  const handleExport = reactExports.useCallback(() => {
    if (!activeText) return;
    const formatted = convertToFormat(activeText, outputFormat);
    const mimeMap = {
      markdown: "text/markdown",
      plaintext: "text/plain",
      json: "application/json"
    };
    const extMap = {
      markdown: ".md",
      plaintext: ".txt",
      json: ".json"
    };
    const blob = new Blob([formatted], { type: `${mimeMap[outputFormat]}; charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeText.title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}${extMap[outputFormat]}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeText, outputFormat]);
  const handleCopy = reactExports.useCallback(async () => {
    if (!formattedOutput) return;
    try {
      await navigator.clipboard.writeText(formattedOutput);
    } catch {
    }
  }, [formattedOutput]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pt-4 pb-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-sm font-bold text-forge-text flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-accent-primary", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "14 2 14 8 20 8" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "16", y1: "17", x2: "8", y2: "17" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "10 9 9 9 8 9" })
        ] }),
        "Text Extractor"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 cursor-pointer", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-semibold text-forge-text-muted uppercase", children: "Bulk" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: [
              "relative w-8 h-4.5 rounded-full transition-colors duration-200",
              isBulkMode ? "bg-accent-primary" : "bg-forge-border"
            ].join(" "),
            onClick: () => setIsBulkMode(!isBulkMode),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: [
                  "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform duration-200",
                  isBulkMode ? "translate-x-[14px]" : "translate-x-0.5"
                ].join(" ")
              }
            )
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4", children: [
      isBulkMode && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5 animate-fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary", children: "URLs (one per line)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "textarea",
          {
            value: bulkUrls,
            onChange: (e) => setBulkUrls(e.target.value),
            placeholder: "https://example.com/article-1\nhttps://example.com/article-2",
            disabled: status === "extracting",
            className: "w-full h-28 px-3 py-2 rounded-lg bg-forge-bg-secondary border border-forge-border text-sm text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors resize-none disabled:opacity-50 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent",
            spellCheck: false
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary", children: "Output Format" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex rounded-lg border border-forge-border overflow-hidden", children: ["markdown", "plaintext", "json"].map((fmt) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => setOutputFormat(fmt),
            className: [
              "flex-1 py-2 text-xs font-semibold capitalize transition-all duration-200",
              outputFormat === fmt ? "bg-accent-primary/15 text-accent-primary" : "bg-forge-bg-secondary text-forge-text-muted hover:text-forge-text-secondary hover:bg-forge-bg-tertiary/40"
            ].join(" "),
            children: fmt === "plaintext" ? "Plain Text" : fmt === "json" ? "JSON" : "Markdown"
          },
          fmt
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-3 cursor-pointer group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: [
              "relative w-9 h-5 rounded-full transition-colors duration-200",
              typewriterEnabled ? "bg-accent-primary" : "bg-forge-border"
            ].join(" "),
            onClick: () => setTypewriterEnabled(!typewriterEnabled),
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: [
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200",
                  typewriterEnabled ? "translate-x-[18px]" : "translate-x-0.5"
                ].join(" ")
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-forge-text-secondary group-hover:text-forge-text transition-colors", children: "Typewriter animation" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        status !== "extracting" && /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "primary",
            onClick: isBulkMode ? handleBulkExtract : handleExtractCurrent,
            iconLeft: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "14 2 14 8 20 8" })
            ] }),
            children: isBulkMode ? "Extract All" : "Extract Current Page"
          }
        ),
        status === "extracting" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "primary", loading: true, disabled: true, children: "Extracting..." }),
          isBulkMode && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "danger", size: "sm", onClick: handleStop, children: "Stop" })
        ] })
      ] }),
      extractedTexts.length > 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-1 overflow-x-auto scrollbar-none pb-1", children: extractedTexts.map((text, index) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setActiveTextId(text.id),
          className: [
            "px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all duration-200 shrink-0",
            activeTextId === text.id ? "bg-accent-primary/15 text-accent-primary" : "text-forge-text-muted hover:text-forge-text-secondary hover:bg-forge-bg-tertiary/40"
          ].join(" "),
          children: text.title.length > 25 ? text.title.slice(0, 25) + "..." : text.title || `Page ${index + 1}`
        },
        text.id
      )) }),
      activeText && /* @__PURE__ */ jsxRuntimeExports.jsx(
        TextPreview$1,
        {
          text: activeText,
          formattedOutput,
          outputFormat,
          typewriterEnabled,
          onCopy: handleCopy,
          onExport: handleExport
        }
      ),
      error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-3 py-2 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-xs flex items-start gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "shrink-0 mt-0.5", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "9", x2: "15", y2: "15" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex-1", children: error })
      ] }),
      status === "idle" && extractedTexts.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-8 gap-3 rounded-xl border border-dashed border-forge-border/60 bg-forge-bg-secondary/30", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-12 rounded-full bg-accent-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: "text-accent-primary", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "14 2 14 8 20 8" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "16", y1: "13", x2: "8", y2: "13" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "16", y1: "17", x2: "8", y2: "17" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-forge-text-secondary", children: "Extract clean text" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted mt-1", children: "Uses readability engine for article-quality text extraction" })
        ] })
      ] })
    ] }) })
  ] });
};

function getFaviconUrl(domain) {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}
function getSuccessRateBadge(rate) {
  if (rate >= 0.9) return "success";
  if (rate >= 0.7) return "default";
  if (rate >= 0.5) return "warning";
  return "error";
}
const TemplateCard = ({
  template,
  viewMode,
  onApply,
  onEdit,
  onDelete
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = reactExports.useState(false);
  const [faviconError, setFaviconError] = reactExports.useState(false);
  const handleApply = reactExports.useCallback(() => {
    onApply(template.id);
  }, [template.id, onApply]);
  const handleEdit = reactExports.useCallback(
    (e) => {
      e.stopPropagation();
      onEdit(template.id);
    },
    [template.id, onEdit]
  );
  const handleDeleteClick = reactExports.useCallback((e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  }, []);
  const handleDeleteConfirm = reactExports.useCallback(
    (e) => {
      e.stopPropagation();
      onDelete(template.id);
      setShowDeleteConfirm(false);
    },
    [template.id, onDelete]
  );
  const handleDeleteCancel = reactExports.useCallback((e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  }, []);
  const columnCount = template.config.fields.length;
  const successPct = Math.round(template.successRate * 100);
  if (viewMode === "list") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: handleApply,
        className: [
          "group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border transition-all duration-200 text-left",
          "border-forge-border/50 bg-forge-bg-secondary/40",
          "hover:border-accent-primary/30 hover:bg-forge-bg-secondary/60",
          "hover:shadow-[0_0_12px_rgba(16,185,129,0.08)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
        ].join(" "),
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-8 h-8 rounded-lg bg-forge-bg-tertiary/60 flex items-center justify-center shrink-0 overflow-hidden", children: !faviconError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: getFaviconUrl(template.domain),
              alt: "",
              width: 16,
              height: 16,
              onError: () => setFaviconError(true),
              className: "w-4 h-4"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-forge-text-muted", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "2", y1: "12", x2: "22", y2: "12" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-forge-text truncate", children: template.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-forge-text-muted truncate", children: template.domain })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-mono text-forge-text-muted", children: [
              columnCount,
              " col"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: getSuccessRateBadge(template.successRate), children: [
              successPct,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: handleEdit,
                className: "p-1 rounded hover:bg-forge-bg-tertiary text-forge-text-muted hover:text-forge-text-secondary transition-colors",
                title: "Edit",
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })
                ] })
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "button",
                onClick: handleDeleteClick,
                className: "p-1 rounded hover:bg-status-error/10 text-forge-text-muted hover:text-status-error transition-colors",
                title: "Delete",
                children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "3 6 5 6 21 6" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
                ] })
              }
            )
          ] }),
          showDeleteConfirm && /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "absolute right-0 top-full mt-1 z-20 flex items-center gap-1 p-2 rounded-lg border border-status-error/30 bg-forge-bg-secondary shadow-xl animate-scale-in",
              onClick: (e) => e.stopPropagation(),
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-status-error font-medium mr-1", children: "Delete?" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: handleDeleteConfirm,
                    className: "px-2 py-0.5 rounded bg-status-error text-white text-[10px] font-semibold hover:bg-red-600 transition-colors",
                    children: "Yes"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    onClick: handleDeleteCancel,
                    className: "px-2 py-0.5 rounded bg-forge-bg-tertiary text-forge-text-muted text-[10px] font-semibold hover:text-forge-text-secondary transition-colors",
                    children: "No"
                  }
                )
              ]
            }
          )
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: handleApply,
      className: [
        "group relative flex flex-col gap-3 w-full p-4 rounded-xl border transition-all duration-200 text-left",
        "border-forge-border/50 bg-forge-bg-tertiary/40 backdrop-blur-sm",
        "hover:border-accent-primary/30 hover:bg-forge-bg-tertiary/60",
        "hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]",
        "motion-safe:hover:translate-y-[-1px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50"
      ].join(" "),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-10 h-10 rounded-lg bg-forge-bg-secondary/80 border border-forge-border/50 flex items-center justify-center shrink-0 overflow-hidden", children: !faviconError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "img",
            {
              src: getFaviconUrl(template.domain),
              alt: "",
              width: 20,
              height: 20,
              onError: () => setFaviconError(true),
              className: "w-5 h-5"
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: "text-forge-text-muted", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "2", y1: "12", x2: "22", y2: "12" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-bold text-forge-text truncate", children: template.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-forge-text-muted truncate mt-0.5", children: template.domain }),
            template.description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-forge-text-muted/70 truncate mt-0.5", children: template.description })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-forge-text-muted", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "21", x2: "9", y2: "9" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-medium text-forge-text-secondary", children: [
              columnCount,
              " columns"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "10", height: "10", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", className: "text-forge-text-muted", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "12 6 12 12 16 14" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-forge-text-muted", children: template.lastUsed > 0 ? formatDate(template.lastUsed, "relative") : "Never used" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Badge, { variant: getSuccessRateBadge(template.successRate), children: [
            successPct,
            "% success"
          ] })
        ] }),
        template.useCount > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[9px] text-forge-text-muted", children: [
          "Used ",
          template.useCount,
          " time",
          template.useCount !== 1 ? "s" : ""
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleEdit,
              className: "p-1.5 rounded-md bg-forge-bg/80 backdrop-blur-sm hover:bg-forge-bg-tertiary text-forge-text-muted hover:text-forge-text-secondary transition-colors",
              title: "Edit template",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" })
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleDeleteClick,
              className: "p-1.5 rounded-md bg-forge-bg/80 backdrop-blur-sm hover:bg-status-error/10 text-forge-text-muted hover:text-status-error transition-colors",
              title: "Delete template",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "3 6 5 6 21 6" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
              ] })
            }
          )
        ] }),
        showDeleteConfirm && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "absolute top-12 right-3 z-20 flex items-center gap-1 p-2 rounded-lg border border-status-error/30 bg-forge-bg-secondary shadow-xl animate-scale-in",
            onClick: (e) => e.stopPropagation(),
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-status-error font-medium mr-1", children: "Delete?" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: handleDeleteConfirm,
                  className: "px-2 py-1 rounded bg-status-error text-white text-[10px] font-semibold hover:bg-red-600 transition-colors",
                  children: "Yes"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: handleDeleteCancel,
                  className: "px-2 py-1 rounded bg-forge-bg-tertiary text-forge-text-muted text-[10px] font-semibold hover:text-forge-text-secondary transition-colors",
                  children: "No"
                }
              )
            ]
          }
        )
      ]
    }
  );
};
const TemplateCard$1 = React$2.memo(TemplateCard);

const SaveTemplateModal = ({ template, onClose }) => {
  const addTemplate = useStore((s) => s.addTemplate);
  const updateTemplate = useStore((s) => s.updateTemplate);
  const buildExtractionConfig = useStore((s) => s.buildExtractionConfig);
  const [name, setName] = reactExports.useState(template?.name ?? "");
  const [description, setDescription] = reactExports.useState(template?.description ?? "");
  const [domain, setDomain] = reactExports.useState(template?.domain ?? "");
  const [urlPattern, setUrlPattern] = reactExports.useState(template?.urlPattern ?? "");
  const [saving, setSaving] = reactExports.useState(false);
  const nameInputRef = reactExports.useRef(null);
  const backdropRef = reactExports.useRef(null);
  const isEditing = template !== null;
  reactExports.useEffect(() => {
    if (!domain) {
      getActiveTab().then((tab) => {
        if (tab?.url) {
          try {
            const parsed = new URL(tab.url);
            setDomain(parsed.hostname);
            if (!urlPattern) {
              setUrlPattern(parsed.pathname.replace(/\/[^/]*$/, "/*"));
            }
          } catch {
          }
        }
      }).catch(() => {
      });
    }
  }, []);
  reactExports.useEffect(() => {
    nameInputRef.current?.focus();
  }, []);
  reactExports.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const handleBackdropClick = reactExports.useCallback(
    (e) => {
      if (e.target === backdropRef.current) {
        onClose();
      }
    },
    [onClose]
  );
  const handleSave = reactExports.useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (isEditing && template) {
        updateTemplate(template.id, {
          name: name.trim(),
          description: description.trim(),
          domain: domain.trim(),
          urlPattern: urlPattern.trim()
        });
      } else {
        const config = buildExtractionConfig();
        const now = Date.now();
        const newTemplate = {
          id: generatePrefixedId("tmpl"),
          name: name.trim(),
          description: description.trim(),
          domain: domain.trim(),
          urlPattern: urlPattern.trim(),
          config,
          createdAt: now,
          updatedAt: now,
          lastUsed: 0,
          useCount: 0,
          successRate: 1
        };
        addTemplate(newTemplate);
      }
      onClose();
    } catch {
    } finally {
      setSaving(false);
    }
  }, [name, description, domain, urlPattern, isEditing, template, buildExtractionConfig, addTemplate, updateTemplate, onClose]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref: backdropRef,
      className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-forge-bg/80 backdrop-blur-sm animate-fade-in",
      onClick: handleBackdropClick,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-sm rounded-xl border border-forge-border bg-forge-bg-secondary shadow-2xl shadow-accent-primary/5 animate-scale-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-5 pt-5 pb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "text-sm font-bold text-forge-text flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-accent-primary", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "21", x2: "9", y2: "9" })
            ] }),
            isEditing ? "Edit Template" : "Save Template"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "p-1 rounded-md text-forge-text-muted hover:text-forge-text hover:bg-forge-bg-tertiary transition-colors",
              "aria-label": "Close modal",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
              ] })
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 px-5 pb-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "label",
              {
                htmlFor: "template-name",
                className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary",
                children: [
                  "Name ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-status-error", children: "*" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                ref: nameInputRef,
                id: "template-name",
                type: "text",
                value: name,
                onChange: (e) => setName(e.target.value),
                placeholder: "e.g. Amazon Product Listings",
                className: "h-9 px-3 rounded-lg bg-forge-bg-tertiary/40 border border-forge-border text-sm text-forge-text placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors",
                onKeyDown: (e) => {
                  if (e.key === "Enter") handleSave();
                }
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "label",
              {
                htmlFor: "template-description",
                className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary",
                children: "Description"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "textarea",
              {
                id: "template-description",
                value: description,
                onChange: (e) => setDescription(e.target.value),
                placeholder: "Brief description of what this template extracts...",
                rows: 3,
                className: "px-3 py-2 rounded-lg bg-forge-bg-tertiary/40 border border-forge-border text-sm text-forge-text placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors resize-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "label",
              {
                htmlFor: "template-domain",
                className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary flex items-center gap-1.5",
                children: [
                  "Domain",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-normal normal-case text-forge-text-muted", children: "(auto-detected)" })
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              domain && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-5 h-5 rounded bg-forge-bg-tertiary flex items-center justify-center shrink-0 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=16`,
                  alt: "",
                  width: 12,
                  height: 12,
                  className: "w-3 h-3",
                  onError: (e) => {
                    e.target.style.display = "none";
                  }
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "template-domain",
                  type: "text",
                  value: domain,
                  onChange: (e) => setDomain(e.target.value),
                  placeholder: "example.com",
                  className: "flex-1 h-9 px-3 rounded-lg bg-forge-bg-tertiary/40 border border-forge-border text-sm text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "label",
              {
                htmlFor: "template-url-pattern",
                className: "text-xs font-semibold uppercase tracking-wider text-forge-text-secondary",
                children: "URL Pattern"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                id: "template-url-pattern",
                type: "text",
                value: urlPattern,
                onChange: (e) => setUrlPattern(e.target.value),
                placeholder: "/products/*",
                className: "h-9 px-3 rounded-lg bg-forge-bg-tertiary/40 border border-forge-border text-sm text-forge-text font-mono placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[9px] text-forge-text-muted", children: "Use * as wildcard. Template will auto-suggest on matching URLs." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-end gap-2 pt-2 border-t border-forge-border/50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: onClose, children: "Cancel" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Button,
              {
                variant: "primary",
                size: "sm",
                onClick: handleSave,
                loading: saving,
                disabled: !name.trim(),
                iconLeft: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "17 21 17 13 7 13 7 21" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "7 3 7 8 15 8" })
                ] }),
                children: isEditing ? "Update" : "Save Template"
              }
            )
          ] })
        ] })
      ] })
    }
  );
};

const TemplatesView = () => {
  const templates = useStore((s) => s.templates);
  const removeTemplate = useStore((s) => s.removeTemplate);
  const applyTemplate = useStore((s) => s.applyTemplate);
  const setActiveTool = useStore((s) => s.setActiveTool);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [viewMode, setViewMode] = reactExports.useState("grid");
  const [showSaveModal, setShowSaveModal] = reactExports.useState(false);
  const [editingTemplate, setEditingTemplate] = reactExports.useState(null);
  const filteredTemplates = reactExports.useMemo(() => {
    if (!searchQuery.trim()) return templates;
    const q = searchQuery.toLowerCase();
    return templates.filter(
      (t) => t.name.toLowerCase().includes(q) || t.domain.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
    );
  }, [templates, searchQuery]);
  const handleApply = reactExports.useCallback(
    (id) => {
      const template = applyTemplate(id);
      if (template) {
        setActiveTool("list-extractor");
      }
    },
    [applyTemplate, setActiveTool]
  );
  const handleEdit = reactExports.useCallback(
    (id) => {
      const template = templates.find((t) => t.id === id);
      if (template) {
        setEditingTemplate(template);
        setShowSaveModal(true);
      }
    },
    [templates]
  );
  const handleDelete = reactExports.useCallback(
    (id) => {
      removeTemplate(id);
    },
    [removeTemplate]
  );
  const handleCloseSaveModal = reactExports.useCallback(() => {
    setShowSaveModal(false);
    setEditingTemplate(null);
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pt-4 pb-3 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-sm font-bold text-forge-text flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-accent-primary", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "21", x2: "9", y2: "9" })
        ] }),
        "Templates",
        templates.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "default", children: templates.length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          variant: "primary",
          size: "sm",
          onClick: () => {
            setEditingTemplate(null);
            setShowSaveModal(true);
          },
          iconLeft: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "5", x2: "12", y2: "19" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "5", y1: "12", x2: "19", y2: "12" })
          ] }),
          children: "New from Current"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-3", children: [
      templates.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "svg",
            {
              width: "14",
              height: "14",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: "currentColor",
              strokeWidth: "2",
              className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-forge-text-muted pointer-events-none",
              "aria-hidden": "true",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "8" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: searchQuery,
              onChange: (e) => setSearchQuery(e.target.value),
              placeholder: "Search templates...",
              className: "w-full h-8 pl-8 pr-3 rounded-lg bg-forge-bg-secondary border border-forge-border text-xs text-forge-text placeholder:text-forge-text-muted/40 focus:outline-none focus:border-accent-primary/50 transition-colors"
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex rounded-md border border-forge-border overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setViewMode("grid"),
              className: [
                "p-1.5 transition-colors",
                viewMode === "grid" ? "bg-accent-primary/15 text-accent-primary" : "bg-forge-bg-secondary text-forge-text-muted hover:text-forge-text-secondary"
              ].join(" "),
              title: "Grid view",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "7", height: "7" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "3", width: "7", height: "7" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "14", y: "14", width: "7", height: "7" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "14", width: "7", height: "7" })
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: () => setViewMode("list"),
              className: [
                "p-1.5 transition-colors",
                viewMode === "list" ? "bg-accent-primary/15 text-accent-primary" : "bg-forge-bg-secondary text-forge-text-muted hover:text-forge-text-secondary"
              ].join(" "),
              title: "List view",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "6", x2: "21", y2: "6" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "12", x2: "21", y2: "12" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "8", y1: "18", x2: "21", y2: "18" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "6", x2: "3.01", y2: "6" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "12", x2: "3.01", y2: "12" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "18", x2: "3.01", y2: "18" })
              ] })
            }
          )
        ] })
      ] }),
      filteredTemplates.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: viewMode === "grid" ? "grid grid-cols-1 gap-3" : "flex flex-col gap-2",
          children: filteredTemplates.map((template) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            TemplateCard$1,
            {
              template,
              viewMode,
              onApply: handleApply,
              onEdit: handleEdit,
              onDelete: handleDelete
            },
            template.id
          ))
        }
      ),
      templates.length > 0 && filteredTemplates.length === 0 && searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-8 gap-2 animate-fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "24", height: "24", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: "text-forge-text-muted", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "11", cy: "11", r: "8" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-forge-text-secondary", children: "No matching templates" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted", children: "Try a different search term" })
      ] }),
      templates.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center py-12 gap-4 rounded-xl border border-dashed border-forge-border/60 bg-forge-bg-secondary/30 animate-fade-in", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-16 h-16 rounded-full bg-accent-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "32", height: "32", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", className: "text-accent-primary", "aria-hidden": "true", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2", ry: "2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "21", x2: "9", y2: "9" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center max-w-[240px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-bold text-forge-text mb-1", children: "No templates yet" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted leading-relaxed", children: 'Templates save your extraction configuration for reuse. Run an extraction first, then click "New from Current" to save it as a template.' })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Button,
          {
            variant: "secondary",
            size: "sm",
            onClick: () => setActiveTool("list-extractor"),
            iconLeft: /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "15 18 9 12 15 6" }) }),
            children: "Go to List Extractor"
          }
        )
      ] })
    ] }) }),
    showSaveModal && /* @__PURE__ */ jsxRuntimeExports.jsx(
      SaveTemplateModal,
      {
        template: editingTemplate,
        onClose: handleCloseSaveModal
      }
    )
  ] });
};

class ErrorBoundary extends React$2.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[DataForge] Uncaught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full p-6 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: [
              "flex items-center justify-center w-14 h-14 rounded-2xl mb-4",
              "bg-status-error/10 border border-status-error/20"
            ].join(" "),
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "svg",
              {
                width: "28",
                height: "28",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                className: "text-status-error",
                "aria-hidden": "true",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "8", x2: "12", y2: "12" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "16", x2: "12.01", y2: "16" })
                ]
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-sm font-semibold text-forge-text mb-1", children: "Something went wrong" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted mb-4 max-w-[240px]", children: this.state.error?.message || "An unexpected error occurred." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => this.setState({ hasError: false, error: null }),
            className: [
              "h-8 px-4 rounded-lg text-xs font-semibold",
              "bg-gradient-to-br from-accent-primary to-accent-secondary",
              "text-forge-bg",
              "hover:shadow-[0_0_16px_rgba(16,185,129,0.3)]",
              "transition-all duration-150",
              "active:scale-[0.98]"
            ].join(" "),
            children: "Try Again"
          }
        )
      ] });
    }
    return this.props.children;
  }
}
const ToastContainer = () => {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);
  reactExports.useEffect(() => {
    const timers = [];
    for (const toast of toasts) {
      if (toast.duration > 0) {
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
        timers.push(timer);
      }
    }
    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [toasts, removeToast]);
  if (toasts.length === 0) return null;
  const typeStyles = {
    success: "border-status-success/30 bg-status-success/10",
    error: "border-status-error/30 bg-status-error/10",
    warning: "border-status-warning/30 bg-status-warning/10",
    info: "border-status-info/30 bg-status-info/10"
  };
  const typeIconColors = {
    success: "text-status-success",
    error: "text-status-error",
    warning: "text-status-warning",
    info: "text-status-info"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "toast-container", "aria-live": "polite", "aria-label": "Notifications", children: toasts.map((toast) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: [
        "flex items-start gap-2.5 p-3 rounded-xl border backdrop-blur-xl",
        "animate-slide-in-right motion-reduce:animate-none",
        "shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
        "max-w-[300px]",
        typeStyles[toast.type] ?? typeStyles.info
      ].join(" "),
      role: "alert",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `shrink-0 mt-0.5 ${typeIconColors[toast.type] ?? ""}`, children: [
          toast.type === "success" && /* @__PURE__ */ jsxRuntimeExports.jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: /* @__PURE__ */ jsxRuntimeExports.jsx("polyline", { points: "20 6 9 17 4 12" }) }),
          toast.type === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "15", y1: "9", x2: "9", y2: "15" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "9", x2: "15", y2: "15" })
          ] }),
          toast.type === "warning" && /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "9", x2: "12", y2: "13" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "17", x2: "12.01", y2: "17" })
          ] }),
          toast.type === "info" && /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("circle", { cx: "12", cy: "12", r: "10" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "16", x2: "12", y2: "12" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-semibold text-forge-text", children: toast.title }),
          toast.message && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-forge-text-muted mt-0.5", children: toast.message })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => removeToast(toast.id),
            className: "shrink-0 text-forge-text-muted/50 hover:text-forge-text transition-colors duration-150",
            "aria-label": "Dismiss notification",
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "18", y1: "6", x2: "6", y2: "18" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
            ] })
          }
        )
      ]
    },
    toast.id
  )) });
};
const ToolViewRouter = ({ tool }) => {
  switch (tool) {
    case "list-extractor":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(ListExtractorView$1, {});
    case "page-extractor":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(PageExtractorView, {});
    case "email-extractor":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(EmailExtractorView, {});
    case "image-downloader":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(ImageDownloaderView, {});
    case "text-extractor":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(TextExtractorView, {});
    case "templates":
      return /* @__PURE__ */ jsxRuntimeExports.jsx(TemplatesView, {});
    default:
      return /* @__PURE__ */ jsxRuntimeExports.jsx(ToolsMenu, {});
  }
};
const DataViewPlaceholder = () => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center justify-center h-full p-6 text-center", children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: [
        "flex items-center justify-center w-14 h-14 rounded-2xl mb-4",
        "bg-forge-bg-tertiary/60 border border-forge-border"
      ].join(" "),
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "svg",
        {
          width: "28",
          height: "28",
          viewBox: "0 0 24 24",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "1.5",
          strokeLinecap: "round",
          strokeLinejoin: "round",
          className: "text-forge-text-muted/30",
          "aria-hidden": "true",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("rect", { x: "3", y: "3", width: "18", height: "18", rx: "2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "9", x2: "21", y2: "9" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "3", y1: "15", x2: "21", y2: "15" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "9", y1: "3", x2: "9", y2: "21" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "15", y1: "3", x2: "15", y2: "21" })
          ]
        }
      )
    }
  ),
  /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-medium text-forge-text-muted mb-1", children: "No data yet" }),
  /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-forge-text-muted/60 max-w-[200px]", children: "Extracted data will appear here. Start by running an extraction from the Tools tab." })
] });
const App = () => {
  const [showSettings, setShowSettings] = reactExports.useState(false);
  const activeTab = useStore((s) => s.activeTab);
  const activeTool = useStore((s) => s.activeTool);
  const setTab = useStore((s) => s.setTab);
  const extractionStatus = useStore((s) => s.status);
  const extractionProgress = useStore((s) => s.progress);
  const extractedRows = useStore((s) => s.extractedRows);
  const setExtractionStatus = useStore((s) => s.setStatus);
  useSettings();
  const handleTabChange = reactExports.useCallback(
    (tab) => {
      if (showSettings) {
        setShowSettings(false);
      }
      setTab(tab);
    },
    [setTab, showSettings]
  );
  const handleSettingsClick = reactExports.useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);
  const isExtracting = extractionStatus === "running" || extractionStatus === "paused";
  const bottomBarConfig = reactExports.useMemo(
    () => ({
      visible: isExtracting,
      itemsCount: extractedRows.length,
      elapsedTime: extractionProgress.elapsed,
      progress: extractionProgress.items > 0 ? Math.min(100, extractionProgress.items / 1e3 * 100) : 0,
      isPaused: extractionStatus === "paused",
      onPause: () => setExtractionStatus("paused"),
      onResume: () => setExtractionStatus("running"),
      onStop: () => setExtractionStatus("completed"),
      onViewData: () => setTab("data")
    }),
    [isExtracting, extractedRows.length, extractionProgress, extractionStatus, setExtractionStatus, setTab]
  );
  const tabBadges = reactExports.useMemo(
    () => ({
      data: extractedRows.length > 0 ? extractedRows.length : void 0
    }),
    [extractedRows.length]
  );
  const renderContent = reactExports.useCallback(() => {
    if (showSettings) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(SettingsView, {});
    }
    switch (activeTab) {
      case "tools":
        if (activeTool) {
          return /* @__PURE__ */ jsxRuntimeExports.jsx(ToolViewRouter, { tool: activeTool });
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsx(ToolsMenu, {});
      case "history":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(HistoryView, {});
      case "data":
        return /* @__PURE__ */ jsxRuntimeExports.jsx(DataViewPlaceholder, {});
      default:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(ToolsMenu, {});
    }
  }, [activeTab, activeTool, showSettings]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(ErrorBoundary, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PanelLayout,
      {
        activeTab,
        onTabChange: handleTabChange,
        onSettingsClick: handleSettingsClick,
        tabBadges,
        bottomBar: bottomBarConfig,
        children: renderContent()
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ToastContainer, {})
  ] });
};

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error(
    '[DataForge] Root element #root not found. Ensure sidepanel.html contains <div id="root"></div>.'
  );
}
const root = createRoot(rootElement);
root.render(
  /* @__PURE__ */ jsxRuntimeExports.jsx(React$2.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(App, {}) })
);
