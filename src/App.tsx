import { useState } from "react";
import Setup from "./pages/Setup";

export default function App() {
  const [page] = useState<"setup">("setup");

  return (
    <div className="w-screen h-screen">
      {page === "setup" && <Setup />}
    </div>
  );
}
