import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTheme } from "../context/ThemeContext";
import { ReportOptions } from "../services/reportService";

interface ReportableSentence {
  text: string;
  index: number;
}

interface ReportPanelProps {
  triggerLabel?: string;
  fetchOptions: () => Promise<ReportOptions>;
  onSubmit: (reasonIds: number[], message: string | null, sentenceIndex?: number) => Promise<void>;
  // Only word reports need this — reasons with requiresSentence show a
  // "which sentence?" picker once selected.
  reportableSentences?: ReportableSentence[];
  alreadyReported?: boolean;
}

// Shared "🚨 Report Issue" trigger + inline panel used by AIParagraphModal,
// ConjugationModal, and WordDetailModal — mirrors web's AIModal.jsx /
// ConjugationModal.jsx / WordReportSection.jsx report forms (reason
// checkboxes + optional note, same validation rules) so all three modals
// get the same report system instead of only some of them having one.
export default function ReportPanel({
  triggerLabel = "🚨 Report Issue",
  fetchOptions,
  onSubmit,
  reportableSentences,
  alreadyReported: alreadyReportedProp,
}: ReportPanelProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";

  const [open, setOpen] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [reasons, setReasons] = useState<ReportOptions["reasons"]>([]);
  const [freeTextEnabled, setFreeTextEnabled] = useState(true);
  const [maxCharacters, setMaxCharacters] = useState(50);
  const [selectedReasonIds, setSelectedReasonIds] = useState<Set<number>>(new Set());
  const [selectedSentenceIndex, setSelectedSentenceIndex] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(Boolean(alreadyReportedProp));

  const needsSentence =
    Boolean(reportableSentences) &&
    [...selectedReasonIds].some((id) => reasons.find((r) => r.id === id)?.requiresSentence);
  const messageCharCount = message.trim().length;
  const messageTooLong = freeTextEnabled && messageCharCount > maxCharacters;

  const handleToggleOpen = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    setError("");
    setOptionsLoading(true);
    try {
      const options = await fetchOptions();
      setReasons(options.reasons);
      setFreeTextEnabled(options.freeTextEnabled);
      setMaxCharacters(options.maxCharacters);
    } catch {
      setError("Could not load report options. Please try again.");
    } finally {
      setOptionsLoading(false);
    }
  };

  const toggleReason = (reasonId: number) => {
    setSelectedReasonIds((prev) => {
      const next = new Set(prev);
      if (next.has(reasonId)) next.delete(reasonId);
      else next.add(reasonId);
      return next;
    });
  };

  const handleSubmit = async () => {
    setError("");
    const hasMessage = freeTextEnabled && message.trim().length > 0;
    if (selectedReasonIds.size === 0 && !hasMessage) {
      setError("Select at least one reason or add a note.");
      return;
    }
    if (needsSentence && selectedSentenceIndex === null) {
      setError("Select which sentence is incorrect.");
      return;
    }
    if (messageTooLong) {
      setError(`Your note must be ${maxCharacters} characters or fewer.`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(
        [...selectedReasonIds],
        freeTextEnabled && message.trim() ? message.trim() : null,
        needsSentence ? selectedSentenceIndex! : undefined,
      );
      setDone(true);
      setOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#22C55E" }}>✓ Reported</Text>
    );
  }

  return (
    <View>
      <TouchableOpacity onPress={handleToggleOpen}>
        <Text style={{ fontSize: 12, fontWeight: "700", color: "#F87171" }}>
          {open ? "✕ Hide Report Form" : triggerLabel}
        </Text>
      </TouchableOpacity>

      {open && (
        <View
          style={{
            marginTop: 12,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: isDark ? "#7f1d1d" : "#FCA5A5",
            backgroundColor: isDark ? "rgba(127,29,29,0.15)" : "#FEF2F2",
            padding: 14,
          }}
        >
          {optionsLoading ? (
            <ActivityIndicator size="small" color="#F87171" />
          ) : (
            <>
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#F87171", marginBottom: 8 }}>
                What's wrong?
              </Text>
              {reasons.map((reason) => {
                const selected = selectedReasonIds.has(reason.id);
                return (
                  <TouchableOpacity
                    key={reason.id}
                    onPress={() => toggleReason(reason.id)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: "#F87171",
                        backgroundColor: selected ? "#F87171" : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {selected && (
                        <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>✓</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 13, color: textPrimary, flex: 1 }}>
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {reasons.length === 0 && (
                <Text style={{ fontSize: 12, color: textMuted, fontStyle: "italic" }}>
                  No report reasons configured yet.
                </Text>
              )}

              {needsSentence && (
                <View style={{ marginTop: 10, marginBottom: 4 }}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: textPrimary, marginBottom: 6 }}>
                    Which sentence?
                  </Text>
                  {(reportableSentences || []).length === 0 ? (
                    <Text style={{ fontSize: 12, color: textMuted, fontStyle: "italic" }}>
                      This word has no sentences to select.
                    </Text>
                  ) : (
                    reportableSentences!.map(({ text, index }) => {
                      const selected = selectedSentenceIndex === index;
                      return (
                        <TouchableOpacity
                          key={index}
                          onPress={() => setSelectedSentenceIndex(index)}
                          style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: 8,
                            marginBottom: 6,
                          }}
                        >
                          <View
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: 8,
                              borderWidth: 2,
                              borderColor: "#F87171",
                              marginTop: 2,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {selected && (
                              <View
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: "#F87171",
                                }}
                              />
                            )}
                          </View>
                          <Text style={{ fontSize: 12, color: textMuted, flex: 1 }}>{text}</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              )}

              {freeTextEnabled && (
                <View style={{ marginTop: 10 }}>
                  <TextInput
                    value={message}
                    onChangeText={setMessage}
                    placeholder="Anything else? (optional)"
                    placeholderTextColor={textMuted}
                    multiline
                    numberOfLines={3}
                    style={{
                      borderWidth: 1,
                      borderColor: messageTooLong ? "#EF4444" : isDark ? "#334155" : "#D1D5DB",
                      borderRadius: 10,
                      padding: 10,
                      fontSize: 13,
                      color: textPrimary,
                      textAlignVertical: "top",
                      minHeight: 60,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      marginTop: 4,
                      color: messageTooLong ? "#EF4444" : textMuted,
                    }}
                  >
                    {messageCharCount}/{maxCharacters} characters
                  </Text>
                </View>
              )}
            </>
          )}

          {Boolean(error) && (
            <Text style={{ fontSize: 12, color: "#EF4444", marginTop: 8 }}>{error}</Text>
          )}

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting || optionsLoading}
              style={{
                backgroundColor: "#DC2626",
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 8,
                opacity: submitting || optionsLoading ? 0.6 : 1,
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700" }}>
                  Submit report
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setOpen(false);
                setError("");
              }}
              style={{
                backgroundColor: isDark ? "#334155" : "#E5E7EB",
                borderRadius: 10,
                paddingHorizontal: 16,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: textPrimary, fontSize: 13, fontWeight: "700" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
