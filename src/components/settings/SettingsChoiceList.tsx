import { useCallback, useMemo, useRef } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useGutters } from "@/hooks/useGutters";
import { useColors } from "@/hooks/useColors";
import { useGroupedRowStyles } from "@/hooks/useGroupedRowStyles";
import { MEASUREMENTS } from "@/constants/measurements";
import { AppText } from "@/components/AppText";
import { highlightOnPress } from "@/constants/press";
import { useScrollKeptOnResize } from "@/hooks/useScrollKeptOnResize";

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
  const scrollRef = useRef<FlatList<Choice>>(null);
  const keptScroll = useScrollKeptOnResize(scrollRef);
  const gutters = useGutters();
  const contentStyle = useMemo(() => [styles.content, gutters], [gutters]);

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
      ref={scrollRef}
      {...keptScroll}
      data={choices}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      extraData={selectedKey}
      style={listStyle}
      contentContainerStyle={contentStyle}
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

  const rowStyle = useMemo(
    () => highlightOnPress(groupedStyles.row, colors.rowPressed),
    [groupedStyles, colors]
  );

  const accessibilityState = useMemo(() => ({ selected }), [selected]);

  return (
    <View style={groupedStyles.container}>
      <Pressable
        style={rowStyle}
        onPress={handlePress}
        accessibilityRole="radio"
        accessibilityState={accessibilityState}
      >
        {/* One text node: as its own node the System default row's detail ("English") is a second
            element with a language's name, and on Android a tap on that name lands on this row (HAU-304) */}
        <AppText variant="body" style={styles.text}>
          {choice.label}
          {choice.detail ? <AppText variant="meta">{`\n${choice.detail}`}</AppText> : null}
        </AppText>
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
  },
});
