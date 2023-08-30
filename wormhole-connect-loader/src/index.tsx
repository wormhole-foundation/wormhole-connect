import { useEffect } from "react";
import { WormholeConnectConfig } from "./types";

function WormholeBridge({ config }: { config?: WormholeConnectConfig }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.11/dist/main.js";
    script.async = true;

    const link = document.createElement("link");
    link.href =
      "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.11/dist/main.css";

    document.body.appendChild(script);
    document.body.appendChild(link);
    return () => {
      script.remove();
      link.remove();
    };
  }, []);

  return (
    <div
      id="wormhole-connect"
      //@ts-ignore
      config={config ? JSON.stringify(config) : null}
    ></div>
  );
}

export * from "./theme";
export * from "./types";
export default WormholeBridge;
