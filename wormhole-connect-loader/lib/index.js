var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
var WormholeBridge = /** @class */ (function (_super) {
    __extends(WormholeBridge, _super);
    function WormholeBridge() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    WormholeBridge.prototype.componentDidMount = function () {
        var script = document.createElement("script");
        script.src = "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.1-beta.5/dist/main.js";
        script.async = true;
        var link = document.createElement("link");
        link.href = "https://www.unpkg.com/@wormhole-foundation/wormhole-connect@0.0.1-beta.5/dist/main.css";
        document.body.appendChild(script);
        document.body.appendChild(link);
    };
    WormholeBridge.prototype.render = function () {
        return (
        // @ts-ignore
        _jsx("div", { id: "wormhole-connect", config: this.props.config ? JSON.stringify(this.props.config) : null }));
    };
    return WormholeBridge;
}(React.Component));
export * from './theme';
export * from './types';
export default WormholeBridge;
