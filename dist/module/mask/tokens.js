"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    '#': { pattern: /\d/ },
    X: { pattern: /[0-9a-zA-Z]/ },
    S: { pattern: /[a-zA-Z]/ },
    A: { pattern: /[a-zA-Z]/, transform: (v) => v.toLocaleUpperCase() },
    a: { pattern: /[a-zA-Z]/, transform: (v) => v.toLocaleLowerCase() },
    '!': { escape: true }
};
