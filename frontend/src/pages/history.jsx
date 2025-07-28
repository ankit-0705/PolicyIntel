"use client";

import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Spotlight } from "../components/ui/spotlight-new";
import { PlaceholdersAndVanishInput } from "../components/ui/placeholders-and-vanish-input";

import PolicyContext from "../context/PolicyContext";

const HistoryPage = () => {
  const navigate = useNavigate();
  const { history, history_getter } = useContext(PolicyContext);

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    history_getter();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredQueries = history.filter((q) =>
    q.query_text.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <Spotlight />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 w-full max-w-5xl mx-auto px-6 py-20"
      >
        {/* Top Bar */}
        <div className="flex justify-between items-center mb-10 w-full">
          <button
            onClick={() => navigate("/home")}
            className="text-sm border border-white/20 rounded px-4 py-2 hover:bg-white/10 transition hover:cursor-pointer"
          >
            ← Back to Dashboard
          </button>

          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-sm text-red-400 underline hover:text-red-500 hover:cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="text-center text-4xl font-bold mb-12 bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500"
        >
          History
        </motion.h2>

        {/* Search Input */}
        <div className="mb-12 w-full">
          <PlaceholdersAndVanishInput
            placeholders={["Search previous queries..."]}
            onChange={(e) => setSearch(e.target.value)}
            onSubmit={(e) => e.preventDefault()}
            className="w-full"
          />
        </div>

        {/* Query Cards */}
        {filteredQueries.length === 0 ? (
          <p className="text-center text-gray-400">
            No matching queries found.
          </p>
        ) : (
          <div className="space-y-6">
            {filteredQueries.map((q, idx) => {
              const isExpanded = expandedId === idx;
              const {
                query_text,
                filename,
                created_at,
                decision_response,
                parsed_input,
              } = q;
              const { decision, justification, matched_clauses } =
                decision_response;

              return (
                <motion.div
                  key={created_at + query_text + idx}
                  layout
                  onClick={() => toggleExpand(idx)}
                  className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg hover:bg-white/10 transition"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                    <div className="flex-1">
                      <p
                        className="text-lg font-semibold text-white break-words sm:truncate"
                        title={query_text}
                      >
                        {query_text}
                      </p>
                      <p
                        className="text-sm text-gray-400 mt-1 truncate"
                        title={filename || "N/A"}
                      >
                        Document: {filename || "N/A"}
                      </p>
                    </div>
                    <p
                      className="text-sm text-gray-500 ml-4 whitespace-nowrap"
                      title={new Date(created_at).toLocaleString()}
                    >
                      {new Date(created_at).toLocaleString()}
                    </p>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        key="expanded"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-4 text-sm text-gray-300 space-y-4"
                      >
                        <div>
                          <strong>Decision: </strong>
                          <span
                            className={
                              decision.toLowerCase() === "approved"
                                ? "text-green-400"
                                : "text-red-400"
                            }
                          >
                            {decision}
                          </span>
                        </div>

                        <div>
                          <strong>Justification:</strong>
                          <p className="whitespace-pre-wrap mt-1">
                            {justification}
                          </p>
                        </div>

                        <div>
                          <strong>Parsed Input:</strong>
                          <ul className="list-disc list-inside mt-1 ml-5 text-gray-300 space-y-1">
                            {parsed_input &&
                              Object.entries(parsed_input).map(
                                ([key, value]) => (
                                  <li key={key}>
                                    <strong className="capitalize">
                                      {key}:
                                    </strong>{" "}
                                    {value === null || value === "" ? (
                                      <em className="text-gray-500">N/A</em>
                                    ) : (
                                      String(value)
                                    )}
                                  </li>
                                )
                              )}
                          </ul>
                        </div>

                        {matched_clauses && matched_clauses.length > 0 && (
                          <div>
                            <strong>Matched Clauses:</strong>
                            <ul className="list-decimal list-inside mt-2 ml-5 space-y-3 text-gray-300">
                              {matched_clauses.slice(0, 3).map((clause, i) => (
                                <li key={i}>
                                  <p
                                    className="italic text-sm truncate"
                                    title={clause.text}
                                  >
                                    "
                                    {clause.text.length > 180
                                      ? clause.text.slice(0, 180) + "..."
                                      : clause.text}
                                    "
                                  </p>
                                  <p className="text-xs mt-0.5 text-gray-500">
                                    Similarity: {clause.similarity.toFixed(2)}%
                                    — Source: {clause.source || "N/A"}
                                  </p>
                                </li>
                              ))}
                              {matched_clauses.length > 3 && (
                                <li className="text-xs text-gray-400 italic">
                                  ...and {matched_clauses.length - 3} more
                                </li>
                              )}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HistoryPage;
