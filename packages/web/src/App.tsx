import { useEffect, useState } from "react";
import { ReturnEditor } from "./components/ReturnEditor.tsx";
import { ReturnsList } from "./components/ReturnsList.tsx";
import type { SavedReturn } from "./lib/savedReturn.ts";
import { getReturn } from "./lib/storage.ts";

const currentPath = () => window.location.hash.replace(/^#/, "") || "/";

function useHashPath(): [string, (path: string) => void] {
  const [path, setPath] = useState(currentPath);
  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return [path, (next: string) => void (window.location.hash = next)];
}

function OpenReturn({ id, stepId, go }: { id: string; stepId: string; go: (path: string) => void }) {
  const [saved, setSaved] = useState<SavedReturn | null | undefined>(undefined);
  useEffect(() => {
    setSaved(undefined);
    getReturn(id).then((r) => setSaved(r ?? null), () => setSaved(null));
  }, [id]);
  if (saved === undefined) return <p className="loading">Opening…</p>;
  if (saved === null) {
    return (
      <main className="home">
        <p>That return isn't saved in this browser.</p>
        <a href="#/">Back to your returns</a>
      </main>
    );
  }
  return <ReturnEditor key={saved.id} initial={saved} stepId={stepId} go={go} />;
}

export function App() {
  const [path, go] = useHashPath();
  const match = /^\/return\/([^/]+)(?:\/([^/]+))?/.exec(path);
  return (
    <>
      <header className="top">
        <a href="#/" className="brand">
          OpenTax
        </a>
        <span className="private">Stays on this device</span>
      </header>
      {match ? <OpenReturn id={match[1]!} stepId={match[2] ?? "you"} go={go} /> : <ReturnsList go={go} />}
      <footer>
        Open source, MIT licensed. OpenTax is not tax advice; check your return before you file.{" "}
        <a href="https://github.com/sschroederdev/opentax" target="_blank" rel="noreferrer">
          Source code
        </a>
      </footer>
    </>
  );
}
