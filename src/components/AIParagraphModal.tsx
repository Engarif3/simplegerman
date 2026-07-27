import React from "react";
import { Modal, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { GeneratedParagraph } from "../services/paragraphService";
import { useTheme } from "../context/ThemeContext";
import { reportService } from "../services/reportService";
import ReportPanel from "./ReportPanel";

interface AIParagraphModalProps {
  visible: boolean;
  wordId: string;
  userId?: string;
  wordValue: string;
  article?: string;
  meaning?: string;
  data: GeneratedParagraph | null;
  onClose: () => void;
}

// Learner-facing subset of the web app's AIModal.jsx — shows the generated
// meanings + practice paragraph. The super-admin correction/regenerate/
// preview tooling there is intentionally left out (admin features are out
// of scope for mobile).
export default function AIParagraphModal({
  visible,
  wordId,
  userId,
  wordValue,
  article,
  meaning,
  data,
  onClose,
}: AIParagraphModalProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const insets = useSafeAreaInsets();
  const bg = isDark ? "#020617" : "#FFFFFF";
  const cardBg = isDark ? "#0f172a" : "#F0FDF4";
  const cardBorder = isDark ? "#166534" : "#86EFAC";
  const paragraphBg = isDark ? "#0f172a" : "#EFF6FF";
  const paragraphBorder = isDark ? "#1e3a8a" : "#93C5FD";
  const textPrimary = isDark ? "#F1F5F9" : "#1F2937";
  const textSecondary = isDark ? "#CBD5E1" : "#374151";

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
            borderBottomColor: isDark ? "#1e293b" : "#EEEEEE",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: "#10B981" }}>
            🤖 AI PARAGRAPH
          </Text>
          <TouchableOpacity onPress={onClose}>
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
          <Text
            style={{
              fontSize: 26,
              fontWeight: "700",
              color: textPrimary,
              marginBottom: 4,
              textTransform: "capitalize",
            }}
          >
            {Boolean(article) && (
              <Text style={{ color: "#FF6B6B" }}>{article} </Text>
            )}
            {wordValue}
          </Text>

          {Boolean(meaning) && (
            <Text
              style={{
                fontSize: 14,
                color: textSecondary,
                fontStyle: "italic",
                marginBottom: 16,
              }}
            >
              {meaning}
            </Text>
          )}

          {!data ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Text style={{ color: textSecondary }}>
                Generating paragraph…
              </Text>
            </View>
          ) : (
            <>
              {data.meanings.length > 0 && (
                <View
                  style={{
                    backgroundColor: cardBg,
                    borderWidth: 1,
                    borderColor: cardBorder,
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 16,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      color: "#10B981",
                      marginBottom: 4,
                    }}
                  >
                    AI Meanings
                  </Text>
                  <Text style={{ fontSize: 14, color: textPrimary }}>
                    {data.meanings.join(", ")}
                  </Text>
                </View>
              )}

              <View
                style={{
                  backgroundColor: paragraphBg,
                  borderWidth: 1,
                  borderColor: paragraphBorder,
                  borderRadius: 16,
                  padding: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    lineHeight: 24,
                    color: textPrimary,
                  }}
                >
                  {data.paragraph}
                </Text>
              </View>

              <View style={{ marginTop: 16 }}>
                <ReportPanel
                  fetchOptions={reportService.getParagraphReportOptions}
                  onSubmit={(reasonIds, message) =>
                    reportService.submitParagraphReport({
                      wordId,
                      userId,
                      reasonIds,
                      message,
                    })
                  }
                />
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
