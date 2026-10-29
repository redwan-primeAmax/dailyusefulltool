/**
 * Create an in-frame resource bridge so runtime URL assignments such as
 * `new Audio('./sounds/clip.mp3')`, fetch(), and XHR can resolve files from the
 * selected ZIP instead of the Web OS page's URL.
 */
export function createAssetBridgeScript(assetUrls: ReadonlyMap<string, string>, entryPath: string): string {
  const serializedAssets = JSON.stringify([...assetUrls.entries()])
    .replace(/</gu, '\\u003c')
    .replace(/\u2028/gu, '\\u2028')
    .replace(/\u2029/gu, '\\u2029');
  const pageDirectory = JSON.stringify(entryPath.split('/').slice(0, -1).join('/'))
    .replace(/</gu, '\\u003c')
    .replace(/\u2028/gu, '\\u2028')
    .replace(/\u2029/gu, '\\u2029');

  return `;(function(){
    var assets = new Map(${serializedAssets});
    var pageDirectory = ${pageDirectory};
    var externalReference = /^(?:[a-z][a-z\\d+.-]*:|\\/\\/)/i;

    function resolveAsset(reference) {
      if (typeof reference !== 'string') return reference;
      var value = reference.trim();
      if (!value || value.charAt(0) === '#' || externalReference.test(value)) return reference;

      var suffixAt = value.search(/[?#]/);
      var path = suffixAt < 0 ? value : value.slice(0, suffixAt);
      if (!path) return reference;
      var hashAt = value.indexOf('#');
      var hash = hashAt < 0 ? '' : value.slice(hashAt);

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

      var assetUrl = assets.get(parts.join('/'));
      return assetUrl ? assetUrl + hash : reference;
    }

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
      [window.HTMLAnchorElement, 'href'],
      [window.HTMLAreaElement, 'href'],
      [window.HTMLFormElement, 'action'],
      [window.HTMLObjectElement, 'data']
    ].forEach(function(entry){ patchProperty(entry[0], entry[1], resolveAsset); });
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
  })();`;

  return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="${escapedCsp}"><meta name="referrer" content="no-referrer"></head><body><p>Loading local ZIP files…</p><script id="zip-preview-app" type="application/json">${serializedAppDocument}</script><script>${bootstrap}</script></body></html>`;
}
