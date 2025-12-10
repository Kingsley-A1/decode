// Caesar Cipher - shifts letters by a given amount
export const caesarCipher = (
  str: string,
  shift: number,
  decrypt: boolean = false
): string => {
  const actualShift = decrypt ? 26 - (shift % 26) : shift % 26;
  return str.replace(/[a-zA-Z]/g, (char) => {
    const start = char <= "Z" ? 65 : 97;
    return String.fromCharCode(
      ((char.charCodeAt(0) - start + actualShift) % 26) + start
    );
  });
};

// Base64 Encoding/Decoding
export const toBase64 = (str: string): string => {
  if (typeof window !== "undefined") {
    try {
      return window.btoa(unescape(encodeURIComponent(str)));
    } catch {
      return "";
    }
  }
  return "";
};

export const fromBase64 = (str: string): string => {
  if (typeof window !== "undefined") {
    try {
      return decodeURIComponent(escape(window.atob(str)));
    } catch {
      return "";
    }
  }
  return "";
};

// ROT13 - special case of Caesar with shift 13
export const rot13 = (str: string): string => caesarCipher(str, 13);

// Reverse String
export const reverseString = (str: string): string =>
  str.split("").reverse().join("");

// Morse Code
const morseCodeMap: { [key: string]: string } = {
  A: ".-",
  B: "-...",
  C: "-.-.",
  D: "-..",
  E: ".",
  F: "..-.",
  G: "--.",
  H: "....",
  I: "..",
  J: ".---",
  K: "-.-",
  L: ".-..",
  M: "--",
  N: "-.",
  O: "---",
  P: ".--.",
  Q: "--.-",
  R: ".-.",
  S: "...",
  T: "-",
  U: "..-",
  V: "...-",
  W: ".--",
  X: "-..-",
  Y: "-.--",
  Z: "--..",
  "0": "-----",
  "1": ".----",
  "2": "..---",
  "3": "...--",
  "4": "....-",
  "5": ".....",
  "6": "-....",
  "7": "--...",
  "8": "---..",
  "9": "----.",
  " ": "/",
  ".": ".-.-.-",
  ",": "--..--",
  "?": "..--..",
  "!": "-.-.--",
  "'": ".----.",
  '"': ".-..-.",
  "(": "-.--.",
  ")": "-.--.-",
  "&": ".-...",
  ":": "---...",
  ";": "-.-.-.",
  "/": "-..-.",
  _: "..--.-",
  "=": "-...-",
  "+": ".-.-.",
  "-": "-....-",
  "@": ".--.-.",
};

const reverseMorseMap: { [key: string]: string } = Object.fromEntries(
  Object.entries(morseCodeMap).map(([k, v]) => [v, k])
);

export const toMorse = (str: string): string => {
  return str
    .toUpperCase()
    .split("")
    .map((char) => morseCodeMap[char] || char)
    .join(" ");
};

export const fromMorse = (str: string): string => {
  return str
    .split(" ")
    .map((code) => reverseMorseMap[code] || code)
    .join("");
};

// Binary Encoding/Decoding
export const toBinary = (str: string): string => {
  return str
    .split("")
    .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
    .join(" ");
};

export const fromBinary = (str: string): string => {
  try {
    return str
      .split(" ")
      .map((bin) => String.fromCharCode(parseInt(bin, 2)))
      .join("");
  } catch {
    return "";
  }
};

// Hex Encoding/Decoding
export const toHex = (str: string): string => {
  return str
    .split("")
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join(" ");
};

export const fromHex = (str: string): string => {
  try {
    return str
      .split(" ")
      .map((hex) => String.fromCharCode(parseInt(hex, 16)))
      .join("");
  } catch {
    return "";
  }
};

// URL Encoding/Decoding
export const toURLEncoded = (str: string): string => {
  try {
    return encodeURIComponent(str);
  } catch {
    return "";
  }
};

export const fromURLEncoded = (str: string): string => {
  try {
    return decodeURIComponent(str);
  } catch {
    return "";
  }
};

export type CipherType =
  | "caesar"
  | "base64"
  | "rot13"
  | "reverse"
  | "morse"
  | "binary"
  | "hex"
  | "url";

export interface CipherOption {
  id: CipherType;
  name: string;
  description: string;
  hasShift?: boolean;
}

export const cipherOptions: CipherOption[] = [
  {
    id: "caesar",
    name: "Caesar Cipher",
    description: "Shift letters by a number",
    hasShift: true,
  },
  { id: "base64", name: "Base64", description: "Standard encoding scheme" },
  { id: "rot13", name: "ROT13", description: "Caesar cipher with shift 13" },
  { id: "reverse", name: "Reverse", description: "Reverse the text" },
  { id: "morse", name: "Morse Code", description: "Dots and dashes" },
  { id: "binary", name: "Binary", description: "Convert to/from binary" },
  { id: "hex", name: "Hexadecimal", description: "Convert to/from hex" },
  { id: "url", name: "URL Encode", description: "Safe URL encoding" },
];

export const encrypt = (
  text: string,
  type: CipherType,
  shift: number = 3
): string => {
  switch (type) {
    case "caesar":
      return caesarCipher(text, shift);
    case "base64":
      return toBase64(text);
    case "rot13":
      return rot13(text);
    case "reverse":
      return reverseString(text);
    case "morse":
      return toMorse(text);
    case "binary":
      return toBinary(text);
    case "hex":
      return toHex(text);
    case "url":
      return toURLEncoded(text);
    default:
      return text;
  }
};

export const decrypt = (
  text: string,
  type: CipherType,
  shift: number = 3
): string => {
  switch (type) {
    case "caesar":
      return caesarCipher(text, shift, true);
    case "base64":
      return fromBase64(text);
    case "rot13":
      return rot13(text);
    case "reverse":
      return reverseString(text);
    case "morse":
      return fromMorse(text);
    case "binary":
      return fromBinary(text);
    case "hex":
      return fromHex(text);
    case "url":
      return fromURLEncoded(text);
    default:
      return text;
  }
};
