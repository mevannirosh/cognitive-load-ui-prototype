import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  extractFeatureVectorFromStats,
} from "../ml/featureExtractor";


function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}


function getTargetName(target) {
  if (!(target instanceof Element)) {
    return "unknown";
  }

  const tag =
    target.tagName.toLowerCase();

  const text = target.innerText
    ?.trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);

  const aria =
    target.getAttribute("aria-label");

  const id =
    target.getAttribute("id");

  if (aria) {
    return `${tag}:${aria}`;
  }

  if (id) {
    return `${tag}#${id}`;
  }

  if (text) {
    return `${tag}:${text}`;
  }

  return tag;
}


function createEmptyStats() {
  return {
    clickCount: 0,
    repeatedClickCount: 0,

    scrollCount: 0,
    scrollDistance: 0,
    scrollDirectionChanges: 0,

    lastScrollY:
      window.scrollY || 0,

    lastScrollDirection: null,

    mouseMoveCount: 0,
    pointerDistance: 0,
    pointerDurationMs: 0,
    lastMousePosition: null,

    keyPressCount: 0,
    navigationCount: 0,

    hesitations: [],

    lastMeaningfulActionTime:
      Date.now(),
  };
}


export default function useInteractionTracker({
  activePage,
  adaptiveMode,
  cognitiveLoad,
}) {
  const sessionIdRef =
    useRef(createId());

  const startTimeRef =
    useRef(Date.now());

  const activePageRef =
    useRef(activePage);

  const adaptiveModeRef =
    useRef(adaptiveMode);

  const cognitiveLoadRef =
    useRef(cognitiveLoad);

  const previousPageRef =
    useRef(activePage);

  const eventsRef =
    useRef([]);

  const snapshotsRef =
    useRef([]);

  const statsRef =
    useRef(createEmptyStats());

  const lastClickRef =
    useRef({
      targetName: null,
      timestamp: 0,
    });

  const lastMouseMoveHandledRef =
    useRef(0);

  const lastScrollHandledRef =
    useRef(0);

  const [recentEvents, setRecentEvents] =
    useState([]);

  const [metrics, setMetrics] =
    useState(null);


  useEffect(() => {
    activePageRef.current =
      activePage;

    adaptiveModeRef.current =
      adaptiveMode;

    cognitiveLoadRef.current =
      cognitiveLoad;
  }, [
    activePage,
    adaptiveMode,
    cognitiveLoad,
  ]);


  const recordEvent = useCallback(
    (type, payload = {}) => {
      const event = {
        id: createId(),

        sessionId:
          sessionIdRef.current,

        timestamp:
          new Date().toISOString(),

        page:
          activePageRef.current,

        adaptiveMode:
          adaptiveModeRef.current,

        cognitiveLoad:
          cognitiveLoadRef.current,

        type,

        ...payload,
      };

      eventsRef.current.push(event);

      if (
        eventsRef.current.length >
        5000
      ) {
        eventsRef.current =
          eventsRef.current.slice(-5000);
      }

      setRecentEvents((previous) => [
        event,
        ...previous,
      ].slice(0, 20));

      return event;
    },
    []
  );


  const recordCustomEvent =
    useCallback(
      (type, payload = {}) =>
        recordEvent(type, payload),
      [recordEvent]
    );


  const recordHesitation =
    useCallback(() => {
      const now = Date.now();

      const stats =
        statsRef.current;

      const hesitation =
        now -
        stats.lastMeaningfulActionTime;

      if (
        hesitation >= 800 &&
        hesitation <= 30000
      ) {
        stats.hesitations.push(
          hesitation
        );
      }

      if (
        stats.hesitations.length >
        1000
      ) {
        stats.hesitations =
          stats.hesitations.slice(
            -1000
          );
      }

      stats.lastMeaningfulActionTime =
        now;
    }, []);


  const buildSnapshot =
    useCallback(() => {
      const stats =
        statsRef.current;

      const featureVector =
        extractFeatureVectorFromStats(
          stats,
          startTimeRef.current
        );

      return {
        sessionId:
          sessionIdRef.current,

        timestamp:
          new Date().toISOString(),

        activePage:
          activePageRef.current,

        adaptiveMode:
          adaptiveModeRef.current,

        cognitiveLoad:
          cognitiveLoadRef.current,

        clickCount:
          stats.clickCount,

        scrollDistance:
          Number(
            stats.scrollDistance.toFixed(
              2
            )
          ),

        mouseMoveCount:
          stats.mouseMoveCount,

        ...featureVector,

        featureVector,
      };
    }, []);


  const captureSnapshot =
    useCallback(() => {
      const snapshot =
        buildSnapshot();

      snapshotsRef.current.push(
        snapshot
      );

      if (
        snapshotsRef.current.length >
        1000
      ) {
        snapshotsRef.current =
          snapshotsRef.current.slice(
            -1000
          );
      }

      setMetrics(snapshot);

      return snapshot;
    }, [buildSnapshot]);


  useEffect(() => {
    if (
      previousPageRef.current !==
      activePage
    ) {
      statsRef.current
        .navigationCount += 1;

      recordEvent(
        "page_change",
        {
          from:
            previousPageRef.current,
          to: activePage,
        }
      );

      previousPageRef.current =
        activePage;
    }
  }, [
    activePage,
    recordEvent,
  ]);


  useEffect(() => {
    function handleClick(event) {
      recordHesitation();

      const targetName =
        getTargetName(event.target);

      const now = Date.now();

      statsRef.current
        .clickCount += 1;

      const repeated =
        lastClickRef.current
          .targetName ===
          targetName &&
        now -
          lastClickRef.current
            .timestamp <=
          1500;

      if (repeated) {
        statsRef.current
          .repeatedClickCount += 1;
      }

      lastClickRef.current = {
        targetName,
        timestamp: now,
      };

      recordEvent("click", {
        targetName,

        x: event.clientX,
        y: event.clientY,

        repeatedClick:
          repeated,
      });
    }


    function handleMouseMove(event) {
      const now = Date.now();

      if (
        now -
          lastMouseMoveHandledRef
            .current <
        100
      ) {
        return;
      }

      lastMouseMoveHandledRef.current =
        now;

      const stats =
        statsRef.current;

      const currentPosition = {
        x: event.clientX,
        y: event.clientY,
        timestamp: now,
      };

      if (
        stats.lastMousePosition
      ) {
        const dx =
          currentPosition.x -
          stats.lastMousePosition.x;

        const dy =
          currentPosition.y -
          stats.lastMousePosition.y;

        const distance =
          Math.sqrt(
            dx * dx + dy * dy
          );

        const duration =
          currentPosition.timestamp -
          stats.lastMousePosition
            .timestamp;

        stats.pointerDistance +=
          distance;

        stats.pointerDurationMs +=
          duration;
      }

      stats.mouseMoveCount += 1;

      stats.lastMousePosition =
        currentPosition;
    }


    function handleScroll() {
      const now = Date.now();

      if (
        now -
          lastScrollHandledRef
            .current <
        150
      ) {
        return;
      }

      lastScrollHandledRef.current =
        now;

      recordHesitation();

      const stats =
        statsRef.current;

      const currentY =
        window.scrollY || 0;

      const distance =
        Math.abs(
          currentY -
            stats.lastScrollY
        );

      const direction =
        currentY >
        stats.lastScrollY
          ? "down"
          : currentY <
            stats.lastScrollY
          ? "up"
          : "none";

      if (
        direction !== "none" &&
        stats.lastScrollDirection &&
        direction !==
          stats.lastScrollDirection
      ) {
        stats.scrollDirectionChanges +=
          1;
      }

      if (direction !== "none") {
        stats.lastScrollDirection =
          direction;
      }

      stats.scrollCount += 1;
      stats.scrollDistance +=
        distance;

      stats.lastScrollY =
        currentY;

      recordEvent("scroll", {
        scrollY: currentY,

        scrollDistance:
          Number(
            distance.toFixed(2)
          ),

        direction,
      });
    }


    function handleKeyDown(event) {
      recordHesitation();

      statsRef.current
        .keyPressCount += 1;

      // We deliberately do NOT
      // store actual typed characters.
      recordEvent(
        "keyboard_event",
        {
          keyType:
            event.key.length === 1
              ? "character"
              : event.key,
        }
      );
    }


    document.addEventListener(
      "click",
      handleClick
    );

    document.addEventListener(
      "mousemove",
      handleMouseMove
    );

    window.addEventListener(
      "scroll",
      handleScroll
    );

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    const intervalId =
      window.setInterval(
        captureSnapshot,
        2000
      );

    captureSnapshot();


    return () => {
      document.removeEventListener(
        "click",
        handleClick
      );

      document.removeEventListener(
        "mousemove",
        handleMouseMove
      );

      window.removeEventListener(
        "scroll",
        handleScroll
      );

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      window.clearInterval(
        intervalId
      );
    };
  }, [
    captureSnapshot,
    recordEvent,
    recordHesitation,
  ]);


  const resetTracking =
    useCallback(() => {
      const newSessionId =
        createId();

      sessionIdRef.current =
        newSessionId;

      startTimeRef.current =
        Date.now();

      eventsRef.current = [];
      snapshotsRef.current = [];

      statsRef.current =
        createEmptyStats();

      lastClickRef.current = {
        targetName: null,
        timestamp: 0,
      };

      previousPageRef.current =
        activePageRef.current;

      setRecentEvents([]);
      setMetrics(null);

      recordEvent(
        "tracking_session_started"
      );

      return newSessionId;
    }, [recordEvent]);


  const getExportPayload =
    useCallback(() => ({
      sessionId:
        sessionIdRef.current,

      exportedAt:
        new Date().toISOString(),

      currentMetrics:
        metrics,

      events:
        [...eventsRef.current],

      featureSnapshots:
        [...snapshotsRef.current],
    }), [metrics]);


  return {
    sessionId:
      sessionIdRef.current,

    metrics,
    recentEvents,

    captureSnapshot,
    recordCustomEvent,

    getExportPayload,
    resetTracking,
  };
}