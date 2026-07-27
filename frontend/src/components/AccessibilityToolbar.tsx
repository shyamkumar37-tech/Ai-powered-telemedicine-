import { DynamicState, DynamicStateObject } from "./../types/DynamicState";
import { useEffect, useMemo, useState, ReactNode } from "react";
import { useAccessibility } from "../context/AccessibilityContext";
import { LANGUAGE_CONTEXT_FALLBACK, useLanguage } from "../context/LanguageContext";

const TOOLBAR_OPEN_STORAGE_KEY = "telecareplus-accessibility-toolbar-open-v2";

const labels = {
  en: {
    accessibility: "Accessibility",
    accessibilityTools: "Accessibility tools",
    screenReader: "Screen reader",
    largeText: "Large text",
    highContrast: "High contrast",
    readPage: "Read page",
    stop: "Stop",
    voiceCommand: "Voice commands",
    stopVoiceCommand: "Stop voice",
    openAccessibility: "Open accessibility tools",
    closeAccessibility: "Close accessibility tools",
    keyboardHelp: "Shortcuts: Alt+Shift+A screen reader, Alt+Shift+R read page, Alt+Shift+S stop, Alt+Shift+V voice commands.",
    voiceListening: "Voice commands are listening.",
    voicePermissionDenied: "Microphone permission is blocked for voice commands in this browser.",
    speechUnavailable: "Speech playback is not available in this browser.",
    voiceUnavailable: "Voice commands are not available in this browser.",
    screenReaderHint: "Turn on Screen reader to hear buttons, fields, and links in the selected language.",
    screenReaderEnabled: "Screen reader is now active.",
    screenReaderDisabled: "Screen reader is now off.",
    pageReadingStarted: "Reading the current page aloud.",
    closePanel: "Close panel",
    resetAccessibility: "Reset accessibility",
    accessibilityReset: "Accessibility settings reset."
  },
  hi: {
    accessibility: "\u0938\u0941\u0917\u092e\u094d\u092f\u0924\u093e",
    accessibilityTools: "\u0938\u0941\u0917\u092e\u094d\u092f\u0924\u093e \u0909\u092a\u0915\u0930\u0923",
    screenReader: "\u0938\u094d\u0915\u094d\u0930\u0940\u0928 \u0930\u0940\u0921\u0930",
    largeText: "\u092c\u0921\u093c\u093e \u0905\u0915\u094d\u0937\u0930",
    highContrast: "\u0909\u091a\u094d\u091a \u0915\u0949\u0928\u094d\u091f\u094d\u0930\u093e\u0938\u094d\u091f",
    readPage: "\u092a\u0947\u091c \u092a\u0922\u093c\u0947\u0902",
    stop: "\u0930\u094b\u0915\u0947\u0902",
    voiceCommand: "\u0935\u0949\u0907\u0938 \u0915\u092e\u093e\u0902\u0921",
    stopVoiceCommand: "\u0935\u0949\u0907\u0938 \u0930\u094b\u0915\u0947\u0902",
    openAccessibility: "\u0938\u0941\u0917\u092e\u094d\u092f\u0924\u093e \u0909\u092a\u0915\u0930\u0923 \u0916\u094b\u0932\u0947\u0902",
    closeAccessibility: "\u0938\u0941\u0917\u092e\u094d\u092f\u0924\u093e \u0909\u092a\u0915\u0930\u0923 \u092c\u0902\u0926 \u0915\u0930\u0947\u0902",
    keyboardHelp: "\u0936\u0949\u0930\u094d\u091f\u0915\u091f: Alt+Shift+A \u0938\u094d\u0915\u094d\u0930\u0940\u0928 \u0930\u0940\u0921\u0930, Alt+Shift+R \u092a\u0947\u091c \u092a\u0922\u093c\u0947\u0902, Alt+Shift+S \u0930\u094b\u0915\u0947\u0902, Alt+Shift+V \u0935\u0949\u0907\u0938 \u0915\u092e\u093e\u0902\u0921.",
    voiceListening: "\u0935\u0949\u0907\u0938 \u0915\u092e\u093e\u0902\u0921 \u0938\u0941\u0928 \u0930\u0939\u0940 \u0939\u0948.",
    voicePermissionDenied: "\u0907\u0938 \u092c\u094d\u0930\u093e\u0909\u091c\u093c\u0930 \u092e\u0947\u0902 \u0935\u0949\u0907\u0938 \u0915\u092e\u093e\u0902\u0921 \u0915\u0947 \u0932\u093f\u090f \u092e\u093e\u0907\u0915\u094d\u0930\u094b\u092b\u094b\u0928 \u0905\u0928\u0941\u092e\u0924\u093f \u0930\u094b\u0915 \u0926\u0940 \u0917\u0908 \u0939\u0948\u0964",
    speechUnavailable: "\u0907\u0938 \u092c\u094d\u0930\u093e\u0909\u091c\u093c\u0930 \u092e\u0947\u0902 \u0906\u0935\u093e\u091c\u093c \u092a\u094d\u0932\u0947\u092c\u0948\u0915 \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
    voiceUnavailable: "\u0907\u0938 \u092c\u094d\u0930\u093e\u0909\u091c\u093c\u0930 \u092e\u0947\u0902 \u0935\u0949\u0907\u0938 \u0915\u092e\u093e\u0902\u0921 \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u0940\u0902 \u0939\u0948\u0964",
    screenReaderHint: "\u091a\u092f\u0928\u093f\u0924 \u092d\u093e\u0937\u093e \u092e\u0947\u0902 \u092c\u091f\u0928, \u092b\u0940\u0932\u094d\u0921 \u0914\u0930 \u0932\u093f\u0902\u0915 \u0938\u0941\u0928\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f \u0938\u094d\u0915\u094d\u0930\u0940\u0928 \u0930\u0940\u0921\u0930 \u091a\u093e\u0932\u0942 \u0915\u0930\u0947\u0902\u0964",
    screenReaderEnabled: "\u0938\u094d\u0915\u094d\u0930\u0940\u0928 \u0930\u0940\u0921\u0930 \u0905\u092c \u0938\u0915\u094d\u0930\u093f\u092f \u0939\u0948\u0964",
    screenReaderDisabled: "\u0938\u094d\u0915\u094d\u0930\u0940\u0928 \u0930\u0940\u0921\u0930 \u0905\u092c \u092c\u0902\u0926 \u0939\u0948\u0964",
    pageReadingStarted: "\u0935\u0930\u094d\u0924\u092e\u093e\u0928 \u092a\u0947\u091c \u092a\u0922\u093c\u0928\u093e \u0936\u0941\u0930\u0942 \u0915\u093f\u092f\u093e \u0917\u092f\u093e \u0939\u0948\u0964",
    closePanel: "Close panel",
    resetAccessibility: "Reset accessibility",
    accessibilityReset: "Accessibility settings reset."
  },
  ml: {
    accessibility: "\u0d2a\u0d4d\u0d30\u0d35\u0d47\u0d36\u0d28\u0d38\u0d57\u0d15\u0d30\u0d4d\u0d2f\u0d02",
    accessibilityTools: "\u0d2a\u0d4d\u0d30\u0d35\u0d47\u0d36\u0d28\u0d38\u0d57\u0d15\u0d30\u0d4d\u0d2f \u0d09\u0d2a\u0d15\u0d30\u0d23\u0d19\u0d4d\u0d19\u0d7e",
    screenReader: "\u0d38\u0d4d\u0d15\u0d4d\u0d30\u0d40\u0d7b \u0d31\u0d40\u0d21\u0d7c",
    largeText: "\u0d35\u0d32\u0d3f\u0d2f \u0d05\u0d15\u0d4d\u0d37\u0d30\u0d02",
    highContrast: "\u0d09\u0d2f\u0d7c\u0d28\u0d4d\u0d28 \u0d15\u0d4b\u0d7a\u0d1f\u0d4d\u0d30\u0d3e\u0d38\u0d4d\u0d31\u0d4d\u0d31\u0d4d",
    readPage: "\u0d2a\u0d47\u0d1c\u0d4d \u0d35\u0d3e\u0d2f\u0d3f\u0d15\u0d4d\u0d15\u0d41\u0d15",
    stop: "\u0d28\u0d3f\u0d7c\u0d24\u0d4d\u0d24\u0d41\u0d15",
    voiceCommand: "\u0d36\u0d2c\u0d4d\u0d26 \u0d15\u0d2e\u0d3e\u0d7b\u0d21\u0d41\u0d15\u0d7e",
    stopVoiceCommand: "\u0d36\u0d2c\u0d4d\u0d26\u0d02 \u0d28\u0d3f\u0d7c\u0d24\u0d4d\u0d24\u0d41\u0d15",
    openAccessibility: "\u0d2a\u0d4d\u0d30\u0d35\u0d47\u0d36\u0d28\u0d38\u0d57\u0d15\u0d30\u0d4d\u0d2f \u0d09\u0d2a\u0d15\u0d30\u0d23\u0d19\u0d4d\u0d19\u0d7e \u0d24\u0d41\u0d31\u0d15\u0d4d\u0d15\u0d41\u0d15",
    closeAccessibility: "\u0d2a\u0d4d\u0d30\u0d35\u0d47\u0d36\u0d28\u0d38\u0d57\u0d15\u0d30\u0d4d\u0d2f \u0d09\u0d2a\u0d15\u0d30\u0d23\u0d19\u0d4d\u0d19\u0d7e \u0d05\u0d1f\u0d2f\u0d4d\u0d15\u0d4d\u0d15\u0d41\u0d15",
    keyboardHelp: "\u0d36\u0d4b\u0d7c\u0d1f\u0d4d\u0d1f\u0d4d\u0d15\u0d1f\u0d4d\u0d1f\u0d4d: Alt+Shift+A \u0d38\u0d4d\u0d15\u0d4d\u0d30\u0d40\u0d7b \u0d31\u0d40\u0d21\u0d7c, Alt+Shift+R \u0d2a\u0d47\u0d1c\u0d4d \u0d35\u0d3e\u0d2f\u0d3f\u0d15\u0d4d\u0d15\u0d41\u0d15, Alt+Shift+S \u0d28\u0d3f\u0d7c\u0d24\u0d4d\u0d24\u0d41\u0d15, Alt+Shift+V \u0d36\u0d2c\u0d4d\u0d26 \u0d15\u0d2e\u0d3e\u0d7b\u0d21\u0d41\u0d15\u0d7e.",
    voiceListening: "\u0d36\u0d2c\u0d4d\u0d26 \u0d15\u0d2e\u0d3e\u0d7b\u0d21\u0d41\u0d15\u0d7e \u0d15\u0d47\u0d7e\u0d15\u0d4d\u0d15\u0d41\u0d28\u0d4d\u0d28\u0d41.",
    voicePermissionDenied: "\u0d08 \u0d2c\u0d4d\u0d30\u0d57\u0d38\u0d31\u0d3f\u0d7d \u0d36\u0d2c\u0d4d\u0d26 \u0d15\u0d2e\u0d3e\u0d7b\u0d21\u0d41\u0d15\u0d7e\u0d15\u0d4d\u0d15\u0d3e\u0d2f\u0d3f \u0d2e\u0d48\u0d15\u0d4d\u0d30\u0d4b\u0d2b\u0d4b\u0d7a \u0d05\u0d28\u0d41\u0d2e\u0d24\u0d3f \u0d24\u0d1f\u0d1e\u0d4d\u0d1e\u0d3f\u0d1f\u0d4d\u0d1f\u0d41\u0d23\u0d4d\u0d1f\u0d4d.",
    speechUnavailable: "\u0d08 \u0d2c\u0d4d\u0d30\u0d57\u0d38\u0d31\u0d3f\u0d7d \u0d36\u0d2c\u0d4d\u0d26 \u0d2a\u0d4d\u0d32\u0d47\u0d2c\u0d3e\u0d15\u0d4d\u0d15\u0d4d \u0d32\u0d2d\u0d4d\u0d2f\u0d2e\u0d32\u0d4d\u0d32.",
    voiceUnavailable: "\u0d08 \u0d2c\u0d4d\u0d30\u0d57\u0d38\u0d31\u0d3f\u0d7d \u0d36\u0d2c\u0d4d\u0d26 \u0d15\u0d2e\u0d3e\u0d7b\u0d21\u0d41\u0d15\u0d7e \u0d32\u0d2d\u0d4d\u0d2f\u0d2e\u0d32\u0d4d\u0d32.",
    screenReaderHint: "\u0d24\u0d3f\u0d30\u0d1e\u0d4d\u0d1e\u0d46\u0d1f\u0d41\u0d24\u0d4d\u0d24 \u0d2d\u0d3e\u0d37\u0d2f\u0d3f\u0d7d \u0d2c\u0d1f\u0d4d\u0d1f\u0d23\u0d41\u0d15\u0d33\u0d41\u0d02 \u0d2b\u0d40\u0d32\u0d4d\u0d21\u0d41\u0d15\u0d33\u0d41\u0d02 \u0d32\u0d3f\u0d19\u0d4d\u0d15\u0d41\u0d15\u0d33\u0d41\u0d02 \u0d15\u0d47\u0d7e\u0d15\u0d4d\u0d15\u0d3e\u0d7b \u0d38\u0d4d\u0d15\u0d4d\u0d30\u0d40\u0d7b \u0d31\u0d40\u0d21\u0d7c \u0d13\u0d7a \u0d1a\u0d46\u0d2f\u0d4d\u0d2f\u0d41\u0d15.",
    screenReaderEnabled: "\u0d38\u0d4d\u0d15\u0d4d\u0d30\u0d40\u0d7b \u0d31\u0d40\u0d21\u0d7c \u0d07\u0d2a\u0d4d\u0d2a\u0d4b\u0d7e \u0d38\u0d1c\u0d40\u0d35\u0d2e\u0d3e\u0d23\u0d4d\u0d23\u0d4d.",
    screenReaderDisabled: "\u0d38\u0d4d\u0d15\u0d4d\u0d30\u0d40\u0d7b \u0d31\u0d40\u0d21\u0d7c \u0d07\u0d28\u0d3f \u0d14\u0d2b\u0d4d \u0d06\u0d23\u0d4d\u0d23\u0d4d.",
    pageReadingStarted: "\u0d08 \u0d2a\u0d47\u0d1c\u0d4d \u0d36\u0d2c\u0d4d\u0d26\u0d2e\u0d3e\u0d2f\u0d3f \u0d35\u0d3e\u0d2f\u0d3f\u0d15\u0d4d\u0d15\u0d3e\u0d7b \u0d24\u0d41\u0d1f\u0d19\u0d4d\u0d19\u0d3f.",
    closePanel: "Close panel",
    resetAccessibility: "Reset accessibility",
    accessibilityReset: "Accessibility settings reset."
  },
  te: {
    accessibility: "\u0c2a\u0c4d\u0c30\u0c35\u0c47\u0c36 \u0c38\u0c4c\u0c32\u0c2d\u0c4d\u0c2f\u0c02",
    accessibilityTools: "\u0c2a\u0c4d\u0c30\u0c35\u0c47\u0c36 \u0c38\u0c4c\u0c32\u0c2d\u0c4d\u0c2f \u0c38\u0c3e\u0c27\u0c28\u0c3e\u0c32\u0c41",
    screenReader: "\u0c38\u0c4d\u0c15\u0c4d\u0c30\u0c40\u0c28\u0c4d \u0c30\u0c40\u0c21\u0c30\u0c4d",
    largeText: "\u0c2a\u0c46\u0c26\u0c4d\u0c26 \u0c05\u0c15\u0c4d\u0c37\u0c30\u0c3e\u0c32\u0c41",
    highContrast: "\u0c05\u0c27\u0c3f\u0c15 \u0c15\u0c3e\u0c02\u0c1f\u0c4d\u0c30\u0c3e\u0c38\u0c4d\u0c1f\u0c4d",
    readPage: "\u0c2a\u0c47\u0c1c\u0c40 \u0c1a\u0c26\u0c35\u0c02\u0c21\u0c3f",
    stop: "\u0c06\u0c2a\u0c41",
    voiceCommand: "\u0c35\u0c3e\u0c2f\u0c3f\u0c38\u0c4d \u0c15\u0c2e\u0c3e\u0c02\u0c21\u0c4d\u0c32\u0c41",
    stopVoiceCommand: "\u0c35\u0c3e\u0c2f\u0c3f\u0c38\u0c4d \u0c06\u0c2a\u0c41",
    openAccessibility: "\u0c2a\u0c4d\u0c30\u0c35\u0c47\u0c36 \u0c38\u0c4c\u0c32\u0c2d\u0c4d\u0c2f \u0c38\u0c3e\u0c27\u0c28\u0c3e\u0c32\u0c41 \u0c24\u0c46\u0c30\u0c35\u0c02\u0c21\u0c3f",
    closeAccessibility: "\u0c2a\u0c4d\u0c30\u0c35\u0c47\u0c36 \u0c38\u0c4c\u0c32\u0c2d\u0c4d\u0c2f \u0c38\u0c3e\u0c27\u0c28\u0c3e\u0c32\u0c41 \u0c2e\u0c42\u0c38\u0c3f\u0c35\u0c47\u0c2f\u0c02\u0c21\u0c3f",
    keyboardHelp: "\u0c37\u0c3e\u0c30\u0c4d\u0c1f\u0c4d\u200c\u0c15\u0c1f\u0c4d\u0c32\u0c41: Alt+Shift+A \u0c38\u0c4d\u0c15\u0c4d\u0c30\u0c40\u0c28\u0c4d \u0c30\u0c40\u0c21\u0c30\u0c4d, Alt+Shift+R \u0c2a\u0c47\u0c1c\u0c40 \u0c1a\u0c26\u0c35\u0c02\u0c21\u0c3f, Alt+Shift+S \u0c06\u0c2a\u0c41, Alt+Shift+V \u0c35\u0c3e\u0c2f\u0c3f\u0c38\u0c4d \u0c15\u0c2e\u0c3e\u0c02\u0c21\u0c4d\u0c32\u0c41.",
    voiceListening: "\u0c35\u0c3e\u0c2f\u0c3f\u0c38\u0c4d \u0c15\u0c2e\u0c3e\u0c02\u0c21\u0c4d\u0c32\u0c41 \u0c35\u0c3f\u0c28\u0c2c\u0c21\u0c41\u0c24\u0c41\u0c28\u0c4d\u0c28\u0c3e\u0c2f\u0c3f.",
    voicePermissionDenied: "\u0c08 \u0c2c\u0c4d\u0c30\u0c4c\u0c1c\u0c30\u0c4d\u200c\u0c32\u0c4b \u0c35\u0c3e\u0c2f\u0c3f\u0c38\u0c4d \u0c15\u0c2e\u0c3e\u0c02\u0c21\u0c4d\u0c32\u0c15\u0c4b\u0c38\u0c02 \u0c2e\u0c48\u0c15\u0c4d\u0c30\u0c4b\u0c2b\u0c4b\u0c28\u0c4d \u0c05\u0c28\u0c41\u0c2e\u0c24\u0c3f \u0c28\u0c3f\u0cb0\u0c3e\u0c15\u0cb0\u0c3f\u0c02\u0c1a\u0c2c\u0c21\u0c3f\u0c02\u0c26\u0c3f.",
    speechUnavailable: "\u0c08 \u0c2c\u0c4d\u0c30\u0c4c\u0c1c\u0c30\u0c4d\u200c\u0c32\u0c4b \u0c36\u0c2c\u0c4d\u0c26 \u0c2a\u0c4d\u0c32\u0c47\u0c2c\u0c4d\u0c2f\u0c3e\u0c15\u0c4d \u0c05\u0c82\u0c26\u0c41\u0c2c\u0c3e\u0c1f\u0c41\u0c32\u0c4b \u0c32\u0c47\u0c26\u0c41.",
    voiceUnavailable: "\u0c08 \u0c2c\u0c4d\u0c30\u0c4c\u0c1c\u0c30\u0c4d\u200c\u0c32\u0c4b \u0c35\u0c3e\u0c2f\u0c3f\u0c38\u0c4d \u0c15\u0c2e\u0c3e\u0c02\u0c21\u0c4d\u0c32\u0c41 \u0c05\u0c82\u0c26\u0c41\u0c2c\u0c3e\u0c1f\u0c41\u0c32\u0c4b \u0c32\u0c47\u0c35\u0c41.",
    screenReaderHint: "\u0c0e\u0c02\u0c2a\u0c3f\u0c15 \u0c1a\u0c47\u0c38\u0c3f\u0c28 \u0c2d\u0c3e\u0c37\u0c32\u0c4b \u0c2c\u0c1f\u0c28\u0c4d\u0c32\u0c41, \u0c2b\u0c40\u0c32\u0c4d\u0c21\u0c4d\u0c32\u0c41, \u0c32\u0c3f\u0c02\u0c15\u0c4d\u0c32\u0c28\u0c41 \u0c35\u0c3f\u0c28\u0c21\u0c3e\u0c28\u0c3f\u0c15\u0c3f \u0c38\u0c4d\u0c15\u0c4d\u0c30\u0c40\u0c28\u0c4d \u0c30\u0c40\u0c21\u0c30\u0c4d\u0c28\u0c3f \u0c06\u0c28\u0c4d \u0c1a\u0c47\u0c2f\u0c02\u0c21\u0c3f.",
    screenReaderEnabled: "\u0c38\u0c4d\u0c15\u0c4d\u0c30\u0c40\u0c28\u0c4d \u0c30\u0c40\u0c21\u0c30\u0c4d \u0c07\u0c2a\u0c4d\u0c2a\u0c41\u0c21\u0c41 \u0c1a\u0c41\u0c30\u0c41\u0c15\u0c41\u0c17\u0c3e \u0c09\u0c28\u0c4d\u0c28\u0c26\u0c3f.",
    screenReaderDisabled: "\u0c38\u0c4d\u0c15\u0c4d\u0c30\u0c40\u0c28\u0c4d \u0c30\u0c40\u0c21\u0c30\u0c4d \u0c07\u0c2a\u0c4d\u0c2a\u0c41\u0c21\u0c41 \u0c06\u0c2b\u0c4d-\u0c32\u0c4b \u0c09\u0c28\u0c4d\u0c28\u0c26\u0c3f.",
    pageReadingStarted: "\u0c2a\u0c4d\u0c30\u0c38\u0c4d\u0c24\u0c41\u0c24 \u0c2a\u0c47\u0c1c\u0c40\u0c28\u0c3f \u0c1a\u0c26\u0c35\u0c21\u0c02 \u0c2a\u0c4d\u0c30\u0c3e\u0c30\u0c02\u0c2d\u0c3f\u0c02\u0c1a\u0c3e\u0c2e\u0c41.",
    closePanel: "Close panel",
    resetAccessibility: "Reset accessibility",
    accessibilityReset: "Accessibility settings reset."
  },
  pa: {
    accessibility: "\u0a2a\u0a39\u0a41\u0a70\u0a1a\u0a2f\u0a4b\u0a17\u0a24\u0a3e",
    accessibilityTools: "\u0a2a\u0a39\u0a41\u0a70\u0a1a\u0a2f\u0a4b\u0a17\u0a24\u0a3e \u0a38\u0a3e\u0a27\u0a28",
    screenReader: "\u0a38\u0a15\u0a4d\u0a30\u0a40\u0a28 \u0a30\u0a40\u0a21\u0a30",
    largeText: "\u0a35\u0a71\u0a21\u0a3e \u0a32\u0a3f\u0a16\u0a24",
    highContrast: "\u0a09\u0a71\u0a1a \u0a15\u0a3e\u0a02\u0a1f\u0a30\u0a3e\u0a38\u0a1f",
    readPage: "\u0a2a\u0a70\u0a28\u0a3e \u0a2a\u0a5c\u0a4d\u0a39\u0a4b",
    stop: "\u0a30\u0a4b\u0a15\u0a4b",
    voiceCommand: "\u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a15\u0a2e\u0a3e\u0a02\u0a21\u0a3e\u0a02",
    stopVoiceCommand: "\u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a30\u0a4b\u0a15\u0a4b",
    openAccessibility: "\u0a2a\u0a39\u0a41\u0a70\u0a1a\u0a2f\u0a4b\u0a17\u0a24\u0a3e \u0a38\u0a3e\u0a27\u0a28 \u0a16\u0a4b\u0a32\u0a4d\u0a39\u0a4b",
    closeAccessibility: "\u0a2a\u0a39\u0a41\u0a70\u0a1a\u0a2f\u0a4b\u0a17\u0a24\u0a3e \u0a38\u0a3e\u0a27\u0a28 \u0a2c\u0a70\u0a26 \u0a15\u0a30\u0a4b",
    keyboardHelp: "\u0a38\u0a3c\u0a3e\u0a30\u0a1f\u0a15\u0a1f: Alt+Shift+A \u0a38\u0a15\u0a4d\u0a30\u0a40\u0a28 \u0a30\u0a40\u0a21\u0a30, Alt+Shift+R \u0a2a\u0a70\u0a28\u0a3e \u0a2a\u0a5c\u0a4d\u0a39\u0a4b, Alt+Shift+S \u0a30\u0a4b\u0a15\u0a4b, Alt+Shift+V \u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a15\u0a2e\u0a3e\u0a02\u0a21\u0a3e\u0a02.",
    voiceListening: "\u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a15\u0a2e\u0a3e\u0a02\u0a21\u0a3e\u0a02 \u0a38\u0a41\u0a23 \u0a30\u0a39\u0a40\u0a06\u0a02 \u0a39\u0a28.",
    voicePermissionDenied: "\u0a07\u0a38 \u0a2c\u0a30\u0a3e\u0a0a\u0a1c\u0a3c\u0a30 \u0a35\u0a3f\u0a71\u0a1a \u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a15\u0a2e\u0a3e\u0a02\u0a21\u0a3e\u0a02 \u0a32\u0a08 \u0a2e\u0a3e\u0a08\u0a15\u0a4d\u0a30\u0a4b\u0a2b\u0a4b\u0a28 \u0a05\u0a28\u0a41\u0a2e\u0a24\u0a3f \u0a30\u0a4b\u0a15 \u0a26\u0a3f\u0a71\u0a24\u0a40 \u0a17\u0a08 \u0a39\u0a48\u0964",
    speechUnavailable: "\u0a07\u0a38 \u0a2c\u0a30\u0a3e\u0a0a\u0a1c\u0a3c\u0a30 \u0a35\u0a3f\u0a71\u0a1a \u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a2a\u0a4d\u0a32\u0a47\u0a2c\u0a48\u0a15 \u0a09\u0a2a\u0a32\u0a2c\u0a27 \u0a28\u0a39\u0a40\u0a02 \u0a39\u0a48\u0964",
    voiceUnavailable: "\u0a07\u0a38 \u0a2c\u0a30\u0a3e\u0a0a\u0a1c\u0a3c\u0a30 \u0a35\u0a3f\u0a71\u0a1a \u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a15\u0a2e\u0a3e\u0a02\u0a21 \u0a09\u0a2a\u0a32\u0a2c\u0a27 \u0a28\u0a39\u0a40\u0a02 \u0a39\u0a48\u0964",
    screenReaderHint: "\u0a1a\u0a41\u0a23\u0a40 \u0a39\u0a4b\u0a08 \u0a2d\u0a3e\u0a36\u0a3e \u0a35\u0a3f\u0a71\u0a1a \u0a2c\u0a1f\u0a28, \u0a2b\u0a40\u0a32\u0a4d\u0a21 \u0a05\u0a24\u0a47 \u0a32\u0a3f\u0a70\u0a15 \u0a38\u0a41\u0a23\u0a28 \u0a32\u0a08 \u0a38\u0a15\u0a4d\u0a30\u0a40\u0a28 \u0a30\u0a40\u0a21\u0a30 \u0a1a\u0a3e\u0a32\u0a42 \u0a15\u0a30\u0a4b\u0964",
    screenReaderEnabled: "\u0a38\u0a15\u0a4d\u0a30\u0a40\u0a28 \u0a30\u0a40\u0a21\u0a30 \u0a39\u0a41\u0a23 \u0a38\u0a30\u0a17\u0a30\u0a2e \u0a39\u0a48\u0964",
    screenReaderDisabled: "\u0a38\u0a15\u0a4d\u0a30\u0a40\u0a28 \u0a30\u0a40\u0a21\u0a30 \u0a39\u0a41\u0a23 \u0a2c\u0a70\u0a26 \u0a39\u0a48\u0964",
    pageReadingStarted: "\u0a2e\u0a4c\u0a1c\u0a42\u0a26\u0a3e \u0a2a\u0a70\u0a28\u0a3e \u0a09\u0a71\u0a1a\u0a40 \u0a06\u0a35\u0a3e\u0a1c\u0a3c \u0a35\u0a3f\u0a71\u0a1a \u0a2a\u0a5c\u0a4d\u0a39\u0a3f\u0a06 \u0a1c\u0a3e \u0a30\u0a3f\u0a39\u0a3e \u0a39\u0a48\u0964",
    closePanel: "Close panel",
    resetAccessibility: "Reset accessibility",
    accessibilityReset: "Accessibility settings reset."
  },
  ta: {
    accessibility: "\u0b85\u0ba3\u0bc1\u0b95\u0bb2\u0bcd",
    accessibilityTools: "\u0b85\u0ba3\u0bc1\u0b95\u0bb2\u0bcd \u0b95\u0bb0\u0bc1\u0bb5\u0bbf\u0b95\u0bb3\u0bcd",
    screenReader: "\u0ba4\u0bbf\u0bb0\u0bc8 \u0bb5\u0bbe\u0b9a\u0bbf\u0baa\u0bcd\u0baa\u0bc1",
    largeText: "\u0baa\u0bc6\u0bb0\u0bbf\u0baf \u0b8e\u0bb4\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1",
    highContrast: "\u0b89\u0baf\u0bb0\u0bcd \u0bae\u0bbe\u0bb1\u0bc1\u0baa\u0bbe\u0b9f\u0bc1",
    readPage: "\u0baa\u0b95\u0bcd\u0b95\u0bae\u0bcd \u0bb5\u0bbe\u0b9a\u0bbf",
    stop: "\u0ba8\u0bbf\u0bb1\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1",
    voiceCommand: "\u0b95\u0bc1\u0bb0\u0bb2\u0bcd \u0b95\u0b9f\u0bcd\u0b9f\u0bb3\u0bc8\u0b95\u0bb3\u0bcd",
    stopVoiceCommand: "\u0b95\u0bc1\u0bb0\u0bb2\u0bc8 \u0ba8\u0bbf\u0bb1\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1",
    openAccessibility: "\u0b85\u0ba3\u0bc1\u0b95\u0bb2\u0bcd \u0b95\u0bb0\u0bc1\u0bb5\u0bbf\u0b95\u0bb3\u0bc8\u0ba4\u0bcd \u0ba4\u0bbf\u0bb1",
    closeAccessibility: "\u0b85\u0ba3\u0bc1\u0b95\u0bb2\u0bcd \u0b95\u0bb0\u0bc1\u0bb5\u0bbf\u0b95\u0bb3\u0bc8 \u0bae\u0bc2\u0b9f\u0bc1",
    keyboardHelp: "\u0b9a\u0bc1\u0bb0\u0bc1\u0b95\u0bcd\u0b95 \u0bb5\u0bbf\u0b9a\u0bc8\u0b95\u0bb3\u0bcd: Alt+Shift+A \u0ba4\u0bbf\u0bb0\u0bc8 \u0bb5\u0bbe\u0b9a\u0bbf\u0baa\u0bcd\u0baa\u0bc1, Alt+Shift+R \u0baa\u0b95\u0bcd\u0b95\u0bae\u0bcd \u0bb5\u0bbe\u0b9a\u0bbf, Alt+Shift+S \u0ba8\u0bbf\u0bb1\u0bc1\u0ba4\u0bcd\u0ba4\u0bc1, Alt+Shift+V \u0b95\u0bc1\u0bb0\u0bb2\u0bcd \u0b95\u0b9f\u0bcd\u0b9f\u0bb3\u0bc8\u0b95\u0bb3\u0bcd.",
    voiceListening: "\u0b95\u0bc1\u0bb0\u0bb2\u0bcd \u0b95\u0b9f\u0bcd\u0b9f\u0bb3\u0bc8\u0b95\u0bb3\u0bcd \u0b95\u0bc7\u0b9f\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bc1\u0b95\u0bbf\u0ba9\u0bcd\u0bb1\u0ba9.",
    voicePermissionDenied: "\u0b87\u0ba8\u0bcd\u0ba4 \u0b89\u0bb2\u0bbe\u0bb5\u0bbf\u0baf\u0bbf\u0bb2\u0bcd \u0b95\u0bc1\u0bb0\u0bb2\u0bcd \u0b95\u0b9f\u0bcd\u0b9f\u0bb3\u0bc8\u0b95\u0bb3\u0bc1\u0b95\u0bcd\u0b95\u0bbe\u0ba9 \u0bae\u0bc8\u0b95\u0bcd\u0bb0\u0bcb\u0b83\u0baa\u0bcb\u0ba9\u0bcd \u0b85\u0ba9\u0bc1\u0bae\u0ba4\u0bbf \u0ba4\u0b9f\u0bc1\u0b95\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0bc1\u0bb3\u0bcd\u0bb3\u0ba4\u0bc1.",
    speechUnavailable: "\u0b87\u0ba8\u0bcd\u0ba4 \u0b89\u0bb2\u0bbe\u0bb5\u0bbf\u0baf\u0bbf\u0bb2\u0bcd \u0b95\u0bc1\u0bb0\u0bb2\u0bcd \u0b92\u0bb2\u0bbf\u0baa\u0bb0\u0baa\u0bcd\u0baa\u0bc1 \u0b95\u0bbf\u0b9f\u0bc8\u0b95\u0bcd\u0b95\u0bb5\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8.",
    voiceUnavailable: "\u0b87\u0ba8\u0bcd\u0ba4 \u0b89\u0bb2\u0bbe\u0bb5\u0bbf\u0baf\u0bbf\u0bb2\u0bcd \u0b95\u0bc1\u0bb0\u0bb2\u0bcd \u0b95\u0b9f\u0bcd\u0b9f\u0bb3\u0bc8\u0b95\u0bb3\u0bcd \u0b95\u0bbf\u0b9f\u0bc8\u0b95\u0bcd\u0b95\u0bb5\u0bbf\u0bb2\u0bcd\u0bb2\u0bc8.",
    screenReaderHint: "\u0ba4\u0bc7\u0bb0\u0bcd\u0bb5\u0bc1 \u0b9a\u0bc6\u0baf\u0bcd\u0ba4 \u0bae\u0bca\u0bb4\u0bbf\u0baf\u0bbf\u0bb2\u0bcd \u0baa\u0bca\u0ba4\u0bcd\u0ba4\u0bbe\u0ba9\u0bcd\u0b95\u0bb3\u0bcd, \u0baa\u0bc1\u0bb2\u0ba9\u0bcd\u0b95\u0bb3\u0bcd, \u0b87\u0ba3\u0bc8\u0baa\u0bcd\u0baa\u0bc1\u0b95\u0bb3\u0bc8 \u0b95\u0bc7\u0b9f\u0bcd\u0b95 \u0ba4\u0bbf\u0bb0\u0bc8 \u0bb5\u0bbe\u0b9a\u0bbf\u0baa\u0bcd\u0baa\u0bc1\u0bae\u0bcd \u0b87\u0baf\u0b95\u0bcd\u0b95\u0bb5\u0bc1\u0bae\u0bcd.",
    screenReaderEnabled: "\u0ba4\u0bbf\u0bb0\u0bc8 \u0bb5\u0bbe\u0b9a\u0bbf\u0baa\u0bcd\u0baa\u0bc1 \u0b87\u0baa\u0bcd\u0baa\u0bcb\u0ba4\u0bc1 \u0b9a\u0bc6\u0baf\u0bb2\u0bcd\u0baa\u0b9f\u0bc1\u0ba4\u0bcd\u0ba4\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0ba4\u0bc1.",
    screenReaderDisabled: "\u0ba4\u0bbf\u0bb0\u0bc8 \u0bb5\u0bbe\u0b9a\u0bbf\u0baa\u0bcd\u0baa\u0bc1 \u0b87\u0baa\u0bcd\u0baa\u0bcb\u0ba4\u0bc1 \u0ba8\u0bbf\u0bb1\u0bc1\u0ba4\u0bcd\u0ba4\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0ba4\u0bc1.",
    pageReadingStarted: "\u0ba4\u0bb1\u0bcd\u0baa\u0bcb\u0ba4\u0bc8\u0baf \u0baa\u0b95\u0bcd\u0b95\u0bae\u0bcd \u0bb5\u0bbe\u0b9a\u0bbf\u0b95\u0bcd\u0b95 \u0ba4\u0bca\u0b9f\u0b99\u0bcd\u0b95\u0baa\u0bcd\u0baa\u0b9f\u0bcd\u0b9f\u0ba4\u0bc1.",
    closePanel: "Close panel"
  }
};

function readInitialToolbarState() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    if (typeof window.sessionStorage !== "undefined") {
      const stored = window.sessionStorage.getItem(TOOLBAR_OPEN_STORAGE_KEY);
      if (stored !== null) {
        return stored === "true";
      }
    }

    if (typeof window.localStorage !== "undefined") {
      const stored = window.localStorage.getItem(TOOLBAR_OPEN_STORAGE_KEY);
      if (stored !== null) {
        try {
          window.sessionStorage?.setItem(TOOLBAR_OPEN_STORAGE_KEY, stored);
          window.localStorage.removeItem(TOOLBAR_OPEN_STORAGE_KEY);
        } catch {
          // Ignore storage migration failures.
        }
        return stored === "true";
      }
    }

    return false;
  } catch {
    return false;
  }
}

export interface ToolbarButtonProps {
  active?: DynamicState;
  onClick?: (...args: DynamicStateObject[]) => void;
  children?: ReactNode;
  ariaLabel?: DynamicState;
  disabled?: DynamicState;
    [key: string]: ReturnType<typeof JSON.parse>;
}

function ToolbarButton({ active = false, onClick, children, ariaLabel, disabled = false }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      data-voice-label={ariaLabel}
      aria-pressed={active}
      disabled={disabled}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
        active
          ? "bg-clinic text-white"
          : "border border-slate-200 bg-white text-slate-700 hover:border-clinic hover:text-clinic"
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {children}
    </button>
  );
}

export interface AccessibilityToolbarProps {
  voiceCommandSupported?: DynamicState;
  voiceCommandListening?: DynamicState;
  voicePermissionDenied?: DynamicState;
  onStartVoiceCommand?: (...args: DynamicStateObject[]) => void;
  onStopVoiceCommand?: (...args: DynamicStateObject[]) => void;
    [key: string]: ReturnType<typeof JSON.parse>;
}

export default function AccessibilityToolbar({
  voiceCommandSupported = false,
  voiceCommandListening = false,
  voicePermissionDenied = false,
  onStartVoiceCommand,
  onStopVoiceCommand
}: AccessibilityToolbarProps) {
  const { language } = useLanguage() ?? LANGUAGE_CONTEXT_FALLBACK;
  const {
    largeText,
    highContrast,
    screenReaderMode,
    speechSupported,
    speak,
    toggleLargeText,
    toggleHighContrast,
    toggleScreenReaderMode,
    resetAccessibility,
    readCurrentPage,
    stopReading
  } = useAccessibility();
  const [open, setOpen] = useState<DynamicState>(readInitialToolbarState);
  const [statusMessage, setStatusMessage] = useState<DynamicState>("");

  const text = useMemo(() => (labels as DynamicStateObject)[language] ?? labels.en, [language]);
  const statusCopy = {
    screenReaderEnabled: text.screenReaderEnabled || labels.en.screenReaderEnabled,
    screenReaderDisabled: text.screenReaderDisabled || labels.en.screenReaderDisabled,
    pageReadingStarted: text.pageReadingStarted || labels.en.pageReadingStarted,
    accessibilityReset: text.accessibilityReset || labels.en.accessibilityReset
  };
  const browserSpeechSupported = typeof window !== "undefined"
    && (Boolean(window.speechSynthesis) || "speechSynthesis" in window || "SpeechSynthesisUtterance" in window);
  const browserRecognitionSupported = typeof window !== "undefined"
    && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const speechPlaybackSupported = speechSupported || browserSpeechSupported;
  const voiceRecognitionSupported = voiceCommandSupported || browserRecognitionSupported;
  const canReadAloud = speechPlaybackSupported;
  const canUseVoiceCommands = voiceRecognitionSupported && !voicePermissionDenied;

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.sessionStorage === "undefined") {
      return;
    }

    try {
      window.sessionStorage.setItem(TOOLBAR_OPEN_STORAGE_KEY, String(open));
    } catch {
      // Ignore storage failures in restricted browsers.
    }
  }, [open]);

  useEffect(() => {
    if (!statusMessage) {
      return undefined;
    }

    const timer = window.setTimeout(() => setStatusMessage(""), 3000);
    return () => window.clearTimeout(timer);
  }, [statusMessage]);

  const handleScreenReaderToggle = () => {
    if (screenReaderMode) {
      speak(statusCopy.screenReaderDisabled, language, { force: true });
      stopReading();
      onStopVoiceCommand?.();
      toggleScreenReaderMode();
      setStatusMessage(statusCopy.screenReaderDisabled);
      return;
    }

    toggleScreenReaderMode();
    if (!speechPlaybackSupported) {
      setStatusMessage(text.speechUnavailable);
    } else {
      setStatusMessage(statusCopy.screenReaderEnabled);
    }
    speak(statusCopy.screenReaderEnabled, language, { force: true });
  };

  const handleReadPage = () => {
    if (!canReadAloud) {
      setStatusMessage(text.speechUnavailable);
      return;
    }

    setStatusMessage(statusCopy.pageReadingStarted);
    readCurrentPage(language);
  };

  return (
    <div className="accessibility-toolbar">
      <button
        type="button"
        className="accessibility-fab"
        onClick={() => setOpen((current: DynamicStateObject) => !current)}
        aria-label={open ? text.closeAccessibility : text.openAccessibility}
        data-voice-label={open ? text.closeAccessibility : text.openAccessibility}
        aria-expanded={open}
        aria-controls="telecare-accessibility-panel"
      >
        {text.accessibility}
      </button>
      {open ? (
        <div
          id="telecare-accessibility-panel"
          className="accessibility-panel glass-card p-4"
          role="region"
          aria-label={text.accessibilityTools}
        >
          <div className="accessibility-panel__header">
            <p className="text-sm font-semibold text-ink">{text.accessibilityTools}</p>
            <button
              type="button"
              className="accessibility-panel__close"
              onClick={() => setOpen(false)}
              aria-label={text.closePanel || labels.en.closePanel}
              data-voice-label={text.closePanel || labels.en.closePanel}
            >
              {text.closePanel || labels.en.closePanel}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <ToolbarButton active={screenReaderMode} onClick={handleScreenReaderToggle} ariaLabel={text.screenReader}>
              {text.screenReader}
            </ToolbarButton>
            <ToolbarButton active={largeText} onClick={toggleLargeText} ariaLabel={text.largeText}>
              {text.largeText}
            </ToolbarButton>
            <ToolbarButton active={highContrast} onClick={toggleHighContrast} ariaLabel={text.highContrast}>
              {text.highContrast}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                resetAccessibility();
                stopReading();
                onStopVoiceCommand?.();
                setStatusMessage(statusCopy.accessibilityReset);
              }}
              ariaLabel={text.resetAccessibility || labels.en.resetAccessibility}
            >
              {text.resetAccessibility || labels.en.resetAccessibility}
            </ToolbarButton>
            <ToolbarButton
              onClick={handleReadPage}
              ariaLabel={text.readPage}
              disabled={!canReadAloud}
            >
              {text.readPage}
            </ToolbarButton>
            <ToolbarButton
              onClick={() => {
                stopReading();
                onStopVoiceCommand?.();
                setOpen(false);
              }}
              ariaLabel={text.stop}
            >
              {text.stop}
            </ToolbarButton>
            <ToolbarButton
              active={voiceCommandListening}
              onClick={voiceCommandListening ? onStopVoiceCommand : onStartVoiceCommand}
              ariaLabel={voiceCommandListening ? text.stopVoiceCommand : text.voiceCommand}
              disabled={!canUseVoiceCommands}
            >
              {voiceCommandListening ? text.stopVoiceCommand : text.voiceCommand}
            </ToolbarButton>
          </div>
          <p className="mt-3 text-xs font-medium text-slate-600" role="status" aria-live="polite">{text.screenReaderHint}</p>
          {statusMessage ? (
            <p className="mt-2 text-xs font-medium text-clinic" role="status" aria-live="polite">{statusMessage}</p>
          ) : null}
          <p className="mt-3 text-xs text-slate-500">{text.keyboardHelp}</p>
          {!speechPlaybackSupported ? (
            <p className="mt-2 text-xs text-amber-700" role="status" aria-live="polite">{text.speechUnavailable}</p>
          ) : null}
          {!voiceRecognitionSupported ? (
            <p className="mt-2 text-xs text-amber-700" role="status" aria-live="polite">{text.voiceUnavailable}</p>
          ) : null}
          {voicePermissionDenied ? (
            <p className="mt-2 text-xs text-amber-700" role="alert">{text.voicePermissionDenied}</p>
          ) : null}
          {voiceCommandSupported && voiceCommandListening ? (
            <p className="mt-2 text-xs font-medium text-clinic" role="status" aria-live="polite">{text.voiceListening}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
