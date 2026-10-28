import { File, Paths } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import { format } from "date-fns";
import { t } from "@/localization/i18n";
import type { Expense, ExpenseAssignment, IncomeSource, PaycheckOverride } from "@/types";

const BACKUP_APP = "paycheck-planner";
const BACKUP_VERSION = 1;

export interface BudgetData {
  incomeSources: IncomeSource[];
  expenses: Expense[];
  assignments: ExpenseAssignment[];
  paycheckOverrides: PaycheckOverride[];
}

/** Writes `contents` to a fresh cache file and opens the share sheet for it. */
async function shareFile(name: string, contents: string, uti: string, mimeType: string) {
  const file = new File(Paths.cache, name);
  if (file.exists) {
    file.delete();
  }
  file.create();
  file.write(contents);
  await Sharing.shareAsync(file.uri, { UTI: uti, mimeType });
}

export async function shareBackup(data: BudgetData): Promise<void> {
  const backup = { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), ...data };
  await shareFile(
    `paycheck-planner-${format(new Date(), "yyyy-MM-dd")}.json`,
    JSON.stringify(backup, null, 2),
    "public.json",
    "application/json"
  );
}

function csvField(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** One row per bill or set-aside, for opening in a spreadsheet. */
export async function shareExpensesCsv(expenses: Expense[], incomeSources: IncomeSource[]): Promise<void> {
  const sourceNames = new Map(incomeSources.map((s) => [s.id, s.name]));
  const header = [
    t("expenses.form.payee"),
    t("expenses.form.amount"),
    t("settings.data.csvType"),
    t("expenses.form.howOften"),
    t("expenses.form.linkedSource"),
    t("expenses.form.paycheck"),
  ];
  const rows = expenses.map((e) => [
    e.payee,
    e.amount,
    t(e.kind === "set-aside" ? "expenses.kind.setAside" : "expenses.kind.bill"),
    t(e.isRecurring ? "expenses.filters.recurring" : "expenses.filters.oneTime"),
    e.incomeSourceId ? (sourceNames.get(e.incomeSourceId) ?? "") : "",
    e.dueDate ?? "",
  ]);
  const csv = [header, ...rows].map((row) => row.map(csvField).join(",")).join("\n");
  await shareFile(
    `paycheck-planner-bills-${format(new Date(), "yyyy-MM-dd")}.csv`,
    csv,
    "public.comma-separated-values-text",
    "text/csv"
  );
}

function isBackup(value: unknown): value is BudgetData {
  return (
    typeof value === "object" &&
    value !== null &&
    "app" in value &&
    value.app === BACKUP_APP &&
    "incomeSources" in value &&
    Array.isArray(value.incomeSources) &&
    "expenses" in value &&
    Array.isArray(value.expenses) &&
    "assignments" in value &&
    Array.isArray(value.assignments) &&
    "paycheckOverrides" in value &&
    Array.isArray(value.paycheckOverrides)
  );
}

export type PickBackupResult =
  | { status: "canceled" }
  | { status: "invalid" }
  | { status: "ok"; data: BudgetData };

/** Lets the user pick a backup file and checks it came from this app. */
export async function pickBackup(): Promise<PickBackupResult> {
  const result = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });
  if (result.canceled) return { status: "canceled" };
  try {
    const parsed: unknown = JSON.parse(await new File(result.assets[0].uri).text());
    if (!isBackup(parsed)) return { status: "invalid" };
    const { incomeSources, expenses, assignments, paycheckOverrides } = parsed;
    return { status: "ok", data: { incomeSources, expenses, assignments, paycheckOverrides } };
  } catch {
    return { status: "invalid" };
  }
}
