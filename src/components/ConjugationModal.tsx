import React from "react";
import { Modal, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ConjugationData, ConjugationRow } from "../services/conjugationService";
import { useTheme } from "../context/ThemeContext";
import { reportService } from "../services/reportService";
import ReportPanel from "./ReportPanel";

interface ConjugationModalProps {
  visible: boolean;
  userId?: string;
  verb: string;
  meaning?: string;
  data: ConjugationData | null;
  error: string | null;
  onClose: () => void;
}

const TENSE_LABELS = {
  präsens: "Präsens",
  perfekt: "Perfekt",
  präteritum: "Präteritum",
};

function ConjugationTable({
  rows,
  textPrimary,
  textMuted,
  border,
}: {
  rows: ConjugationRow[];
  textPrimary: string;
  textMuted: string;
  border: string;
}) {
  return (
    <View>
      {rows.map((row) => (
        <View
          key={row.pronoun}
          style={{
            flexDirection: "row",
            paddingVertical: 8,
            paddingHorizontal: 10,
            borderBottomWidth: 1,
            borderBottomColor: border,
          }}
        >
          <Text style={{ width: 60, color: "#22D3EE", fontWeight: "600", fontSize: 13 }}>
            {row.pronoun}
          </Text>
          <Text style={{ flex: 1, color: textPrimary, fontWeight: "600", fontSize: 13 }}>
            {row.conjugation}
          </Text>
        </View>
      ))}
    </View>
  );
}

function TenseSection({
  label,
  children,
  cardBg,
  headerBg,
  border,
}: {
  label: string;
  children: React.ReactNode;
  cardBg: string;
  headerBg: string;
  border: string;
}) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: border,
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 14,
      }}
    >
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 10,
          backgroundColor: headerBg,
          borderBottomWidth: 1,
          borderBottomColor: border,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#A78BFA" }}>
          {label}
        </Text>
      </View>
      <View style={{ backgroundColor: cardBg }}>{children}</View>
    </View>
  );
}

// Learner-facing subset of web's ConjugationModal.jsx — Präsens/Perfekt/
// Präteritum tables only. Admin regenerate-with-prompt tooling is
// intentionally left out (admin features are out of scope for mobile).
export default function ConjugationModal({
  visible,
  userId,
  verb,
  meaning,
  data,
  error,
  onClose,
}: ConjugationModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F9F9F9";
  const headerBg = isDark ? "#1e1b3a" : "#F3E8FF";
  const border = isDark ? "#1e293b" : "#EEEEEE";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textMuted = isDark ? "#94A3B8" : "#6B7280";

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: bg }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingTop: insets.top + 14,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: border,
          }}
        >
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#A78BFA" }}>
              AI CONJUGATION
            </Text>
            <Text
              style={{ fontSize: 20, fontWeight: "700", color: textPrimary }}
              numberOfLines={1}
            >
              {verb}
              {Boolean(meaning) && (
                <Text style={{ fontSize: 14, fontWeight: "400", color: textMuted }}>
                  {" "}
                  ({meaning})
                </Text>
              )}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={{ flexShrink: 0 }}>
            <MaterialCommunityIcons
              name="close-circle"
              size={28}
              color="#FF6B6B"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        >
          {!data && !error && (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Text style={{ color: textMuted }}>
                Generating conjugation table…
              </Text>
            </View>
          )}

          {error && (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Text style={{ fontSize: 28, marginBottom: 8 }}>⚠️</Text>
              <Text style={{ color: "#F87171", fontWeight: "700" }}>
                Failed to generate conjugation
              </Text>
              <Text style={{ color: textMuted, marginTop: 4 }}>{error}</Text>
            </View>
          )}

          {data && (
            <>
              <TenseSection
                label={TENSE_LABELS.präsens}
                cardBg={cardBg}
                headerBg={headerBg}
                border={border}
              >
                <ConjugationTable
                  rows={data.präsens}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  border={border}
                />
              </TenseSection>

              <TenseSection
                label={TENSE_LABELS.perfekt}
                cardBg={cardBg}
                headerBg={headerBg}
                border={border}
              >
                <ConjugationTable
                  rows={data.perfekt?.conjugations ?? []}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  border={border}
                />
              </TenseSection>

              <TenseSection
                label={TENSE_LABELS.präteritum}
                cardBg={cardBg}
                headerBg={headerBg}
                border={border}
              >
                <ConjugationTable
                  rows={data.präteritum}
                  textPrimary={textPrimary}
                  textMuted={textMuted}
                  border={border}
                />
              </TenseSection>

              <Text style={{ fontSize: 11, color: textMuted, textAlign: "center", marginTop: 4 }}>
                Generated by AI · verify with a grammar reference
              </Text>

              {Boolean(userId) && (
                <View style={{ marginTop: 14 }}>
                  <ReportPanel
                    triggerLabel="Report error"
                    fetchOptions={reportService.getConjugationReportOptions}
                    onSubmit={(reasonIds, message) =>
                      reportService.submitConjugationReport({
                        verb,
                        userId,
                        reasonIds,
                        message,
                      })
                    }
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
