import React, { useContext, useEffect, useState } from "react";
import { Props } from './WalletContext'

const BetaContext = React.createContext<boolean>(false);

export const BetaContextProvider = ({
  children,
}: Props) => {
  const [isBetaEnabled, setIsBetaEnabled] = useState(false);

  useEffect(() => {
    let userEntered: string[] = [];
    const secretSequence = [
      "38",
      "38",
      "40",
      "40",
      "37",
      "39",
      "37",
      "39",
      "66",
      "65",
    ];
    const secretListener = (event: KeyboardEvent) => {
      const k = event.keyCode.toString();
      if (k === secretSequence[userEntered.length]) {
        userEntered.push(k);
        if (userEntered.length === secretSequence.length) {
          userEntered = [];
          setIsBetaEnabled((prev) => !prev);
        }
      } else {
        userEntered = [];
      }
    };
    window.addEventListener("keydown", secretListener);
    return () => {
      window.removeEventListener("keydown", secretListener);
    };
  }, []);

  return (
    <BetaContext.Provider value={isBetaEnabled}>
      {children}
    </BetaContext.Provider>
  );
};

export const useBetaContext = () => {
  return useContext(BetaContext);
};
