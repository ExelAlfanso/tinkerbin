import { createRenderer, defineComponent, h } from "vue";

interface HostNode {
  children: HostNode[];
  parent?: HostNode;
  props: Record<string, unknown>;
  text: string;
  type: string;
}

const hostNode = (type: string, text = ""): HostNode => ({
  children: [],
  props: {},
  text,
  type,
});
const noop = () => null;
const addListener =
  (listeners: Map<string, Set<unknown>>) =>
  (name: string, listener: unknown) => {
    const entries = listeners.get(name) ?? new Set<unknown>();
    entries.add(listener);
    listeners.set(name, entries);
  };
const removeListener =
  (listeners: Map<string, Set<unknown>>) =>
  (name: string, listener: unknown) => {
    listeners.get(name)?.delete(listener);
  };

const renderer = createRenderer<HostNode, HostNode>({
  createComment: (text) => hostNode("comment", text),
  createElement: (type) => hostNode(type),
  createText: (text) => hostNode("text", text),
  insert: (child, parent, anchor) => {
    child.parent = parent;
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    parent.children.splice(
      index < 0 ? parent.children.length : index,
      0,
      child
    );
  },
  nextSibling: (node) => {
    const siblings = node.parent?.children;
    const index = siblings?.indexOf(node) ?? -1;
    return index >= 0 ? siblings?.[index + 1] || null : null;
  },
  parentNode: (node) => node.parent || null,
  patchProp: (node, key, _previous, next) => {
    node.props[key] = next;
  },
  remove: (node) => {
    const siblings = node.parent?.children;
    const index = siblings?.indexOf(node) ?? -1;
    if (index >= 0) {
      siblings?.splice(index, 1);
    }
    node.parent = undefined;
  },
  setElementText: (node, text) => {
    node.text = text;
    node.children = [];
  },
  setText: (node, text) => {
    node.text = text;
  },
});

export const mountComposable = <T>(setup: () => T) => {
  let result: T | undefined;
  const app = renderer.createApp(
    defineComponent({
      setup() {
        result = setup();
        return () => h("test-root");
      },
    })
  );
  app.mount(hostNode("container"));
  if (result === undefined) {
    app.unmount();
    throw new Error("Composable did not return a value.");
  }
  return { result, unmount: () => app.unmount() };
};

interface BrowserOptions {
  canvasAvailable?: boolean;
  deviceMemory?: number;
  hash?: string;
  pixels?: ArrayLike<number>;
  search?: string;
}

const fakeCanvas = (options: BrowserOptions) => {
  const context = {
    drawImage: noop,
    fillRect: noop,
    fillStyle: "#000",
    getImageData(_x: number, _y: number, width: number, height: number) {
      const data = new Uint8ClampedArray(width * height * 4);
      const source = options.pixels ?? [255, 0, 0, 255];
      for (let index = 0; index < data.length; index += 1) {
        data[index] = source[index % source.length] ?? 0;
      }
      return { data, height, width };
    },
    globalCompositeOperation: "source-over",
    imageSmoothingQuality: "low",
    putImageData: noop,
  };
  return {
    getContext: () => (options.canvasAvailable === false ? null : context),
    height: 0,
    width: 0,
  };
};

export const installBrowserHarness = (options: BrowserOptions = {}) => {
  const originals = new Map<string, PropertyDescriptor | undefined>();
  const setGlobal = (name: string, value: unknown) => {
    if (!originals.has(name)) {
      originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    }
    Object.defineProperty(globalThis, name, {
      configurable: true,
      value,
      writable: true,
    });
  };
  const documentListeners = new Map<string, Set<unknown>>();
  const windowListeners = new Map<string, Set<unknown>>();
  const trackCalls: unknown[][] = [];
  const location = { hash: options.hash ?? "", search: options.search ?? "" };
  const storage = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => storage.get(key) ?? null,
    removeItem: (key: string) => storage.delete(key),
    setItem: (key: string, value: string) => storage.set(key, value),
  };
  const document = {
    activeElement: null,
    addEventListener: addListener(documentListeners),
    createElement: (tag: string) =>
      tag === "canvas"
        ? fakeCanvas(options)
        : {
            append: noop,
            classList: { add: noop, remove: noop },
            click: noop,
            remove: noop,
            setAttribute: noop,
          },
    removeEventListener: removeListener(documentListeners),
  };
  const window = {
    addEventListener: addListener(windowListeners),
    removeEventListener: removeListener(windowListeners),
  };
  const track = (...args: unknown[]) => trackCalls.push(args);
  setGlobal("document", document);
  setGlobal("window", window);
  setGlobal("location", location);
  setGlobal("history", {
    replaceState: (_state: unknown, _title: string, hash: string) => {
      location.hash = hash;
    },
  });
  setGlobal("localStorage", localStorage);
  setGlobal("navigator", {
    canShare: () => false,
    connection: { effectiveType: "4g", saveData: false },
    deviceMemory: options.deviceMemory ?? 8,
  });
  setGlobal("Worker", noop);
  setGlobal("createImageBitmap", () => Promise.resolve({}));
  setGlobal("matchMedia", () => ({ matches: false }));
  setGlobal("fetch", () => Promise.resolve(new Response("{}")));
  setGlobal("useTrack", () => track);

  return {
    documentListeners,
    localStorage,
    location,
    restore() {
      for (const [name, descriptor] of [...originals.entries()].toReversed()) {
        if (descriptor) {
          Object.defineProperty(globalThis, name, descriptor);
        } else {
          Reflect.deleteProperty(globalThis, name);
        }
      }
    },
    trackCalls,
    windowListeners,
  };
};
