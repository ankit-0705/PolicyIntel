"use client";
const backendUrl = import.meta.env.VITE_API_BASE_URL;

import { useState } from "react";
import axios from "axios";
import { Sidebar, SidebarBody, SidebarLink } from "../components/ui/sidebar";
import {
  IconArrowLeft,
  IconBrandTabler,
  IconUserBolt,
  IconHistory,
} from "@tabler/icons-react";
import { FileUpload } from "../components/ui/file-upload";
import { PlaceholdersAndVanishInput } from "../components/ui/placeholders-and-vanish-input";
import { MultiStepLoader } from "../components/ui/multistep-loader";
import { Lightbulb } from "lucide-react";
import img from "../assets/robot.jpg";

const loadingStates = [
  { text: "Document Parsing" },
  { text: "Query Parsing" },
  { text: "Making Chunks" },
  { text: "Embeddings" },
  { text: "LLM Processing" },
  { text: "Thank you for your patience." },
];

export default function Home() {
  const [open, setOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documentId, setDocumentId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  const placeholders = [
    "What does this insurance policy cover?",
    "Are there any hidden exclusions in this policy?",
    "Explain the terms and conditions in simple language.",
    "What are the tax benefits associated with this plan?",
    "Is this policy suitable for someone aged 30?",
    "What is the claim settlement ratio for this policy?",
    "How much will I receive after 5 years?",
    "Does this policy include accidental coverage?",
    "What's the premium payment term?",
    "Can I cancel this policy early?",
    "What is the surrender value of this plan?",
    "Break down the benefits and drawbacks of this policy.",
    "What happens if I miss a premium payment?",
    "Is this plan good for long-term investment?",
    "Can I add riders to enhance this policy?",
  ];

  const links = [
    {
      label: "Dashboard",
      href: "/home",
      icon: <IconBrandTabler className="w-5 h-5 text-cyan-400" />,
    },
    {
      label: "Profile",
      href: "/profile",
      icon: <IconUserBolt className="w-5 h-5 text-cyan-400" />,
    },
    {
      label: "History",
      href: "/history",
      icon: <IconHistory className="w-5 h-5 text-cyan-400" />,
    },
    {
      label: "Logout",
      href: "/login",
      isLogout: true,
      icon: <IconArrowLeft className="w-5 h-5 text-cyan-400" />,
    },
  ];

  const handleChange = (files) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const filtered = files.filter((file) => allowedTypes.includes(file.type));
    setUploadedFiles((prev) => [...prev, ...filtered]);
  };

  const handleRemoveFile = (fileName) => {
    setUploadedFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
  };

  const uploadFiles = async () => {
    if (uploadedFiles.length === 0) return;
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    uploadedFiles.forEach((file) => formData.append("file", file));

    try {
      const response = await axios.post(
        `${backendUrl}/api/upload/`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        }
      );
      const data = response.data;
      setDocumentId(data.document_id);
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!documentId) {
      alert("Please upload a document first.");
      return;
    }
    if (!query.trim()) {
      alert("Please enter a query.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${backendUrl}/api/analyze/`, {
        document_id: documentId,
        query,
      });

      await new Promise((resolve) => setTimeout(resolve, 1500));
      setAnalysisResult(response.data);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden bg-[#0F0F1A] text-white relative">
      {/* Sidebar */}
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10 bg-[#101828]">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <div className="flex items-center gap-2 px-2 py-2">
              <img
                src={img}
                alt="Logo"
                className="h-8 w-8 rounded-full object-cover"
              />
              {open && (
                <span className="text-xl font-bold text-cyan-400 transition-opacity duration-300">
                  PolicyIntel
                </span>
              )}
            </div>
            <div className="mt-6 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 space-y-10 overflow-y-auto md:px-6">
        <div>
          <h2 className="text-3xl font-semibold mb-2">
            Insurance Query Analysis
          </h2>
          <p className="text-gray-400">
            Analyze insurance policies and claims with AI-powered insights
          </p>
        </div>

        {/* Upload Section */}
        <div className="border border-dashed border-gray-600 p-4 md:p-8 rounded-lg bg-[#1A1B2E] relative">
          <div className="absolute top-2 right-2 text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
            Only PDF and DOCX files
          </div>
          <FileUpload
            onChange={handleChange}
            accept={[
              "application/pdf",
              "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ]}
            showRemoveButton
            files={uploadedFiles}
            onRemove={handleRemoveFile}
          />
          {/* Upload button */}
          <button
            disabled={uploading || uploadedFiles.length === 0}
            onClick={uploadFiles}
            className={`mt-4 px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-800 transition text-black font-semibold hover:cursor-pointer`}
          >
            {uploading ? `Uploading... ${uploadProgress}%` : "Upload Document"}
          </button>

          {/* Progress Bar */}
          {uploading && (
            <div className="mt-4 h-2 w-full bg-gray-700 rounded overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>

        {/* Input Query Section */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#1A1B2E] p-4 md:p-6 rounded-lg relative flex flex-wrap md:flex-nowrap items-center justify-between gap-4"
        >
          <PlaceholdersAndVanishInput
            placeholders={placeholders}
            onChange={handleInputChange}
            onSubmit={handleSubmit}
          />
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-normal">
            <div className="relative">
              <button
                type="button"
                onClick={() => setTooltipOpen(!tooltipOpen)}
                className="text-zinc-200 hover:text-white transition-colors"
              >
                <Lightbulb className="h-7 w-7 text-cyan-400 hover:cursor-pointer hover:drop-shadow-[0_0_6px_rgba(34,211,238,0.7)] transition-shadow duration-300" />
              </button>
              {tooltipOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1A1B2E] border border-zinc-700 text-sm text-left shadow-[0_0_12px_rgba(26,27,46,0.7)] rounded-md p-4 z-50">
                  <p className="text-white font-semibold mb-2">Need Help?</p>
                  <ul className="list-disc ml-4 text-zinc-300 space-y-1">
                    <li>What does this policy cover?</li>
                    <li>Are there any exclusions?</li>
                    <li>Will this help with taxes?</li>
                    <li>What’s the claim settlement ratio?</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-600 transition text-black font-semibold hover:cursor-pointer"
          >
            Ask
          </button>
        </form>

        <div className="w-full max-w-none px-4 md:px-8 xl:px-16">
          {/* Results */}
          {analysisResult ? (
            <div className="bg-[#1A1B2E] p-4 sm:p-6 rounded-lg space-y-4">
              {/* Structured Output */}
              <div className="space-y-2">
                <p className="text-gray-300">
                  <span className="text-gray-400 font-semibold">
                    Decision:{" "}
                  </span>
                  <span
                    className={`font-medium ${
                      analysisResult.decision === "Approved"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {analysisResult.decision === "Approved"
                      ? "✅ Approved"
                      : "❌ Rejected"}
                  </span>
                </p>

                {analysisResult.decision === "Approved" &&
                  analysisResult.amount && (
                    <p className="text-gray-300">
                      <span className="text-gray-400 font-semibold">
                        Amount:{" "}
                      </span>
                      <span className="text-green-400 font-semibold">
                        ${Number(analysisResult.amount).toLocaleString()}
                      </span>
                    </p>
                  )}

                <p className="text-gray-300">
                  <span className="text-gray-400 font-semibold">
                    Justification:{" "}
                  </span>
                  {analysisResult.justification}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No analysis results to display.</p>
          )}

          {/* Match Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            {analysisResult?.matched_clauses?.map((clause, idx) => {
              const similarity = clause.similarity;
              let borderColor = "border-gray-600";
              let textColor = "text-gray-400";

              if (similarity >= 95) {
                borderColor = "border-green-600";
                textColor = "text-green-400";
              } else if (similarity >= 90) {
                borderColor = "border-yellow-500";
                textColor = "text-yellow-400";
              } else {
                borderColor = "border-blue-500";
                textColor = "text-blue-400";
              }

              return (
                <div
                  key={idx}
                  className={`bg-[#1A1B2E] p-4 sm:p-6 rounded-lg border ${borderColor} flex flex-col`}
                >
                  <p className={`font-semibold ${textColor}`}>
                    {similarity.toFixed(0)}% Match
                  </p>
                  <p className="text-gray-300 mt-2 line-clamp-3">
                    {clause.text}
                  </p>
                  <p className="text-sm text-gray-500 mt-auto">
                    {clause.source}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <MultiStepLoader
        loadingStates={loadingStates}
        loading={loading}
        duration={1500}
      />
    </div>
  );
}
