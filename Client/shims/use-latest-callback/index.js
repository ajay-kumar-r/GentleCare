// Local shim for `use-latest-callback` to guarantee a stable hook
// Metro is configured to resolve the module name to this file.
// This exports both CommonJS and ESM default shapes so consumers
// that expect `.default` or direct function will work.

const React = require('react');

function useLatestCallback(cb) {
  const ref = React.useRef(cb);
  React.useEffect(() => {
    ref.current = cb;
  }, [cb]);

  // stable callback that always forwards to the latest version
  const stable = React.useCallback((...args) => {
    // call the latest callback
    return ref.current && ref.current(...args);
  }, []);

  return stable;
}

module.exports = useLatestCallback;
module.exports.default = useLatestCallback;
Object.defineProperty(module.exports, '__esModule', { value: true });
