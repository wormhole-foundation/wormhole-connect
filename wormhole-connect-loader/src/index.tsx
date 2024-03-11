import { useEffect, useRef } from "react";
import { WormholeConnectConfig } from "./types";

const PACKAGE_NAME = "@wormhole-foundation/wormhole-connect";
const DEFAULT_VERSION =
  process.env.REACT_APP_CONNECT_CURRENT_VERSION || "latest";

function WormholeBridge({
  config,
  versionOrTag = DEFAULT_VERSION,
}: {
  config?: WormholeConnectConfig;
  versionOrTag?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let connectElement = document.getElementById("wormhole-connect");
    if (!connectElement) {
      connectElement = document.createElement("div");
      connectElement.id = "wormhole-connect";
    }
    connectElement.setAttribute("config", config ? JSON.stringify(config) : "");
    if (ref.current) {
      connectElement.style.display = "block";
      ref.current.appendChild(connectElement);
    }
    if (!document.getElementById("wormhole-connect-script")) {
      const script = document.createElement("script");
      script.src = `https://www.unpkg.com/${PACKAGE_NAME}@${versionOrTag}/dist/main.js`;
      script.type = "module";
      script.async = true;
      script.id = "wormhole-connect-script";
      document.body.appendChild(script);
    }
    if (!document.getElementById("wormhole-connect-style")) {
      const link = document.createElement("link");
      link.href = `https://www.unpkg.com/${PACKAGE_NAME}@${versionOrTag}/dist/main.css`;
      link.id = "wormhole-connect-style";
      document.body.appendChild(link);
    }

    return () => {
      connectElement!.style.display = "none";
      document.body.appendChild(connectElement!);
    };
  }, [versionOrTag, config]);

  return <div ref={ref}></div>;
}

export * from "./theme";
export * from "./types";
export default WormholeBridge;
