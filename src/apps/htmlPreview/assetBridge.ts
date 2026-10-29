/**
 * Create an in-frame resource bridge so runtime URL assignments such as
 * `new Audio('./sounds/clip.mp3')`, fetch(), and XHR can resolve files from the
 * selected ZIP instead of the Web OS page's URL.
 */
export function createAssetBridgeScript(
  assetUrls: ReadonlyMap<string, string>,
  currentPagePath: string,
  defaultEntryPath = currentPagePath,
  previewHostOrigin = '',
  previewHostBasePath = '/',
): string {
  const serializedAssets = JSON.stringify([...assetUrls.entries()])
    .replace(/</gu, '\\u003c')
    .replace(/\u2028/gu, '\\u2028')
    .replace(/\u2029/gu, '\\u2029');
  const pageDirectory = JSON.stringify(currentPagePath.split('/').slice(0, -1).join('/'))
    .replace(/</gu, '\\u003c')
    .replace(/\u2028/gu, '\\u2028')
    .replace(/\u2029/gu, '\\u2029');
  const currentPath = JSON.stringify(currentPagePath)
    .replace(/</gu, '\\u003c')
    .replace(/\u2028/gu, '\\u2028')
    .replace(/\u2029/gu, '\\u2029');
  const defaultPath = JSON.stringify(defaultEntryPath)
    .replace(/</gu, '\\u003c')
    .replace(/\u2028/gu, '\\u2028')
    .replace(/\u2029/gu, '\\u2029');
  const hostOrigin = JSON.stringify(previewHostOrigin)
    .replace(/</gu, '\\u003c')
    .replace(/\u2028/gu, '\\u2028')
    .replace(/\u2029/gu, '\\u2029');
  const hostBasePath = JSON.stringify(previewHostBasePath)
    .replace(/</gu, '\\u003c')
    .replace(/\u2028/gu, '\\u2028')
    .replace(/\u2029/gu, '\\u2029');

  return `;(function(){
    var assets = new Map(${serializedAssets});
    var pageDirectory = ${pageDirectory};
    var currentPagePath = ${currentPath};
    var defaultEntryPath = ${defaultPath};
    var previewHostOrigin = ${hostOrigin};
    var previewHostBasePath = ${hostBasePath};
    var externalReference = /^(?:[a-z][a-z\\d+.-]*:|\\/\\/)/i;

    function resolveAsset(reference, isNavigation) {
      if (typeof reference !== 'string') return reference;
      var value = reference.trim();
      if (value.charAt(0) === '#' || externalReference.test(value)) return reference;
      if (!value) return isNavigation ? (assets.get(currentPagePath) || reference) : reference;

      var suffixAt = value.search(/[?#]/);
      var path = suffixAt < 0 ? value : value.slice(0, suffixAt);
      var suffix = suffixAt < 0 ? '' : value.slice(suffixAt);
      if (!path) {
        var currentPageUrl = isNavigation ? assets.get(currentPagePath) : undefined;
        return currentPageUrl ? currentPageUrl + suffix : reference;
      }

      try {
        path = decodeURIComponent(path).replace(/\\\\/g, '/');
      } catch (_error) {
        return reference;
      }

      var parts = path.charAt(0) === '/' ? [] : pageDirectory.split('/').filter(Boolean);
      var escapedRoot = false;
      path.split('/').forEach(function(part){
        if (!part || part === '.') return;
        if (part === '..') {
          if (parts.length) parts.pop();
          else escapedRoot = true;
          return;
        }
        parts.push(part);
      });
      if (escapedRoot) return reference;

      var resolvedPath = parts.join('/');
      var assetUrl = assets.get(resolvedPath);
      if (!assetUrl && isNavigation) {
        var candidates = [];
        if (!resolvedPath) {
          candidates = ['index.html', 'index.htm', defaultEntryPath];
        } else if (!/(?:^|\\/)[^/]+\\.[^/]+$/.test(resolvedPath)) {
          if (path.charAt(path.length - 1) === '/') {
            candidates = [resolvedPath + '/index.html', resolvedPath + '/index.htm', resolvedPath + '.html', resolvedPath + '.htm'];
          } else {
            candidates = [resolvedPath + '.html', resolvedPath + '.htm', resolvedPath + '/index.html', resolvedPath + '/index.htm'];
          }
        }
        for (var index = 0; index < candidates.length && !assetUrl; index += 1) assetUrl = assets.get(candidates[index]);
      }
      return assetUrl ? assetUrl + suffix : reference;
    }

    function localizeSameOriginReference(reference) {
      if (typeof reference !== 'string' || !/^(?:https?:)?\\/\\//i.test(reference.trim()) || !previewHostOrigin || previewHostOrigin === 'null') return null;
      try {
        var target = new window.URL(reference.trim(), previewHostOrigin + previewHostBasePath);
        if (target.origin !== previewHostOrigin) return null;
        var path = target.pathname;
        if (path === previewHostBasePath || path === previewHostBasePath.replace(/\\/$/, '') || path === '/') {
          path = '/';
        } else if (previewHostBasePath !== '/' && path.indexOf(previewHostBasePath) === 0) {
          path = '/' + path.slice(previewHostBasePath.length);
        }
        return path + target.search + target.hash;
      } catch (_error) {
        return null;
      }
    }

    function resolveNavigation(reference) {
      var sameOriginReference = localizeSameOriginReference(String(reference));
      if (sameOriginReference !== null) {
        var localUrl = resolveAsset(sameOriginReference, true);
        return localUrl === sameOriginReference ? '#zip-preview-route-not-found' : localUrl;
      }
      return resolveAsset(reference, true);
    }

    var locationPrototype = window.Location && window.Location.prototype;
    if (locationPrototype) {
      ['assign', 'replace'].forEach(function(method){
        var nativeMethod = locationPrototype[method];
        if (typeof nativeMethod !== 'function') return;
        try {
          locationPrototype[method] = function(reference){
            return nativeMethod.call(this, resolveNavigation(String(reference)));
          };
        } catch (_error) {}
      });
      var hrefDescriptor = Object.getOwnPropertyDescriptor(locationPrototype, 'href');
      if (hrefDescriptor && hrefDescriptor.configurable && typeof hrefDescriptor.set === 'function') {
        try {
          Object.defineProperty(locationPrototype, 'href', {
            ...hrefDescriptor,
            set: function(reference){
              return hrefDescriptor.set.call(this, resolveNavigation(String(reference)));
            }
          });
        } catch (_error) {}
      }
    }

    window.__zipPreviewNavigate = function(reference){
      var value = String(reference);
      var mapped = resolveNavigation(value);
      if (mapped === value && value.charAt(0) !== '#' && !externalReference.test(value)) return false;
      try {
        window.location.assign(mapped);
        return true;
      } catch (_error) {
        return false;
      }
    };

    ['pushState', 'replaceState'].forEach(function(method){
      var history = window.history;
      var nativeMethod = history && history[method];
      if (typeof nativeMethod !== 'function') return;
      try {
        history[method] = function(state, title, url){
          var mappedUrl = url;
          if (typeof url === 'string') {
            mappedUrl = resolveNavigation(url);
            if (mappedUrl === url && url.charAt(0) !== '#' && !externalReference.test(url)) return;
          }
          return nativeMethod.call(this, state, title, mappedUrl);
        };
      } catch (_error) {}
    });

    function resolveSrcset(value) {
      if (typeof value !== 'string' || /^data:/i.test(value.trim())) return value;
      return value.split(',').map(function(candidate){
        var trimmed = candidate.trim();
        var match = trimmed.match(/^(\\S+)([\\s\\S]*)$/);
        return match ? resolveAsset(match[1]) + match[2] : candidate;
      }).join(', ');
    }

    function resolveAttribute(element, name, value) {
      var attribute = String(name).toLowerCase();
      if (attribute === 'srcset') return resolveSrcset(String(value));
      if (attribute === 'href' && element && (element.tagName === 'A' || element.tagName === 'AREA')) {
        return resolveNavigation(String(value));
      }
      if (attribute === 'src' || attribute === 'href' || attribute === 'poster' || attribute === 'action' || attribute === 'data') {
        return resolveAsset(String(value));
      }
      return value;
    }

    var nativeSetAttribute = window.Element.prototype.setAttribute;
    window.Element.prototype.setAttribute = function(name, value){
      return nativeSetAttribute.call(this, name, resolveAttribute(this, name, value));
    };

    function patchProperty(constructor, property, mapper) {
      if (!constructor || !constructor.prototype) return;
      var descriptor = Object.getOwnPropertyDescriptor(constructor.prototype, property);
      if (!descriptor || !descriptor.configurable || typeof descriptor.set !== 'function') return;
      Object.defineProperty(constructor.prototype, property, {
        ...descriptor,
        set: function(value){
          return descriptor.set.call(this, mapper(String(value)));
        }
      });
    }

    [
      [window.HTMLMediaElement, 'src'],
      [window.HTMLImageElement, 'src'],
      [window.HTMLScriptElement, 'src'],
      [window.HTMLSourceElement, 'src'],
      [window.HTMLTrackElement, 'src'],
      [window.HTMLIFrameElement, 'src'],
      [window.HTMLEmbedElement, 'src'],
      [window.HTMLInputElement, 'src'],
      [window.HTMLLinkElement, 'href'],
      [window.HTMLFormElement, 'action'],
      [window.HTMLObjectElement, 'data']
    ].forEach(function(entry){ patchProperty(entry[0], entry[1], resolveAsset); });
    patchProperty(window.HTMLAnchorElement, 'href', resolveNavigation);
    patchProperty(window.HTMLAreaElement, 'href', resolveNavigation);
    patchProperty(window.HTMLImageElement, 'srcset', resolveSrcset);
    patchProperty(window.HTMLSourceElement, 'srcset', resolveSrcset);

    var NativeAudio = window.Audio;
    if (typeof NativeAudio === 'function') {
      var PreviewAudio = function(source){
        var audio = new NativeAudio();
        if (source !== undefined && source !== null && source !== '') audio.src = resolveAsset(String(source));
        return audio;
      };
      PreviewAudio.prototype = NativeAudio.prototype;
      try { Object.setPrototypeOf(PreviewAudio, NativeAudio); } catch (_error) {}
      window.Audio = PreviewAudio;
    }

    var nativeFetch = window.fetch;
    if (typeof nativeFetch === 'function') {
      window.fetch = function(input, init){
        var replacement = input;
        if (typeof input === 'string') {
          replacement = resolveAsset(input);
        } else if (input && typeof input === 'object' && typeof input.url === 'string') {
          var mappedUrl = resolveAsset(input.url);
          if (mappedUrl !== input.url) {
            try { replacement = new window.Request(mappedUrl, input); }
            catch (_error) { replacement = mappedUrl; }
          }
        } else if (input && typeof input === 'object' && typeof input.href === 'string') {
          var mappedHref = resolveAsset(input.href);
          if (mappedHref !== input.href) replacement = new window.URL(mappedHref);
        }
        return nativeFetch.call(this, replacement, init);
      };
    }

    var xhrPrototype = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
    if (xhrPrototype && typeof xhrPrototype.open === 'function') {
      var nativeXhrOpen = xhrPrototype.open;
      xhrPrototype.open = function(method, url){
        var args = Array.prototype.slice.call(arguments);
        args[1] = resolveAsset(String(url));
        return nativeXhrOpen.apply(this, args);
      };
    }

    if (typeof window.MutationObserver === 'function' && window.document.documentElement) {
      var nativeSet = nativeSetAttribute;
      var observedAttributes = ['src', 'href', 'poster', 'action', 'data', 'srcset'];
      function rewriteCurrentElement(element){
        if (!element || element.nodeType !== 1) return;
        observedAttributes.forEach(function(name){
          if (!element.hasAttribute(name)) return;
          var value = element.getAttribute(name);
          var mapped = resolveAttribute(element, name, value);
          if (mapped !== value) nativeSet.call(element, name, mapped);
        });
      }
      function rewriteElement(element){
        rewriteCurrentElement(element);
        if (element && element.querySelectorAll) {
          element.querySelectorAll('[src], [href], [poster], [action], [data], [srcset]').forEach(rewriteCurrentElement);
        }
      }
      var observer = new window.MutationObserver(function(records){
        records.forEach(function(record){
          if (record.type === 'attributes') rewriteElement(record.target);
          record.addedNodes && record.addedNodes.forEach(rewriteElement);
        });
      });
      observer.observe(window.document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: observedAttributes
      });
    }
  })();`;
}

/**
 * The iframe runs with an opaque sandboxed origin, so Blob URLs created by the
 * parent page may be rejected by the browser. Keep the app document inert in a
 * JSON data block until its file Blobs have been delivered, then mint URLs inside
 * the iframe's own origin before parsing/executing any app code.
 */
export function createPreviewHydrationShell(appDocument: string, nonce: string, csp: string): string {
  const serializedAppDocument = JSON.stringify(appDocument)
    .replace(/</gu, '\\u003c')
    .replace(/\u2028/gu, '\\u2028')
    .replace(/\u2029/gu, '\\u2029');
  const escapedCsp = csp
    .replace(/&/gu, '&amp;')
    .replace(/"/gu, '&quot;')
    .replace(/</gu, '&lt;');
  const nonceLiteral = JSON.stringify(nonce).replace(/</gu, '\\u003c');
  const bootstrap = `(function(){
    var nonce = ${nonceLiteral};
    var source = document.getElementById('zip-preview-app');
    var appDocument = JSON.parse(source.textContent || '""');
    var waiting = true;

    async function hydrate(event){
      if (!waiting || event.source !== window.parent) return;
      var message = event.data;
      if (!message || message.type !== 'zip-preview-assets' || message.nonce !== nonce || !Array.isArray(message.assets)) return;
      waiting = false;
      window.removeEventListener('message', hydrate);

      try {
        var urls = new Map();
        message.assets.forEach(function(entry){
          if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !entry[1] || typeof entry[1].slice !== 'function') return;
          urls.set(entry[0], window.URL.createObjectURL(entry[1]));
        });

        // CSS and module Blobs may contain ZIP asset tokens. Replace those only
        // after every child-origin URL exists, so the resulting content points
        // to resources that the isolated frame itself can load.
        for (var index = 0; index < message.assets.length; index += 1) {
          var entry = message.assets[index];
          if (!Array.isArray(entry) || !urls.has(entry[0]) || !entry[1] || !/^text\\/(?:css|javascript)/i.test(entry[1].type || '')) continue;
          var sourceText = await entry[1].text();
          urls.forEach(function(url, token){ sourceText = sourceText.split(token).join(url); });
          var rewritten = new Blob([sourceText], { type: entry[1].type });
          var oldUrl = urls.get(entry[0]);
          var newUrl = window.URL.createObjectURL(rewritten);
          window.URL.revokeObjectURL(oldUrl);
          urls.set(entry[0], newUrl);
        }

        var appHtml = appDocument;
        urls.forEach(function(url, token){ appHtml = appHtml.split(token).join(url); });
        document.open();
        document.write(appHtml);
        document.close();
      } catch (_error) {
        document.body.textContent = 'The ZIP files could not be prepared for this browser preview. Try reloading the preview.';
      }
    }

    window.addEventListener('message', hydrate);
    try {
      window.parent.postMessage({ type: 'zip-preview-request-assets', nonce: nonce }, '*');
    } catch (_error) {}
  })();`;

  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${escapedCsp}"><meta name="referrer" content="no-referrer"></head><body><p>Loading local ZIP files…</p><script id="zip-preview-app" type="application/json">${serializedAppDocument}</script><script>${bootstrap}</script></body></html>`;
}
