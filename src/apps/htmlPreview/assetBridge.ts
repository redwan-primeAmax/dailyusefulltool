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
