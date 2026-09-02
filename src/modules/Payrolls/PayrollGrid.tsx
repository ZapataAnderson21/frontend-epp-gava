import { Check, LockKeyhole } from "lucide-react";
import { motion } from "framer-motion";
import type {
  GeneralPayrollEntry,
  GeneralPayrollProject,
  GeneralPayrollWorker,
  PayrollWorkerGroup,
} from "./types";

const dayFields = [
  ["monday", "L"],
  ["tuesday", "M"],
  ["wednesday", "MI"],
  ["thursday", "J"],
  ["friday", "V"],
  ["saturday", "S"],
  ["dominical", "Dominical"],
] as const;

const moneyFormatter = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const groupLabel: Record<PayrollWorkerGroup, string> = {
  laborer: "Obreros",
  technician: "Técnicos",
};

type DayField = (typeof dayFields)[number][0];

interface ProjectColumnTotals {
  days: Record<DayField, number>;
  totalDays: number;
  dailyWage: number;
  overtime: number;
  gross: number;
  afp: number;
  advance: number;
  net: number;
}

const emptyDays = (): Record<DayField, number> =>
  Object.fromEntries(dayFields.map(([field]) => [field, 0])) as Record<
    DayField,
    number
  >;

const calculateProjectWorkerTotals = (
  worker: GeneralPayrollWorker,
  entry: GeneralPayrollEntry,
): ProjectColumnTotals => {
  const days = Object.fromEntries(
    dayFields.map(([field]) => [field, Number(entry[field])]),
  ) as Record<DayField, number>;
  const totalDays = Object.values(days).reduce(
    (total, value) => total + value,
    0,
  );
  const gross = totalDays * worker.dailyWage + entry.overtimeAmount;
  const net = gross - entry.afpDiscount - entry.advanceDiscount;
  return {
    days,
    totalDays,
    dailyWage: worker.dailyWage,
    overtime: entry.overtimeAmount,
    gross,
    afp: entry.afpDiscount,
    advance: entry.advanceDiscount,
    net,
  };
};

const sumProjectColumnTotals = (
  totals: ProjectColumnTotals[],
): ProjectColumnTotals =>
  totals.reduce<ProjectColumnTotals>(
    (sum, current) => ({
      days: Object.fromEntries(
        dayFields.map(([field]) => [
          field,
          sum.days[field] + current.days[field],
        ]),
      ) as Record<DayField, number>,
      totalDays: sum.totalDays + current.totalDays,
      dailyWage: sum.dailyWage + current.dailyWage,
      overtime: sum.overtime + current.overtime,
      gross: sum.gross + current.gross,
      afp: sum.afp + current.afp,
      advance: sum.advance + current.advance,
      net: sum.net + current.net,
    }),
    {
      days: emptyDays(),
      totalDays: 0,
      dailyWage: 0,
      overtime: 0,
      gross: 0,
      afp: 0,
      advance: 0,
      net: 0,
    },
  );

function ProjectTotalsRow({
  label,
  totals,
  overall = false,
}: {
  label: string;
  totals: ProjectColumnTotals;
  overall?: boolean;
}) {
  return (
    <tr
      className={
        overall
          ? "border-t-2 border-[#0047a3] bg-[#eaf2ff] font-extrabold text-[#0f2545]"
          : "border-t border-gray-200 bg-gray-100 font-bold text-[#0f2545]"
      }
    >
      <td colSpan={3} className="px-4 py-3 text-right">
        {label}
      </td>
      {dayFields.map(([field]) => (
        <td key={field} className="px-2 py-3 text-center">
          {moneyFormatter.format(totals.days[field])}
        </td>
      ))}
      {[
        totals.totalDays,
        totals.dailyWage,
        totals.overtime,
        totals.gross,
        totals.afp,
        totals.advance,
        totals.net,
      ].map((value, index) => (
        <td key={index} className="px-3 py-3 text-right">
          {index >= 1 ? "S/ " : ""}
          {moneyFormatter.format(value)}
        </td>
      ))}
    </tr>
  );
}

interface ProjectGridProps {
  project: GeneralPayrollProject;
  projects: GeneralPayrollProject[];
  workers: GeneralPayrollWorker[];
  onEntryChange: (
    entryId: number,
    field: keyof GeneralPayrollEntry,
    value: number,
  ) => void;
  onWorkerChange: (
    workerId: number,
    field: keyof GeneralPayrollWorker,
    value: number,
  ) => void;
  readOnly?: boolean;
}

const NumberInput = ({
  value,
  onChange,
  ariaLabel,
  className = "w-20",
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
}) => (
  <input
    type="number"
    min="0"
    step="0.01"
    value={value}
    aria-label={ariaLabel}
    disabled={disabled}
    onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
    className={`${className} rounded-md border border-gray-300 px-2 py-1.5 text-right outline-none transition focus:border-[#0047a3] focus:ring-2 focus:ring-[#0047a3]/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600`}
  />
);

const AttendanceCheck = ({
  checked,
  disabled,
  disabledReason,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  disabled: boolean;
  disabledReason?: string;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}) => (
  <motion.button
    type="button"
    role="checkbox"
    aria-checked={checked}
    aria-label={ariaLabel}
    disabled={disabled}
    title={disabledReason || ariaLabel}
    whileHover={disabled ? undefined : { scale: 1.08 }}
    whileTap={disabled ? undefined : { scale: 0.88 }}
    animate={{ scale: checked ? 1 : 0.96 }}
    transition={{ type: "spring", stiffness: 460, damping: 24 }}
    onClick={() => onChange(!checked)}
    className={`inline-flex size-8 items-center justify-center rounded-lg border-2 transition-colors ${
      disabled
        ? checked
          ? "cursor-not-allowed border-[#0047a3] bg-[#0047a3] text-white opacity-75"
          : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
        : checked
          ? "cursor-pointer border-[#0047a3] bg-[#0047a3] text-white shadow-sm"
          : "cursor-pointer border-gray-300 bg-white text-transparent hover:border-[#0047a3] hover:bg-[#eff5ff]"
    }`}
  >
    {checked ? (
      <motion.span
        initial={{ scale: 0, rotate: -25 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 520, damping: 22 }}
      >
        <Check className="size-5" strokeWidth={3} />
      </motion.span>
    ) : disabled ? (
      <LockKeyhole className="size-3.5" />
    ) : (
      <Check className="size-4 opacity-0" />
    )}
  </motion.button>
);

export function ProjectPayrollGrid({
  project,
  projects,
  workers,
  onEntryChange,
  onWorkerChange,
  readOnly = false,
}: ProjectGridProps) {
  const entryByWorker = new Map(
    project.entries.map((entry) => [entry.generalPayrollWorkerId, entry]),
  );
  const activeWorkers = workers.filter(
    (worker) => entryByWorker.get(worker.generalPayrollWorkerId)?.isActive,
  );
  const allProjectTotals = sumProjectColumnTotals(
    activeWorkers.map((worker) =>
      calculateProjectWorkerTotals(
        worker,
        entryByWorker.get(worker.generalPayrollWorkerId)!,
      ),
    ),
  );

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-[1500px] w-full border-collapse text-sm">
        <thead className="bg-[#f3f5f8] text-[#0f2545]">
          <tr>
            <th className="sticky left-0 z-20 min-w-12 bg-[#f3f5f8] px-3 py-4 text-center">
              Item
            </th>
            <th className="sticky left-12 z-20 min-w-64 bg-[#f3f5f8] px-3 py-4 text-left">
              Nombre y apellido
            </th>
            <th className="min-w-24 px-3 py-4 text-left">DNI</th>
            {dayFields.map(([, label]) => (
              <th key={label} className="px-2 py-4 text-center">
                {label}
              </th>
            ))}
            <th className="px-3 py-4 text-right">Total</th>
            <th className="px-3 py-4 text-right">Jornal/día</th>
            <th className="px-3 py-4 text-right">H.E.</th>
            <th className="px-3 py-4 text-right">Pago semana</th>
            <th className="px-3 py-4 text-right">AFP</th>
            <th className="min-w-36 px-3 py-4 text-right">Adelanto</th>
            <th className="min-w-36 px-3 py-4 text-right">Neto</th>
          </tr>
        </thead>
        <tbody>
          {(["laborer", "technician"] as const).map((group) => {
            const groupedWorkers = activeWorkers.filter(
              (worker) => worker.group === group,
            );
            const groupTotals = sumProjectColumnTotals(
              groupedWorkers.map((worker) =>
                calculateProjectWorkerTotals(
                  worker,
                  entryByWorker.get(worker.generalPayrollWorkerId)!,
                ),
              ),
            );
            return [
              <tr
                key={`${group}-header`}
                className="bg-[#eaf2ff] text-[#0047a3]"
              >
                <td
                  colSpan={18}
                  className="px-4 py-2.5 font-bold uppercase tracking-wide"
                >
                  {groupLabel[group]}
                </td>
              </tr>,
              ...groupedWorkers.map((worker, index) => {
                const entry = entryByWorker.get(worker.generalPayrollWorkerId);
                if (!entry) return null;
                const { totalDays, gross, net } = calculateProjectWorkerTotals(
                  worker,
                  entry,
                );
                return (
                  <tr
                    key={worker.generalPayrollWorkerId}
                    className="border-t border-gray-100 even:bg-gray-50/50"
                  >
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-3 text-center">
                      {index + 1}
                    </td>
                    <td className="sticky left-12 z-10 bg-[#f8fafc] px-3 py-3 font-semibold text-[#0f2545] shadow-[6px_0_8px_-8px_rgba(15,37,69,0.35)]">
                      {worker.worker.fullName}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {worker.worker.dni}
                    </td>
                    {dayFields.map(([field, label]) => (
                      <td key={field} className="px-2 py-3 text-center">
                        {(() => {
                          const occupiedProject = projects.find(
                            (candidate) =>
                              candidate.generalPayrollProjectId !==
                                project.generalPayrollProjectId &&
                              candidate.entries.some(
                                (candidateEntry) =>
                                  candidateEntry.generalPayrollWorkerId ===
                                    worker.generalPayrollWorkerId &&
                                  candidateEntry.isActive &&
                                  Number(candidateEntry[field]) > 0,
                              ),
                          );
                          const checked = Number(entry[field]) === 1;
                          const disabled =
                            readOnly || (Boolean(occupiedProject) && !checked);
                          return (
                            <AttendanceCheck
                              checked={checked}
                              disabled={disabled}
                              disabledReason={
                                readOnly
                                  ? "Vista de solo lectura"
                                  : occupiedProject
                                    ? `Ya registró asistencia en ${occupiedProject.project.name}`
                                    : undefined
                              }
                              onChange={(nextChecked) =>
                                onEntryChange(
                                  entry.generalPayrollEntryId,
                                  field,
                                  nextChecked ? 1 : 0,
                                )
                              }
                              ariaLabel={`${label} de ${worker.worker.fullName}`}
                            />
                          );
                        })()}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right font-semibold">
                      {moneyFormatter.format(totalDays)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <NumberInput
                        disabled={readOnly}
                        value={worker.dailyWage}
                        onChange={(value) =>
                          onWorkerChange(
                            worker.generalPayrollWorkerId,
                            "dailyWage",
                            value,
                          )
                        }
                        ariaLabel={`Jornal de ${worker.worker.fullName}`}
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <NumberInput
                        disabled={readOnly}
                        value={entry.overtimeAmount}
                        onChange={(value) =>
                          onEntryChange(
                            entry.generalPayrollEntryId,
                            "overtimeAmount",
                            value,
                          )
                        }
                        ariaLabel={`Horas extra de ${worker.worker.fullName}`}
                      />
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-[#0f2545]">
                      S/ {moneyFormatter.format(gross)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <NumberInput
                        disabled={readOnly}
                        value={entry.afpDiscount}
                        onChange={(value) =>
                          onEntryChange(
                            entry.generalPayrollEntryId,
                            "afpDiscount",
                            value,
                          )
                        }
                        ariaLabel={`AFP de ${worker.worker.fullName}`}
                      />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <NumberInput
                        disabled={readOnly}
                        value={entry.advanceDiscount}
                        onChange={(value) =>
                          onEntryChange(
                            entry.generalPayrollEntryId,
                            "advanceDiscount",
                            value,
                          )
                        }
                        ariaLabel={`Adelanto de ${worker.worker.fullName}`}
                      />
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-bold ${net < 0 ? "text-red-600" : "text-emerald-700"}`}
                    >
                      S/ {moneyFormatter.format(net)}
                    </td>
                  </tr>
                );
              }),
              groupedWorkers.length === 0 ? (
                <tr key={`${group}-empty`}>
                  <td
                    colSpan={18}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    No hay trabajadores en este grupo.
                  </td>
                </tr>
              ) : (
                <ProjectTotalsRow
                  key={`${group}-totals`}
                  label={`Total ${groupLabel[group]}`}
                  totals={groupTotals}
                />
              ),
            ];
          })}
          <ProjectTotalsRow
            label="Total del proyecto"
            totals={allProjectTotals}
            overall
          />
        </tbody>
      </table>
    </div>
  );
}

interface GeneralGridProps {
  projects: GeneralPayrollProject[];
  workers: GeneralPayrollWorker[];
  onWorkerChange: (
    workerId: number,
    field: keyof GeneralPayrollWorker,
    value: number,
  ) => void;
  readOnly?: boolean;
}

export function GeneralPayrollGrid({
  projects,
  workers,
  onWorkerChange,
  readOnly = false,
}: GeneralGridProps) {
  const aggregate = (worker: GeneralPayrollWorker) => {
    const entries = projects
      .flatMap((project) => project.entries)
      .filter(
        (entry) =>
          entry.isActive &&
          entry.generalPayrollWorkerId === worker.generalPayrollWorkerId,
      );
    const days = Object.fromEntries(
      dayFields.map(([field]) => [
        field,
        entries.reduce((total, entry) => total + entry[field], 0),
      ]),
    ) as Record<(typeof dayFields)[number][0], number>;
    const totalDays = Object.values(days).reduce(
      (total, value) => total + value,
      0,
    );
    const overtime = entries.reduce(
      (total, entry) => total + entry.overtimeAmount,
      0,
    );
    const afp = entries.reduce((total, entry) => total + entry.afpDiscount, 0);
    const advance = entries.reduce(
      (total, entry) => total + entry.advanceDiscount,
      0,
    );
    const gross = totalDays * worker.dailyWage + overtime;
    const net = gross - afp - advance;
    const finalNet =
      net +
      worker.additionalAmount +
      worker.liquidationAmount +
      worker.sundayDinnerAmount;
    return {
      days,
      totalDays,
      dailyWage: worker.dailyWage,
      overtime,
      afp,
      advance,
      gross,
      net,
      additional: worker.additionalAmount,
      liquidation: worker.liquidationAmount,
      sundayDinner: worker.sundayDinnerAmount,
      finalNet,
    };
  };

  type GeneralColumnTotals = ReturnType<typeof aggregate>;
  const sumGeneralTotals = (
    selectedWorkers: GeneralPayrollWorker[],
  ): GeneralColumnTotals =>
    selectedWorkers.map(aggregate).reduce<GeneralColumnTotals>(
      (sum, current) => ({
        days: Object.fromEntries(
          dayFields.map(([field]) => [
            field,
            sum.days[field] + current.days[field],
          ]),
        ) as Record<DayField, number>,
        totalDays: sum.totalDays + current.totalDays,
        dailyWage: sum.dailyWage + current.dailyWage,
        overtime: sum.overtime + current.overtime,
        afp: sum.afp + current.afp,
        advance: sum.advance + current.advance,
        gross: sum.gross + current.gross,
        net: sum.net + current.net,
        additional: sum.additional + current.additional,
        liquidation: sum.liquidation + current.liquidation,
        sundayDinner: sum.sundayDinner + current.sundayDinner,
        finalNet: sum.finalNet + current.finalNet,
      }),
      {
        days: emptyDays(),
        totalDays: 0,
        dailyWage: 0,
        overtime: 0,
        afp: 0,
        advance: 0,
        gross: 0,
        net: 0,
        additional: 0,
        liquidation: 0,
        sundayDinner: 0,
        finalNet: 0,
      },
    );

  const renderTotalsRow = (
    label: string,
    totals: GeneralColumnTotals,
    overall = false,
  ) => (
    <tr
      key={label}
      className={
        overall
          ? "border-t-2 border-[#0047a3] bg-[#eaf2ff] font-extrabold text-[#0f2545]"
          : "border-t border-gray-200 bg-gray-100 font-bold text-[#0f2545]"
      }
    >
      <td colSpan={3} className="px-4 py-3 text-right">
        {label}
      </td>
      {dayFields.map(([field]) => (
        <td key={field} className="px-2 py-3 text-right">
          {moneyFormatter.format(totals.days[field])}
        </td>
      ))}
      {[
        totals.totalDays,
        totals.dailyWage,
        totals.overtime,
        totals.gross,
        totals.afp,
        totals.advance,
        totals.net,
        totals.additional,
        totals.liquidation,
        totals.sundayDinner,
        totals.finalNet,
      ].map((value, index) => (
        <td key={index} className="px-3 py-3 text-right">
          {index >= 1 ? "S/ " : ""}
          {moneyFormatter.format(value)}
        </td>
      ))}
    </tr>
  );

  const overallTotals = sumGeneralTotals(workers);

  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-[1850px] w-full border-collapse text-sm">
        <thead className="bg-[#f3f5f8] text-[#0f2545]">
          <tr>
            <th className="sticky left-0 z-20 min-w-12 bg-[#f3f5f8] px-3 py-4">
              Item
            </th>
            <th className="sticky left-12 z-20 min-w-64 bg-[#f3f5f8] px-3 py-4 text-left">
              Nombre y apellido
            </th>
            <th className="px-3 py-4 text-left">DNI</th>
            {dayFields.map(([, label]) => (
              <th key={label} className="px-2 py-4 text-right">
                {label}
              </th>
            ))}
            <th className="px-3 py-4 text-right">Total</th>
            <th className="px-3 py-4 text-right">Jornal/día</th>
            <th className="px-3 py-4 text-right">H.E.</th>
            <th className="px-3 py-4 text-right">Pago semana</th>
            <th className="px-3 py-4 text-right">AFP</th>
            <th className="px-3 py-4 text-right">Adelanto</th>
            <th className="px-3 py-4 text-right">Neto</th>
            <th className="px-3 py-4 text-right">Otros adicionales</th>
            <th className="px-3 py-4 text-right">Liquidación</th>
            <th className="px-3 py-4 text-right">Comida cena domingo</th>
            <th className="min-w-40 px-3 py-4 text-right">Neto final</th>
          </tr>
        </thead>
        <tbody>
          {(["laborer", "technician"] as const).map((group) => {
            const groupedWorkers = workers.filter(
              (worker) => worker.group === group,
            );
            const groupTotals = sumGeneralTotals(groupedWorkers);
            return [
              <tr
                key={`${group}-header`}
                className="bg-[#eaf2ff] text-[#0047a3]"
              >
                <td
                  colSpan={21}
                  className="px-4 py-2.5 font-bold uppercase tracking-wide"
                >
                  {groupLabel[group]}
                </td>
              </tr>,
              ...groupedWorkers.map((worker, index) => {
                const totals = aggregate(worker);
                return (
                  <tr
                    key={worker.generalPayrollWorkerId}
                    className="border-t border-gray-100 even:bg-gray-50/50"
                  >
                    <td className="sticky left-0 z-10 bg-inherit px-3 py-3 text-center">
                      {index + 1}
                    </td>
                    <td className={`sticky left-12 z-10 ${index % 2 === 0 ? 'bg-[#f8fafc]' : 'bg-white'} px-3 py-3 font-semibold text-[#0f2545] shadow-[6px_0_8px_-8px_rgba(15,37,69,0.35)]`}>
                      {worker.worker.fullName}
                    </td>
                    <td className="px-3 py-3 text-gray-600">
                      {worker.worker.dni}
                    </td>
                    {dayFields.map(([field]) => (
                      <td key={field} className="px-2 py-3 text-right">
                        {moneyFormatter.format(totals.days[field])}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right font-semibold">
                      {moneyFormatter.format(totals.totalDays)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      S/ {moneyFormatter.format(worker.dailyWage)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      S/ {moneyFormatter.format(totals.overtime)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      S/ {moneyFormatter.format(totals.gross)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      S/ {moneyFormatter.format(totals.afp)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      S/ {moneyFormatter.format(totals.advance)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      S/ {moneyFormatter.format(totals.net)}
                    </td>
                    {(
                      [
                        "additionalAmount",
                        "liquidationAmount",
                        "sundayDinnerAmount",
                      ] as const
                    ).map((field) => (
                      <td key={field} className="px-3 py-3 text-right">
                        <NumberInput
                          disabled={readOnly}
                          value={worker[field]}
                          onChange={(value) =>
                            onWorkerChange(
                              worker.generalPayrollWorkerId,
                              field,
                              value,
                            )
                          }
                          ariaLabel={`${field} de ${worker.worker.fullName}`}
                        />
                      </td>
                    ))}
                    <td
                      className={`px-3 py-3 text-right font-bold ${totals.finalNet < 0 ? "text-red-600" : "text-emerald-700"}`}
                    >
                      S/ {moneyFormatter.format(totals.finalNet)}
                    </td>
                  </tr>
                );
              }),
              groupedWorkers.length === 0 ? (
                <tr key={`${group}-empty`}>
                  <td
                    colSpan={21}
                    className="px-4 py-6 text-center text-gray-400"
                  >
                    No hay trabajadores en este grupo.
                  </td>
                </tr>
              ) : (
                renderTotalsRow(`Total ${groupLabel[group]}`, groupTotals)
              ),
            ];
          })}
          {renderTotalsRow("Total general", overallTotals, true)}
        </tbody>
      </table>
    </div>
  );
}
