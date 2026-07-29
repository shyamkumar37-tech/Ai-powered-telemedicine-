import { useCallback, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AccessibilityProvider, useAccessibility } from "../context/AccessibilityContext";
import { useAuth } from "../context/AuthContext";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";
import { translateDisplayText } from "../utils/i18n";
import { roleRoutes } from "../utils/roleConfig";
import { buildLoginRedirect } from "../utils/authSession";
import AccessibilityToolbar from "./AccessibilityToolbar";
import { DynamicStateObject, DynamicState } from "./../types/DynamicState";

const SKIP_LINK_LABELS = {
  en: "Skip to main content",
  hi: "\u092e\u0941\u0916\u094d\u092f \u0938\u093e\u092e\u0917\u094d\u0930\u0940 \u092a\u0930 \u091c\u093e\u090f\u0901",
  ml: "\u0d2a\u0d4d\u0d30\u0d27\u0d3e\u0d28 \u0d09\u0d33\u0d4d\u0d33\u0d1f\u0d15\u0d4d\u0d15\u0d24\u0d4d\u0d24\u0d3f\u0d32\u0d47\u0d15\u0d4d\u0d15\u0d4d \u0d2a\u0d4b\u0d15\u0d41\u0d15",
  te: "\u0c2a\u0c4d\u0c30\u0c27\u0c3e\u0c28 \u0c15\u0c02\u0c1f\u0c46\u0c02\u0c1f\u0c4d\u0c15\u0c41 \u0c35\u0c46\u0c33\u0c4d\u0c32\u0c02\u0c21\u0c3f",
  pa: "\u0a2e\u0a41\u0a71\u0a16 \u0a38\u0a2e\u0a71\u0a17\u0a30\u0a40 \u0a35\u0a71\u0a32 \u0a1c\u0a3e\u0a13",
  ta: "\u0bae\u0bc1\u0b95\u0bcd\u0b95\u0bbf\u0baf \u0b89\u0bb3\u0bcd\u0bb3\u0b9f\u0b95\u0bcd\u0b95\u0ba4\u0bcd\u0ba4\u0bbf\u0bb1\u0bcd\u0b95\u0bc1 \u0b9a\u0bc6\u0bb2\u0bcd\u0bb2\u0bb5\u0bc1\u0bae\u0bcd"
};

const SPEECH_LANGUAGE_MAP = { en: "en-IN", hi: "hi-IN", ml: "ml-IN", te: "te-IN", pa: "pa-IN", ta: "ta-IN" };

const ANNOUNCEMENTS = {
  en: {
    screenReaderOn: "Screen reader mode enabled.",
    screenReaderOff: "Screen reader mode disabled.",
    voiceStarted: "Voice command mode started.",
    voiceStopped: "Voice command mode stopped.",
    commandNotRecognized: "Voice command not recognized.",
    voicePermissionDenied: "Microphone permission is blocked for voice commands."
  },
  hi: {
    screenReaderOn: "\u0938\u094d\u0915\u094d\u0930\u0940\u0928 \u0930\u0940\u0921\u0930 \u092e\u094b\u0921 \u0938\u0915\u094d\u0930\u093f\u092f \u0915\u093f\u092f\u093e \u0917\u092f\u093e.",
    screenReaderOff: "\u0938\u094d\u0915\u094d\u0930\u0940\u0928 \u0930\u0940\u0921\u0930 \u092e\u094b\u0921 \u092c\u0902\u0926 \u0915\u093f\u092f\u093e \u0917\u092f\u093e.",
    voiceStarted: "\u0935\u0949\u0907\u0938 \u0915\u092e\u093e\u0902\u0921 \u092e\u094b\u0921 \u0936\u0941\u0930\u0942 \u0915\u093f\u092f\u093e \u0917\u092f\u093e.",
    voiceStopped: "\u0935\u0949\u0907\u0938 \u0915\u092e\u093e\u0902\u0921 \u092e\u094b\u0921 \u092c\u0902\u0926 \u0915\u093f\u092f\u093e \u0917\u092f\u093e.",
    commandNotRecognized: "\u0935\u0949\u0907\u0938 \u0915\u092e\u093e\u0902\u0921 \u092a\u0939\u091a\u093e\u0928\u093e \u0928\u0939\u0940\u0902 \u0917\u092f\u093e.",
    voicePermissionDenied: "\u0935\u0949\u0907\u0938 \u0915\u092e\u093e\u0902\u0921 \u0915\u0947 \u0932\u093f\u090f \u092e\u093e\u0907\u0915\u094d\u0930\u094b\u092b\u094b\u0928 \u0905\u0928\u0941\u092e\u0924\u093f \u0930\u094b\u0915 \u0926\u0940 \u0917\u0908 \u0939\u0948\u0964"
  },
  ml: {
    screenReaderOn: "\u0d38\u0d4d\u0d15\u0d4d\u0d30\u0d40\u0d7b \u0d31\u0d40\u0d21\u0d7c \u0d2e\u0d4b\u0d21\u0d4d \u0d38\u0d1c\u0d40\u0d35\u0d2e\u0d3e\u0d15\u0d4d\u0d15\u0d3f.",
    screenReaderOff: "\u0d38\u0d4d\u0d15\u0d4d\u0d30\u0d40\u0d7b \u0d31\u0d40\u0d21\u0d7c \u0d2e\u0d4b\u0d21\u0d4d \u0d28\u0d3f\u0d7c\u0d24\u0d4d\u0d24\u0d3f.",
    voiceStarted: "\u0d36\u0d2c\u0d4d\u0d26 \u0d15\u0d2e\u0d3e\u0d7b\u0d21\u0d4d \u0d2e\u0d4b\u0d21\u0d4d \u0d06\u0d30\u0d02\u0d2d\u0d3f\u0d1a\u0d4d\u0d1a\u0d41.",
    voiceStopped: "\u0d36\u0d2c\u0d4d\u0d26 \u0d15\u0d2e\u0d3e\u0d7b\u0d21\u0d4d \u0d2e\u0d4b\u0d21\u0d4d \u0d28\u0d3f\u0d7c\u0d24\u0d4d\u0d24\u0d3f.",
    commandNotRecognized: "\u0d36\u0d2c\u0d4d\u0d26 \u0d15\u0d2e\u0d3e\u0d7b\u0d21\u0d4d \u0d2e\u0d28\u0d38\u0d4d\u0d38\u0d3f\u0d32\u0d3e\u0d2f\u0d3f\u0d32\u0d4d\u0d32.",
    voicePermissionDenied: "\u0d36\u0d2c\u0d4d\u0d26 \u0d15\u0d2e\u0d3e\u0d7b\u0d21\u0d41\u0d15\u0d7e\u0d15\u0d4d\u0d15\u0bbe\u0d2f\u0d3f \u0d2e\u0d48\u0d15\u0d4d\u0d30\u0d4b\u0d2b\u0d4b\u0d7a \u0d05\u0d28\u0d41\u0d2e\u0d24\u0d3f \u0d28\u0d3f\u0bb7\u0bc7\u0ba4\u0bbf\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0bc1."
  },
  te: {
    screenReaderOn: "\u0c38\u0c4d\u0c15\u0c4d\u0c30\u0c40\u0c28\u0c4d \u0c30\u0c40\u0c21\u0c30\u0c4d \u0c2e\u0c4b\u0c21\u0c4d \u0c2a\u0c4d\u0c30\u0c3e\u0c30\u0c02\u0c2d\u0c3f\u0c02\u0c1a\u0c2c\u0c21\u0c3f\u0c02\u0c26\u0c3f.",
    screenReaderOff: "\u0c38\u0c4d\u0c15\u0c4d\u0c30\u0c40\u0c28\u0c4d \u0c30\u0c40\u0c21\u0c30\u0c4d \u0c2e\u0c4b\u0c21\u0c4d \u0c28\u0c3f\u0c32\u0c3f\u0c2a\u0c3f\u0c35\u0c47\u0c2f\u0c2c\u0c21\u0c3f\u0c02\u0c26\u0c3f.",
    voiceStarted: "\u0c35\u0c3e\u0c2f\u0c3f\u0c38\u0c4d \u0c15\u0c2e\u0c3e\u0c02\u0c21\u0c4d \u0c2e\u0c4b\u0c21\u0c4d \u0c2a\u0c4d\u0c30\u0c3e\u0c30\u0c02\u0c2d\u0c3f\u0c02\u0c1a\u0c2c\u0c21\u0c3f\u0c02\u0c26\u0c3f.",
    voiceStopped: "\u0c35\u0c3e\u0c2f\u0c3f\u0c38\u0c4d \u0c15\u0c2e\u0c3e\u0c02\u0c21\u0c4d \u0c2e\u0c4b\u0c21\u0c4d \u0c06\u0c2a\u0c2c\u0c21\u0c3f\u0c02\u0c26\u0c3f.",
    commandNotRecognized: "\u0c35\u0c3e\u0c2f\u0c3f\u0c38\u0c4d \u0c15\u0c2e\u0c3e\u0c02\u0c21\u0c4d \u0c17\u0c41\u0c30\u0c4d\u0c24\u0c3f\u0c02\u0c1a\u0c2c\u0c21\u0c32\u0c47\u0c26\u0c41.",
    voicePermissionDenied: "\u0c35\u0c3e\u0c2f\u0c3f\u0c38\u0c4d \u0c15\u0c2e\u0c3e\u0c02\u0c21\u0c4d\u0c32\u0c15\u0c4b\u0c38\u0c02 \u0c2e\u0c48\u0c15\u0c4d\u0c30\u0c4b\u0c2b\u0c4b\u0c28\u0c4d \u0c05\u0c28\u0c41\u0c2e\u0c24\u0c3f \u0c28\u0c3f\u0cb0\u0c3e\u0c15\u0cb0\u0c3f\u0c02\u0c1a\u0c2c\u0c21\u0c3f\u0c02\u0c26\u0c3f."
  },
  pa: {
    screenReaderOn: "\u0a38\u0a15\u0a4d\u0a30\u0a40\u0a28 \u0a30\u0a40\u0a21\u0a30 \u0a2e\u0a4b\u0a21 \u0a1a\u0a3e\u0a32\u0a42 \u0a39\u0a4b \u0a17\u0a3f\u0a06 \u0a39\u0a48.",
    screenReaderOff: "\u0a38\u0a15\u0a4d\u0a30\u0a40\u0a28 \u0a30\u0a40\u0a21\u0a30 \u0a2e\u0a4b\u0a21 \u0a2c\u0a70\u0a26 \u0a39\u0a4b \u0a17\u0a3f\u0a06 \u0a39\u0a48.",
    voiceStarted: "\u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a15\u0a2e\u0a3e\u0a02\u0a21 \u0a2e\u0a4b\u0a21 \u0a36\u0a41\u0a30\u0a42 \u0a39\u0a4b \u0a17\u0a3f\u0a06 \u0a39\u0a48.",
    voiceStopped: "\u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a15\u0a2e\u0a3e\u0a02\u0a21 \u0a2e\u0a4b\u0a21 \u0a2c\u0a70\u0a26 \u0a39\u0a4b \u0a17\u0a3f\u0a06 \u0a39\u0a48.",
    commandNotRecognized: "\u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a15\u0a2e\u0a3e\u0a02\u0a21 \u0a38\u0a2e\u0a1d \u0a28\u0a39\u0a40\u0a02 \u0a06\u0a08.",
    voicePermissionDenied: "\u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a15\u0a2e\u0a3e\u0a02\u0a21\u0a3e\u0a02 \u0a32\u0a08 \u0a2e\u0a3e\u0a08\u0a15\u0a4d\u0a30\u0a4b\u0a2b\u0a4b\u0a28 \u0a05\u0a28\u0a41\u0a2e\u0a24\u0a3f \u0a30\u0a4b\u0a15 \u0a26\u0a3f\u0a71\u0a24\u0a40 \u0a17\u0a08 \u0a39\u0a48\u0964"
  },
  ta: {
    screenReaderOn: "\u0ba4\u0bbf\u0bb0\u0bc8 \u0bb5\u0bbe\u0b9a\u0bbf\u0baa\u0bcd\u0baa\u0bc1 \u0bae\u0bc1\u0bb1\u0bc8 \u0b9a\u0bc6\u0baf\u0bb2\u0bcd\u0baa\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0ba4\u0bc1.",
    screenReaderOff: "\u0ba4\u0bbf\u0bb0\u0bc8 \u0bb5\u0bbe\u0b9a\u0bbf\u0baa\u0bcd\u0baa\u0bc1 \u0bae\u0bc1\u0bb1\u0bc8 \u0ba8\u0bbf\u0bb1\u0bc1\u0ba4\u0bcd\u0ba4\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0ba4\u0bc1.",
    voiceStarted: "\u0b95\u0bc1\u0bb0\u0bb2\u0bcd \u0b95\u0b9f\u0bcd\u0b9f\u0bb3\u0bc8 \u0bae\u0bc1\u0bb1\u0bc8 \u0ba4\u0bca\u0b9f\u0b99\u0bcd\u0b95\u0bbf\u0baf\u0ba4\u0bc1.",
    voiceStopped: "\u0b95\u0bc1\u0bb0\u0bb2\u0bcd \u0b95\u0b9f\u0bcd\u0b9f\u0bb3\u0bc8 \u0bae\u0bc1\u0bb1\u0bc8 \u0ba8\u0bbf\u0bb1\u0bc1\u0ba4\u0bcd\u0ba4\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0ba4\u0bc1.",
    commandNotRecognized: "\u0b95\u0bc1\u0bb0\u0bb2\u0bcd \u0b95\u0b9f\u0bcd\u0b9f\u0bb3\u0bc8 \u0baa\u0bc1\u0bb0\u0bbf\u0baf\u0bb5\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8.",
    voicePermissionDenied: "\u0b95\u0bc1\u0bb0\u0bb2\u0bcd \u0b95\u0b9f\u0bcd\u0b9f\u0bb3\u0bc8\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bbe\u0ba9 \u0bae\u0bc8\u0b95\u0bcd\u0bb0\u0bcb\u0baa\u0bcb\u0ba9\u0bcd \u0b85\u0ba9\u0bc1\u0bae\u0ba4\u0bbf \u0ba4\u0b9f\u0bc1\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0bc1\u0bb3\u0bcd\u0bb3\u0ba4\u0bc1."
  }
};

const COMMANDS = {
  en: { readPage: ["read page", "read screen"], stop: ["stop", "stop reading", "silence"], logout: ["logout", "log out", "sign out"], goBack: ["back", "go back"], scrollDown: ["scroll down", "move down"], scrollUp: ["scroll up", "move up"], prefixes: ["click ", "press ", "open ", "go to ", "select ", "tap ", "focus "] },
  hi: { readPage: ["\u092a\u0947\u091c \u092a\u0922\u093c\u094b", "\u0938\u094d\u0915\u094d\u0930\u0940\u0928 \u092a\u0922\u093c\u094b", "read page"], stop: ["\u0930\u0941\u0915\u094b", "stop"], logout: ["\u0932\u0949\u0917\u0906\u0909\u091f", "logout"], goBack: ["\u092a\u0940\u091b\u0947", "back"], scrollDown: ["\u0928\u0940\u091a\u0947 \u091c\u093e\u0913", "scroll down"], scrollUp: ["\u090a\u092a\u0930 \u091c\u093e\u0913", "scroll up"], prefixes: ["\u0915\u094d\u0932\u093f\u0915 ", "\u0926\u092c\u093e\u0913 ", "\u0916\u094b\u0932\u094b ", "click ", "open "] },
  ml: { readPage: ["\u0d2a\u0d47\u0d1c\u0d4d \u0d35\u0d3e\u0d2f\u0d3f\u0d15\u0d4d\u0d15\u0d41\u0d15", "read page"], stop: ["\u0d28\u0d3f\u0d7c\u0d24\u0d4d\u0d24\u0d41\u0d15", "stop"], logout: ["\u0d32\u0d4b\u0d17\u0d4d\u0d14\u0d1f\u0d4d\u0d1f\u0d4d", "logout"], goBack: ["\u0d24\u0d3f\u0d30\u0d3f\u0d1a\u0d4d\u0d1a\u0d4d \u0d2a\u0d4b\u0d15\u0d41\u0d15", "back"], scrollDown: ["\u0d24\u0d3e\u0d34\u0d47\u0d15\u0d4d\u0d15\u0d4d \u0d2a\u0d4b\u0d15\u0d41\u0d15", "scroll down"], scrollUp: ["\u0d2e\u0d41\u0d15\u0d33\u0d3f\u0d32\u0d47\u0d15\u0d4d\u0d15\u0d4d \u0d2a\u0d4b\u0d15\u0d41\u0d15", "scroll up"], prefixes: ["\u0d15\u0d4d\u0d32\u0d3f\u0d15\u0d4d\u0d15\u0d4d ", "\u0d24\u0d41\u0d31\u0d15\u0d4d\u0d15\u0d42 ", "click ", "open "] },
  te: { readPage: ["\u0c2a\u0c47\u0c1c\u0c40 \u0c1a\u0c26\u0c35\u0c02\u0c21\u0c3f", "read page"], stop: ["\u0c06\u0c2a\u0c41", "stop"], logout: ["\u0c32\u0c3e\u0c17\u0c4c\u0c1f\u0c4d", "logout"], goBack: ["\u0c35\u0c46\u0c28\u0c15\u0c4d\u0c15\u0c3f", "back"], scrollDown: ["\u0c15\u0c3f\u0c02\u0c26\u0c3f\u0c15\u0c3f \u0c35\u0c46\u0c33\u0c4d\u0c32\u0c02\u0c21\u0c3f", "scroll down"], scrollUp: ["\u0c2a\u0c48\u0c15\u0c3f \u0c35\u0c46\u0c33\u0c4d\u0c32\u0c02\u0c21\u0c3f", "scroll up"], prefixes: ["\u0c15\u0c4d\u0c32\u0c3f\u0c15\u0c4d ", "\u0c24\u0c46\u0c30\u0c35\u0c02\u0c21\u0c3f ", "click ", "open "] },
  pa: { readPage: ["\u0a2a\u0a70\u0a28\u0a3e \u0a2a\u0a5c\u0a4d\u0a39\u0a4b", "read page"], stop: ["\u0a30\u0a4b\u0a15\u0a4b", "stop"], logout: ["\u0a32\u0a3e\u0a17\u0a06\u0a09\u0a1f", "logout"], goBack: ["\u0a35\u0a3e\u0a2a\u0a38", "back"], scrollDown: ["\u0a39\u0a47\u0a20\u0a3e\u0a02 \u0a1c\u0a3e\u0a13", "scroll down"], scrollUp: ["\u0a09\u0a71\u0a2a\u0a30 \u0a1c\u0a3e\u0a13", "scroll up"], prefixes: ["\u0a15\u0a32\u0a3f\u0a15 ", "\u0a26\u0a2c\u0a3e\u0a13 ", "click ", "open "] },
  ta: { readPage: ["\u0baa\u0b95\u0bcd\u0b95\u0bae\u0bcd \u0bb5\u0bbe\u0b9a\u0bbf", "read page"], stop: ["\u0ba8\u0bbf\u0bb1\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1", "stop"], logout: ["\u0bb5\u0bc6\u0bb3\u0bbf\u0baf\u0bc7\u0bb1\u0bc1", "logout"], goBack: ["\u0baa\u0bbf\u0ba9\u0bcd\u0ba9\u0bc1\u0b95\u0bcd\u0b95\u0bc1", "back"], scrollDown: ["\u0b95\u0bc0\u0bb4\u0bc7 \u0b9a\u0bc6\u0bb2\u0bcd", "scroll down"], scrollUp: ["\u0bae\u0bc7\u0bb2\u0bc7 \u0b9a\u0bc6\u0bb2\u0bcd", "scroll up"], prefixes: ["\u0b95\u0bbf\u0bb3\u0bbf\u0b95\u0bcd ", "\u0b85\u0bb4\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1 ", "click ", "open "] }
};

const KEY_LABELS = {
  en: { Alt: "Alt", Shift: "Shift", Control: "Control", Meta: "Windows", Tab: "Tab", Enter: "Enter", Escape: "Escape", Backspace: "Backspace", Delete: "Delete", CapsLock: "Caps Lock", Space: "Space", ArrowUp: "Up arrow", ArrowDown: "Down arrow", ArrowLeft: "Left arrow", ArrowRight: "Right arrow", Home: "Home", End: "End", PageUp: "Page up", PageDown: "Page down", Insert: "Insert" },
  hi: { Alt: "\u0911\u0932\u094d\u091f", Shift: "\u0936\u093f\u092b\u094d\u091f", Control: "\u0915\u0902\u091f\u094d\u0930\u094b\u0932", Meta: "\u0935\u093f\u0902\u0921\u094b\u091c\u093c", Tab: "\u091f\u0948\u092c", Enter: "\u090f\u0902\u091f\u0930", Escape: "\u090f\u0938\u094d\u0915\u0947\u092a", Backspace: "\u092c\u0948\u0915\u0938\u094d\u092a\u0947\u0938", Delete: "\u0921\u093f\u0932\u0940\u091f", CapsLock: "\u0915\u0948\u092a\u094d\u0938 \u0932\u0949\u0915", Space: "\u0938\u094d\u092a\u0947\u0938", ArrowUp: "\u090a\u092a\u0930 \u0924\u0940\u0930", ArrowDown: "\u0928\u0940\u091a\u0947 \u0924\u0940\u0930", ArrowLeft: "\u092c\u093e\u092f\u093e\u0901 \u0924\u0940\u0930", ArrowRight: "\u0926\u093e\u092f\u093e\u0901 \u0924\u0940\u0930", Home: "\u0939\u094b\u092e", End: "\u090f\u0902\u0921", PageUp: "\u092a\u0947\u091c \u0905\u092a", PageDown: "\u092a\u0947\u091c \u0921\u093e\u0909\u0928", Insert: "\u0907\u0928\u094d\u0938\u0930\u094d\u091f" },
  ml: { Alt: "\u0d06\u0d7e\u0d1f\u0d4d", Shift: "\u0d37\u0d3f\u0d2b\u0d4d\u0d31\u0d4d", Control: "\u0d15\u0d23\u0d4d\u0d1f\u0d4d\u0d30\u0d4b\u0d7e", Meta: "\u0d35\u0d3f\u0d7b\u0d21\u0d4b\u0d38\u0d4d", Tab: "\u0d1f\u0d3e\u0d2c\u0d4d", Enter: "\u0d0e\u0d28\u0d4d\u0d31\u0d7c", Escape: "\u0d0e\u0d38\u0d4d\u0d15\u0d47\u0d2a\u0d4d", Backspace: "\u0d2c\u0d3e\u0d15\u0d4d\u0d38\u0d4d\u0d2a\u0d47\u0d38\u0d4d", Delete: "\u0d21\u0d3f\u0d32\u0d40\u0d31\u0d4d\u0d31\u0d4d", CapsLock: "\u0d15\u0d4d\u0d2f\u0d3e\u0d2a\u0d4d\u0d38\u0d4d \u0d32\u0d4b\u0d15\u0d4d", Space: "\u0d38\u0d4d\u0d2a\u0d47\u0d38\u0d4d", ArrowUp: "\u0d2e\u0d41\u0d15\u0d33\u0d3f\u0d7d \u0d05\u0d2e\u0d4d\u0d2a\u0d4d", ArrowDown: "\u0d24\u0d3e\u0d34\u0d47 \u0d05\u0d2e\u0d4d\u0d2a\u0d4d", ArrowLeft: "\u0d07\u0d1f\u0d24\u0d4d \u0d05\u0d2e\u0d4d\u0d2a\u0d4d", ArrowRight: "\u0d35\u0d32\u0d24\u0d4d \u0d05\u0d2e\u0d4d\u0d2a\u0d4d", Home: "\u0d39\u0d4b\u0d02", End: "\u0d0e\u0d28\u0d4d\u0d21\u0d4d", PageUp: "\u0d2a\u0d47\u0d1c\u0d4d \u0d05\u0d2a\u0d4d", PageDown: "\u0d2a\u0d47\u0d1c\u0d4d \u0d21\u0d57\u0d7a", Insert: "\u0d07\u0d28\u0d4d\u0d38\u0d47\u0d7c\u0d1f\u0d4d" },
  te: { Alt: "\u0c06\u0c32\u0c4d\u0c1f\u0c4d", Shift: "\u0c37\u0c3f\u0c2b\u0c4d\u0c1f\u0c4d", Control: "\u0c15\u0c02\u0c1f\u0c4d\u0c30\u0c4b\u0c32\u0c4d", Meta: "\u0c35\u0c3f\u0c02\u0c21\u0c4b\u0c38\u0c4d", Tab: "\u0c1f\u0c4d\u0c2f\u0c3e\u0c2c\u0c4d", Enter: "\u0c0e\u0c02\u0c1f\u0c30\u0c4d", Escape: "\u0c0e\u0c38\u0c4d\u0c15\u0c47\u0c2a\u0c4d", Backspace: "\u0c2c\u0c4d\u0c2f\u0c3e\u0c15\u0c4d\u0c38\u0c4d\u0c2a\u0c47\u0c38\u0c4d", Delete: "\u0c21\u0c3f\u0c32\u0c40\u0c1f\u0c4d", CapsLock: "\u0c15\u0c4d\u0c2f\u0c3e\u0c2a\u0c4d\u0c38\u0c4d \u0c32\u0c3e\u0c15\u0c4d", Space: "\u0c38\u0c4d\u0c2a\u0c47\u0c38\u0c4d", ArrowUp: "\u0c2a\u0c48 \u0c2c\u0c3e\u0c23\u0c02", ArrowDown: "\u0c15\u0c3f\u0c02\u0c26\u0c3f \u0c2c\u0c3e\u0c23\u0c02", ArrowLeft: "\u0c0e\u0c21\u0c2e \u0c2c\u0c3e\u0c23\u0c02", ArrowRight: "\u0c15\u0c41\u0c21\u0c3f \u0c2c\u0c3e\u0c23\u0c02", Home: "\u0c39\u0c4b\u0c2e\u0c4d", End: "\u0c0e\u0c02\u0c21\u0c4d", PageUp: "\u0c2a\u0c47\u0c1c\u0c4d \u0c05\u0c2a\u0c4d", PageDown: "\u0c2a\u0c47\u0c1c\u0c4d \u0c21\u0c4c\u0c28\u0c4d", Insert: "\u0c07\u0c28\u0c4d\u0c38\u0c30\u0c4d\u0c1f\u0c4d" },
  pa: { Alt: "\u0a06\u0a32\u0a1f", Shift: "\u0a36\u0a3f\u0a2b\u0a1f", Control: "\u0a15\u0a70\u0a1f\u0a30\u0a4b\u0a32", Meta: "\u0a35\u0a3f\u0a70\u0a21\u0a4b\u0a1c\u0a3c", Tab: "\u0a1f\u0a48\u0a2c", Enter: "\u0a10\u0a02\u0a1f\u0a30", Escape: "\u0a10\u0a38\u0a15\u0a47\u0a2a", Backspace: "\u0a2c\u0a48\u0a15\u0a38\u0a2a\u0a47\u0a38", Delete: "\u0a21\u0a3f\u0a32\u0a40\u0a1f", CapsLock: "\u0a15\u0a48\u0a2a\u0a38 \u0a32\u0a3e\u0a15", Space: "\u0a38\u0a2a\u0a47\u0a38", ArrowUp: "\u0a09\u0a71\u0a2a\u0a30 \u0a24\u0a40\u0a30", ArrowDown: "\u0a39\u0a47\u0a20\u0a3e\u0a02 \u0a24\u0a40\u0a30", ArrowLeft: "\u0a16\u0a71\u0a2c\u0a3e \u0a24\u0a40\u0a30", ArrowRight: "\u0a38\u0a71\u0a1c\u0a3e \u0a24\u0a40\u0a30", Home: "\u0a39\u0a4b\u0a2e", End: "\u0a10\u0a02\u0a21", PageUp: "\u0a2a\u0a47\u0a1c \u0a05\u0a71\u0a2a", PageDown: "\u0a2a\u0a47\u0a1c \u0a21\u0a3e\u0a0a\u0a28", Insert: "\u0a07\u0a28\u0a38\u0a30\u0a1f" },
  ta: { Alt: "\u0b86\u0bb2\u0bcd\u0b9f\u0bcd", Shift: "\u0bb7\u0bbf\u0baa\u0bcd\u0b9f\u0bcd", Control: "\u0b95\u0ba9\u0bcd\u0b9f\u0bcd\u0bb0\u0bcb\u0bb2\u0bcd", Meta: "\u0bb5\u0bbf\u0ba3\u0bcd\u0b9f\u0bcb\u0bb8\u0bcd", Tab: "\u0b9f\u0bbe\u0baa\u0bcd", Enter: "\u0b8e\u0ba9\u0bcd\u0b9f\u0bb0\u0bcd", Escape: "\u0b8e\u0bb8\u0bcd\u0b95\u0bc7\u0baa\u0bcd", Backspace: "\u0baa\u0bc7\u0b95\u0bcd\u0bb8\u0bcd\u0baa\u0bc7\u0bb8\u0bcd", Delete: "\u0b9f\u0bbf\u0bb2\u0bc0\u0b9f\u0bcd", CapsLock: "\u0b95\u0bc7\u0baa\u0bcd\u0bb8\u0bcd \u0bb2\u0bbe\u0b95\u0bcd", Space: "\u0bb8\u0bcd\u0baa\u0bc7\u0bb8\u0bcd", ArrowUp: "\u0bae\u0bc7\u0bb2\u0bcd \u0b85\u0bae\u0bcd\u0baa\u0bc1", ArrowDown: "\u0b95\u0bc0\u0bb4\u0bcd \u0b85\u0bae\u0bcd\u0baa\u0bc1", ArrowLeft: "\u0b87\u0b9f\u0ba4\u0bc1 \u0b85\u0bae\u0bcd\u0baa\u0bc1", ArrowRight: "\u0bb5\u0bb2\u0ba4\u0bc1 \u0b85\u0bae\u0bcd\u0baa\u0bc1", Home: "\u0bb9\u0bcb\u0bae\u0bcd", End: "\u0b8e\u0ba3\u0bcd\u0b9f\u0bcd", PageUp: "\u0baa\u0bc7\u0b9c\u0bcd \u0b85\u0baa\u0bcd", PageDown: "\u0baa\u0bc7\u0b9c\u0bcd \u0b9f\u0bb5\u0bc1\u0ba9\u0bcd", Insert: "\u0b87\u0ba9\u0bcd\u0b9a\u0bb0\u0bcd\u0b9f\u0bcd" }
};

const ENGLISH_ROUTE_ALIASES = { dashboard: ["dashboard", "home"], profile: ["profile"], triage: ["triage"], book: ["book", "booking"], appointments: ["appointments", "appointment"], prescriptions: ["prescriptions", "prescription"], reminders: ["reminders", "reminder"], health: ["health", "readings"], messages: ["messages", "message"], aiChatbot: ["chatbot", "assistant"], ivrBooking: ["ivr", "voice booking"], futureCare: ["future care", "future"], observations: ["observations", "observation", "lab", "wearables"], familyNetwork: ["family network", "caregiver network"], voiceAssist: ["voice assist", "voice support"], timeline: ["timeline"], education: ["education", "guidance"], carePlans: ["care plans", "care plan"], notifications: ["notifications", "alerts"], records: ["records", "medical records"], consultation: ["consultation"], intelligence: ["intelligence"], referrals: ["referrals", "referral"], populationInsights: ["population insights", "insights"], monitoring: ["monitoring"], interventions: ["interventions", "intervention"], careGaps: ["care gaps"], inventory: ["inventory"], dispensing: ["dispensing"] };

function normalizeCommand(text: DynamicStateObject) {
  return String(text || "").toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim();
}

function stripVoiceCommandPrefix(text: DynamicStateObject, prefixes: DynamicStateObject) {
  const normalized = normalizeCommand(text);
  const matchedPrefix = prefixes.find((prefix: DynamicStateObject) => normalized.startsWith(normalizeCommand(prefix)));
  return matchedPrefix ? normalized.slice(normalizeCommand(matchedPrefix).length).trim() : normalized;
}

function cleanSpokenLabel(label: DynamicStateObject) {
  return String(label || "").replace(/\b(link|button|textbox|combobox|checkbox|radio button)\b/gi, "").replace(/\s+/g, " ").trim();
}

function extractElementLabel(element: DynamicStateObject) {
  if (!(element instanceof Element)) return "";
  const voiceLabel = element.getAttribute("data-voice-label");
  if (voiceLabel) return cleanSpokenLabel(voiceLabel);
  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel) return cleanSpokenLabel(ariaLabel);
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    const labelText = labelledBy.split(/\s+/).map((id: number | string) => (document.getElementById((id as any)) as any)?.textContent?.trim() || "").filter(Boolean).join(" ");
    if (labelText) return cleanSpokenLabel(labelText);
  }
  const describedBy = element.getAttribute("aria-describedby");
  if (describedBy) {
    const descriptionText = describedBy
      .split(/\s+/)
      .map((id: number | string) => (document.getElementById as any)(id)?.textContent?.trim() || "")
      .filter(Boolean)
      .join(" ");
    if (descriptionText) return cleanSpokenLabel(descriptionText);
  }
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
    if (element.labels?.length) {
      const labelText = Array.from(element.labels).map((label: DynamicStateObject) => label.textContent?.trim() || "").filter(Boolean).join(" ");
      if (labelText) return cleanSpokenLabel(labelText);
    }
    if ((element as any).placeholder) return (cleanSpokenLabel((element as any).placeholder) as any);
  }
  if (element instanceof HTMLElement && element.title) return cleanSpokenLabel(element.title);
  const dataTestId = element.getAttribute("data-testid");
  if (dataTestId) return cleanSpokenLabel(dataTestId.replace(/[-_]+/g, " "));
  const nameAttribute = element.getAttribute("name");
  if (nameAttribute) return cleanSpokenLabel(nameAttribute.replace(/[-_]+/g, " "));
  if ("value" in element && typeof element.value === "string" && element.value.trim()) {
    return cleanSpokenLabel(element.value);
  }
  const childImageAlt = element.querySelector("img[alt]")?.getAttribute("alt");
  if (childImageAlt) return cleanSpokenLabel(childImageAlt);
  const childSvgAria = element.querySelector("svg[aria-label]")?.getAttribute("aria-label");
  if (childSvgAria) return cleanSpokenLabel(childSvgAria);
  const childSvgTitle = element.querySelector("svg title")?.textContent?.trim();
  if (childSvgTitle) return cleanSpokenLabel(childSvgTitle);
  return cleanSpokenLabel(element.textContent?.replace(/\s+/g, " ").trim() || "");
}

function findInteractiveTarget(node: DynamicStateObject) {
  return node instanceof Element
    ? node.closest("button, a, input, select, textarea, [role='button'], [role='tab'], [role='switch'], [role='menuitem'], [role='link'], [tabindex]:not([tabindex='-1']), [data-voice-label], [data-testid], [name]")
    : null;
}

function isVisibleElement(element: DynamicStateObject) {
  if (!(element instanceof Element)) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  if (element instanceof HTMLElement && element.hidden) return false;
  return element.getClientRects().length > 0;
}

function collectVoiceTargets() {
  return Array.from(document.querySelectorAll(
    "button, a[href], input, select, textarea, [role='button'], [role='tab'], [role='switch'], [role='menuitem'], [role='link'], [tabindex]:not([tabindex='-1']), [data-voice-label], [data-testid], [name]"
  ))
    .filter((element: DynamicStateObject) => element instanceof HTMLElement && isVisibleElement(element))
    .map((element: DynamicStateObject) => ({ element, label: extractElementLabel(element), normalizedLabel: normalizeCommand(extractElementLabel(element)) }))
    .filter((item: DynamicStateObject) => item.label && item.normalizedLabel)
    .sort((a: DynamicStateObject, b: DynamicStateObject) => b.normalizedLabel.length - a.normalizedLabel.length);
}

function getSpokenKeyLabel(event: DynamicStateObject, language: DynamicStateObject) {
  const labels = (KEY_LABELS as DynamicStateObject)[language] ?? KEY_LABELS.en;
  const modifiers: DynamicStateObject = [];
  if (event.ctrlKey && event.key !== "Control") modifiers.push(labels.Control);
  if (event.altKey && event.key !== "Alt") modifiers.push(labels.Alt);
  if (event.shiftKey && event.key !== "Shift") modifiers.push(labels.Shift);
  if (event.metaKey && event.key !== "Meta") modifiers.push(labels.Meta);
  const key = event.key === " " ? "Space" : event.key;
  const spokenKey = (labels as DynamicStateObject)[key] || (typeof key === "string" && key.length === 1 ? key : String(key));
  return [...modifiers, spokenKey].filter(Boolean).join(" ");
}

function localizeSpokenLabel(label: DynamicStateObject, translateUiText: DynamicStateObject) {
  if (!label) {
    return "";
  }

  return translateUiText(label);
}

function getPublicRouteLabel(pathname: DynamicStateObject, t: DynamicStateObject) {
  if (pathname === "/login") return t("login");
  if (pathname === "/register") return t("createAccount");
  if (pathname === "/") return t("appName");
  return "";
}

async function requestMicrophoneAccess() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return false;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track: DynamicStateObject) => track.stop());
    return true;
  } catch {
    return false;
  }
}

export interface AccessibilityFrameContentProps {
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

function AccessibilityFrameContent({ children }: AccessibilityFrameContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { auth, logout } = useAuth();
  const { language, t, translateUiText = (value: string | number) => translateDisplayText(language, value) } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const { announce, speak, stopReading, readCurrentPage, screenReaderMode, speechSupported, toggleScreenReaderMode } = useAccessibility();
  const recognitionRef = useRef<DynamicState>(null);
  const restartTimerRef = useRef<DynamicState>(null);
  const restartBlockedRef = useRef<DynamicState>(false);
  const lastAnnouncementRef = useRef<DynamicState>({ text: "", time: 0, element: null });
  const suppressFocusUntilRef = useRef<DynamicState>(0);
  const [voiceCommandListening, setVoiceCommandListening] = useState<DynamicState>(false);
  const [voiceCommandActive, setVoiceCommandActive] = useState<DynamicState>(false);
  const [voiceCommandPermission, setVoiceCommandPermission] = useState<DynamicState>("unknown");

  const localizedText = (ANNOUNCEMENTS as DynamicStateObject)[language] ?? ANNOUNCEMENTS.en;
  const speechUnavailableMessage = (t("speechPlaybackIsNotAvailableInThisBrowser") || "Speech playback is not available in this browser.");
  const browserSpeechSupported = typeof window !== "undefined"
    && (Boolean(window.speechSynthesis) || "speechSynthesis" in window || "SpeechSynthesisUtterance" in window);
  const canSpeak = speechSupported || browserSpeechSupported;
  const voiceUnavailableMessage = (t("voiceCommandsAreNotAvailableInThisBrowser") || "Voice commands are not available in this browser.");
  const commandSet = (COMMANDS as DynamicStateObject)[language] ?? COMMANDS.en;
  const voiceCommandSupported = typeof window !== "undefined"
    && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const voicePermissionDenied = voiceCommandPermission === "denied";
  const availableRoutes = useMemo(() => (roleRoutes as DynamicStateObject)[auth?.role] ?? [], [auth?.role]);
  const languageSearch = location.search || (language && language !== "en" ? `?lang=${language}` : "");

  const routeVoiceTargets = useMemo(() => availableRoutes.map((item: DynamicStateObject) => {
    const translatedLabel = t(item.labelKey);
    return {
      ...item,
      translatedLabel,
      aliases: [normalizeCommand(translatedLabel), normalizeCommand(item.labelKey), ...((ENGLISH_ROUTE_ALIASES as DynamicStateObject)[item.labelKey] || []).map(normalizeCommand)].filter(Boolean)
    };
  }), [availableRoutes, t]);

  const announceSafely = useCallback((text: DynamicStateObject, speakAloud = true, force = false) => {
    announce(text, language, false);

    const shouldSpeak = screenReaderMode && canSpeak && (force || (speakAloud && !voiceCommandListening));
    if (shouldSpeak) {
      speak(text, language, force ? { force: true } : {});
    }
  }, [announce, canSpeak, language, screenReaderMode, speak, voiceCommandListening]);

  const stopVoiceCommands = useCallback(() => {
    setVoiceCommandActive(false);
    setVoiceCommandListening(false);
    restartBlockedRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore browser-specific stop errors.
    }
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.permissions?.query) {
      setVoiceCommandPermission("unknown");
      return undefined;
    }

    let active = true;
    let permissionStatus: DynamicStateObject;

    navigator.permissions.query({ name: "microphone" })
      .then((status: DynamicStateObject) => {
        if (!active) {
          return;
        }

        permissionStatus = status;
        setVoiceCommandPermission(status.state || "unknown");
        status.onchange = () => setVoiceCommandPermission(status.state || "unknown");
      })
      .catch(() => {
        if (active) {
          setVoiceCommandPermission("unknown");
        }
      });

    return () => {
      active = false;
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, []);

  const activateInteractiveTarget = useCallback((spokenText: DynamicStateObject) => {
    const normalized = stripVoiceCommandPrefix(spokenText, commandSet.prefixes);
    if (!normalized) return false;
    const match = collectVoiceTargets().find(({ normalizedLabel }: DynamicStateObject) => normalized === normalizedLabel || normalized.includes(normalizedLabel) || normalizedLabel.includes(normalized));
    if (!match) return false;
    const { element, label } = match;
    const localizedLabel = localizeSpokenLabel(label, translateUiText);
    element.focus();
    if (element instanceof HTMLInputElement && (element.type === "checkbox" || element.type === "radio")) {
      element.click();
    } else if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
      element.click();
    }
    announceSafely(localizedLabel || label, true, true);
    return true;
  }, [announceSafely, commandSet.prefixes, language, translateUiText]);

  const handleVoiceCommand = useCallback((spokenText: DynamicStateObject) => {
    const normalized = stripVoiceCommandPrefix(spokenText, commandSet.prefixes);
    if (!normalized) {
      announceSafely(localizedText.commandNotRecognized, true, true);
      return;
    }
    if (commandSet.readPage.some((phrase: DynamicStateObject) => normalized.includes(normalizeCommand(phrase)))) {
      readCurrentPage(language);
      return;
    }
    if (commandSet.stop.some((phrase: DynamicStateObject) => normalized.includes(normalizeCommand(phrase)))) {
      stopReading();
      stopVoiceCommands();
      announceSafely(localizedText.voiceStopped, true, true);
      return;
    }
    if (commandSet.logout.some((phrase: DynamicStateObject) => normalized.includes(normalizeCommand(phrase)))) {
      logout();
      navigate(buildLoginRedirect(languageSearch), { replace: true });
      return;
    }
    if (commandSet.goBack.some((phrase: DynamicStateObject) => normalized.includes(normalizeCommand(phrase)))) {
      navigate(-1);
      return;
    }
    if (commandSet.scrollDown.some((phrase: DynamicStateObject) => normalized.includes(normalizeCommand(phrase)))) {
      window.scrollBy({ top: window.innerHeight * 0.75, behavior: "smooth" });
      return;
    }
    if (commandSet.scrollUp.some((phrase: DynamicStateObject) => normalized.includes(normalizeCommand(phrase)))) {
      window.scrollBy({ top: -window.innerHeight * 0.75, behavior: "smooth" });
      return;
    }
    const routeMatch = routeVoiceTargets.find((item: DynamicStateObject) => item.aliases.some((alias: DynamicStateObject) => alias === normalized || alias.includes(normalized) || normalized.includes(alias)));
    if (routeMatch) {
      navigate(`${routeMatch.path}${languageSearch}`);
      announceSafely(routeMatch.translatedLabel, true, true);
      return;
    }
    if (activateInteractiveTarget(spokenText)) {
      return;
    }
    announceSafely(localizedText.commandNotRecognized, true, true);
  }, [activateInteractiveTarget, announceSafely, commandSet, language, localizedText.commandNotRecognized, localizedText.voiceStopped, logout, navigate, readCurrentPage, routeVoiceTargets, stopReading, stopVoiceCommands]);

  const startVoiceCommands = useCallback(async () => {
    if (!voiceCommandSupported || !recognitionRef.current) {
      announce(voiceUnavailableMessage, language, false);
      return;
    }
    if (voicePermissionDenied) {
      announceSafely(localizedText.voicePermissionDenied, true, true);
      return;
    }
    if (voiceCommandPermission === "prompt") {
      const granted = await requestMicrophoneAccess();
      if (!granted) {
        setVoiceCommandPermission("denied");
        announceSafely(localizedText.voicePermissionDenied, true, true);
        return;
      }
      setVoiceCommandPermission("granted");
    }
    restartBlockedRef.current = false;
    setVoiceCommandActive(true);
    setVoiceCommandListening(true);
    announceSafely(localizedText.voiceStarted, true, true);
    try {
      recognitionRef.current.start();
    } catch {
      restartBlockedRef.current = true;
      setVoiceCommandActive(false);
      setVoiceCommandListening(false);
      announceSafely(localizedText.voicePermissionDenied, true, true);
    }
  }, [announce, announceSafely, language, localizedText.voicePermissionDenied, localizedText.voiceStarted, voiceCommandPermission, voiceCommandSupported, voicePermissionDenied, voiceUnavailableMessage]);

  useEffect(() => {
    if (!voiceCommandSupported) {
      recognitionRef.current = null;
      return undefined;
    }
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    let recognition: DynamicStateObject;
    try {
      recognition = new Recognition();
    } catch {
      recognitionRef.current = null;
      return undefined;
    }
    recognition.lang = (SPEECH_LANGUAGE_MAP as DynamicStateObject)[language] || SPEECH_LANGUAGE_MAP.en;
    recognition.interimResults = false;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: DynamicStateObject) => {
      const finalTranscript = Array.from(event.results || []).filter((result: DynamicStateObject) => result.isFinal).map((result: DynamicStateObject) => (result as DynamicStateObject)[0]?.transcript || "").join(" ").trim();
      if (finalTranscript) handleVoiceCommand(finalTranscript);
    };
    recognition.onerror = (event: DynamicStateObject) => {
      const errorCode = String(event?.error || "").toLowerCase();
      const fatalError = [
        "not-allowed",
        "service-not-allowed",
        "audio-capture",
        "language-not-supported",
        "network"
      ].includes(errorCode);

      setVoiceCommandListening(false);

      if (fatalError) {
        restartBlockedRef.current = true;
        setVoiceCommandActive(false);
        if (errorCode === "not-allowed" || errorCode === "service-not-allowed") {
          setVoiceCommandPermission("denied");
          announceSafely(localizedText.voicePermissionDenied, true, true);
        }
      }
    };
    recognition.onend = () => {
      setVoiceCommandListening(false);
      if (voiceCommandActive && !restartBlockedRef.current) {
        restartTimerRef.current = setTimeout(() => {
          try {
            setVoiceCommandListening(true);
            recognition.start();
          } catch {
            restartBlockedRef.current = true;
            setVoiceCommandActive(false);
            setVoiceCommandListening(false);
          }
        }, 300);
      }
    };
    recognitionRef.current = recognition;
    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      try {
        recognition.stop();
      } catch {
        // Ignore browser-specific cleanup errors.
      }
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };
  }, [announceSafely, handleVoiceCommand, language, localizedText.voicePermissionDenied, voiceCommandActive, voiceCommandSupported]);

  useEffect(() => {
    const onKeyDown = (event: DynamicStateObject) => {
      const shortcutKey = String(event.key || "").toLowerCase();
      if (event.altKey && event.shiftKey && shortcutKey === "a") {
        event.preventDefault();
        if (!screenReaderMode && !canSpeak) {
          announce(speechUnavailableMessage, language, false);
          return;
        }
        const nextEnabled = !screenReaderMode;
        if (!nextEnabled) {
          stopReading();
        }
        toggleScreenReaderMode();
        announce(nextEnabled ? localizedText.screenReaderOn : localizedText.screenReaderOff, language, false);
        if (nextEnabled) {
          speak(localizedText.screenReaderOn, language, { force: true });
        }
        return;
      }
      if (event.altKey && event.shiftKey && shortcutKey === "r") {
        event.preventDefault();
        if (!canSpeak) {
          announce(speechUnavailableMessage, language, false);
          return;
        }
        readCurrentPage(language);
        return;
      }
      if (event.altKey && event.shiftKey && shortcutKey === "s") {
        event.preventDefault();
        stopReading();
        stopVoiceCommands();
        announceSafely(localizedText.voiceStopped, true, true);
        return;
      }
      if (event.altKey && event.shiftKey && shortcutKey === "v") {
        event.preventDefault();
        if (voiceCommandListening || voiceCommandActive) {
          stopVoiceCommands();
          announceSafely(localizedText.voiceStopped, true, true);
        } else {
          if (!voiceCommandSupported) {
            announce(voiceUnavailableMessage, language, false);
            return;
          }
          startVoiceCommands();
        }
        return;
      }
      if (screenReaderMode && !event.repeat) {
        speak(getSpokenKeyLabel(event, language), language, { force: true });
      }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [announce, announceSafely, language, localizedText.screenReaderOff, localizedText.screenReaderOn, localizedText.voiceStopped, readCurrentPage, screenReaderMode, speechSupported, speak, speechUnavailableMessage, startVoiceCommands, stopReading, stopVoiceCommands, toggleScreenReaderMode, voiceCommandActive, voiceCommandListening, voiceCommandSupported, voiceUnavailableMessage]);

  useEffect(() => {
    if (!screenReaderMode) return undefined;
    const announceElement = (event: DynamicStateObject, source: DynamicStateObject) => {
      const rawTarget = event.target instanceof HTMLElement ? event.target : null;
      const interactiveTarget = findInteractiveTarget(event.target) || rawTarget;
      if (!interactiveTarget || !isVisibleElement(interactiveTarget)) return;
      if (source === "pointer" && "button" in event && event.button !== 0) return;
      if (source === "key" && event.repeat) return;
      if (Date.now() < suppressFocusUntilRef.current && source === "focus") return;
      const label = extractElementLabel(interactiveTarget);
      if (!label) return;
      const localizedLabel = localizeSpokenLabel(label, translateUiText);
      const now = Date.now();
      if (lastAnnouncementRef.current.element === interactiveTarget && lastAnnouncementRef.current.text === localizedLabel && now - lastAnnouncementRef.current.time < 1500) return;
      lastAnnouncementRef.current = { element: interactiveTarget, text: localizedLabel, time: now };
      announceSafely(localizedLabel || label, true, true);
    };
    const onFocusIn = (event: DynamicStateObject) => announceElement(event, "focus");
    const onClick = (event: DynamicStateObject) => announceElement(event, "click");
    const onPointerDown = (event: DynamicStateObject) => announceElement(event, "pointer");
    const onPointerUp = (event: DynamicStateObject) => announceElement(event, "pointer");
    const onKeyDown = (event: DynamicStateObject) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      announceElement(event, "key");
    };
    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("click", onClick, true);
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("pointerup", onPointerUp, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("pointerup", onPointerUp, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [announceSafely, screenReaderMode, translateUiText]);

  useEffect(() => {
    if (!screenReaderMode) return;
    const activeRoute = [...routeVoiceTargets].sort((left: DynamicStateObject, right: DynamicStateObject) => right.path.length - left.path.length).find((item: DynamicStateObject) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));
    const routeLabel = activeRoute?.translatedLabel || getPublicRouteLabel(location.pathname, t);
    if (!routeLabel) return;
    suppressFocusUntilRef.current = Date.now() + 900;
    announceSafely(routeLabel, true, true);
  }, [announceSafely, location.pathname, routeVoiceTargets, screenReaderMode, t]);

  return (
    <>
      <a className="skip-link" href="#page-root">{(SKIP_LINK_LABELS as DynamicStateObject)[language] ?? SKIP_LINK_LABELS.en}</a>
      <div id="page-root" data-page-content="true">{children}</div>
      <AccessibilityToolbar
        voiceCommandSupported={voiceCommandSupported}
        voiceCommandListening={voiceCommandListening}
        voicePermissionDenied={voicePermissionDenied}
        onStartVoiceCommand={startVoiceCommands}
        onStopVoiceCommand={stopVoiceCommands}
      />
    </>
  );
}

export interface AccessibilityFrameProps {
  children?: ReactNode;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AccessibilityFrame({ children }: AccessibilityFrameProps) {
  return (
    <AccessibilityProvider>
      <AccessibilityFrameContent>{children}</AccessibilityFrameContent>
    </AccessibilityProvider>
  );
}
