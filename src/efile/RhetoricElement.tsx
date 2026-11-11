"use client";

/**
 * Rhetoric's filing screen. Same behavior as @rhetoriclabs/element-react's
 * <Element>, but the SDK import is marked so Next's bundler (Turbopack) leaves it
 * alone; their wrapper's plain import() of a remote URL fails under Turbopack.
 */
import { useEffect, useRef } from "react";

const SDK_URL = "https://js.rhetoric.law/v1/element.js";

/** Use the wizard's own font inside Rhetoric's screen. */
const APPEARANCE = { variables: { fontFamily: "inherit" } };

interface ElementInstance {
  mount(el: HTMLElement): void;
  destroy(): void;
}
interface ElementSdk {
  createElement(o: { sessionToken: string; appearance?: unknown }): ElementInstance;
}

const loadSdk = (): Promise<ElementSdk> => import(/* webpackIgnore: true */ /* turbopackIgnore: true */ SDK_URL);

export function RhetoricElement({ sessionToken }: { sessionToken: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let el: ElementInstance | undefined;
    let cancelled = false;
    loadSdk()
      .then((sdk) => {
        if (cancelled || !root.current) return;
        el = sdk.createElement({ sessionToken, appearance: APPEARANCE });
        el.mount(root.current);
      })
      .catch((err) => {
        if (!cancelled) console.error(`[rhetoric] could not load the filing screen from ${SDK_URL}`, err);
      });
    return () => {
      cancelled = true;
      el?.destroy();
    };
  }, [sessionToken]);

  return <div ref={root} />;
}
