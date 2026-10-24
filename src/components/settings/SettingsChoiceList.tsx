import { useCallback, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useColors } from "@/hooks/useColors";
import { useGroupedRowStyles } from "@/hooks/useGroupedRowStyles";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";

export interface Choice {
  key: string;
  label: string;
  detail?: string;
}

interface Props {
  choices: Choice[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

function keyExtractor(choice: Choice) {
  return choice.key;
}

/** Single-select list with a checkmark, for the language and currency screens. */
export function SettingsChoiceList({ choices, selectedKey, onSelect }: Props) {
  const colors = useColors();

  const renderItem = useCallback(
    ({ item, index }: { item: Choice; index: number }) => (
      <ChoiceRow
        choice={item}
        selected={item.key === selectedKey}
        isFirst={index === 0}
        isLast={index === choices.length - 1}
        onSelect={onSelect}
      />
    ),
    [selectedKey, choices.length, onSelect]
  );

  const listStyle = useMemo(() => ({ backgroundColor: colors.modalBackground }), [colors]);

  return (
    <FlatList
      data={choices}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      extraData={selectedKey}
      style={listStyle}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic"
    />
  );
}

interface ChoiceRowProps {
  choice: Choice;
  selected: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: (key: string) => void;
}

function ChoiceRow({ choice, selected, isFirst, isLast, onSelect }: ChoiceRowProps) {
  const colors = useColors();
  const groupedStyles = useGroupedRowStyles(isFirst, isLast);

  const handlePress = useCallback(() => {
    onSelect(choice.key);
  }, [onSelect, choice.key]);

  const accessibilityState = useMemo(() => ({ selected }), [selected]);

  return (
    <View style={groupedStyles.container}>
      <Pressable
        style={groupedStyles.row}
        onPress={handlePress}
        accessibilityRole="radio"
        accessibilityState={accessibilityState}
      >
        <View style={styles.text}>
          <AppText variant="body">{choice.label}</AppText>
          {choice.detail ? <AppText variant="meta">{choice.detail}</AppText> : null}
        </View>
        {selected ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: MEASUREMENTS.spacing.gutter,
    paddingBottom: MEASUREMENTS.spacing.bottom,
  },
  text: {
    flex: 1,
    gap: MEASUREMENTS.spacing.xs,
  },
});
