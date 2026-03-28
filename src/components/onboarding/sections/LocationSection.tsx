"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EASE_SMOOTH } from "@/lib/motion";

interface LocationResult {
  id: string;
  displayName: string;
}

interface LocationSectionProps {
  isActive: boolean;
  location: string;
  onComplete: (location: string) => void;
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3, ease: EASE_SMOOTH } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE_SMOOTH } },
};

export default function LocationSection({
  isActive,
  location: savedLocation,
  onComplete,
}: LocationSectionProps) {
  const [inputValue, setInputValue] = useState(savedLocation);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(
    savedLocation || null
  );
  const [results, setResults] = useState<LocationResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // fetch locations from our API route
  const fetchLocations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setIsOpen(false);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/location-search?q=${encodeURIComponent(query)}`
      );
      const data = await res.json();
      const fetched: LocationResult[] = data.results ?? [];
      setResults(fetched);
      setIsOpen(fetched.length > 0);
      setActiveIndex(-1);
    } catch {
      setResults([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // handle typing -- debounce 300ms
  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    setSelectedLocation(null); // clear selection when user edits

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchLocations(val.trim()), 300);
  }

  // handle picking an option
  function selectOption(displayName: string) {
    setInputValue(displayName);
    setSelectedLocation(displayName);
    setIsOpen(false);
    setResults([]);
    setActiveIndex(-1);
  }

  // keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen || results.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        selectOption(results[activeIndex].displayName);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  // close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // show hint when user has typed but hasn't selected
  const showHint =
    inputValue.trim().length >= 2 &&
    !selectedLocation &&
    !isOpen &&
    !isLoading;

  return (
    <AnimatePresence mode="wait">
      {isActive ? (
        <motion.div key="active" {...fade} className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white">
              where is your business located?
            </h2>
            <p className="mt-1 text-white/50">
              start typing your city or region and pick from the list.
            </p>
          </div>

          <div ref={wrapperRef} className="relative">
            {/* input with optional loading spinner */}
            <div className="relative">
              <input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="e.g. San Francisco"
                className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
                autoFocus
                role="combobox"
                aria-expanded={isOpen}
                aria-autocomplete="list"
                aria-controls="location-listbox"
                aria-activedescendant={
                  activeIndex >= 0 ? `location-option-${activeIndex}` : undefined
                }
              />
              {isLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
                </div>
              )}
            </div>

            {/* dropdown */}
            <AnimatePresence>
              {isOpen && results.length > 0 && (
                <motion.ul
                  id="location-listbox"
                  role="listbox"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.2, ease: EASE_SMOOTH },
                  }}
                  exit={{
                    opacity: 0,
                    y: -4,
                    transition: { duration: 0.15, ease: EASE_SMOOTH },
                  }}
                  className="absolute z-50 mt-2 w-full overflow-hidden rounded-lg border border-white/15 bg-[#1a1a1a] shadow-2xl"
                >
                  {results.map((result, i) => (
                    <li
                      key={result.id}
                      id={`location-option-${i}`}
                      role="option"
                      aria-selected={i === activeIndex}
                      onMouseEnter={() => setActiveIndex(i)}
                      onClick={() => selectOption(result.displayName)}
                      className={`cursor-pointer px-4 py-3 text-sm transition-colors ${
                        i === activeIndex
                          ? "bg-white/10 text-white"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {result.displayName}
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>

            {/* hint text */}
            {showHint && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 text-xs text-white/30"
              >
                please select a location from the dropdown
              </motion.p>
            )}
          </div>

          {/* continue button -- only shows when a location is selected */}
          {selectedLocation && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_SMOOTH }}
            >
              <button
                onClick={() => onComplete(selectedLocation)}
                className="block w-full rounded-full bg-white py-3 text-center font-medium text-black transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)] active:scale-[0.98]"
              >
                continue
              </button>
            </motion.div>
          )}
        </motion.div>
      ) : (
        <motion.div key="completed" {...fade}>
          <p className="text-sm text-white/40">location</p>
          <p className="text-base font-semibold text-white">{savedLocation}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
