export const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

export const lineAmount = (
  quantity: number | string | null | undefined,
  unitPrice: number | string | null | undefined,
) => roundMoney((Number(quantity) || 0) * (Number(unitPrice) || 0));

export const totalFromRoundedLines = <
  T extends { quantity?: number | string | null | undefined },
>(
  items: T[],
  getUnitPrice: (item: T) => number | string | null | undefined,
) =>
  roundMoney(
    items.reduce(
      (total, item) => total + lineAmount(item.quantity, getUnitPrice(item)),
      0,
    ),
  );

