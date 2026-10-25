export const money = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-PK")}`;
export const discountPct = (price: number, compare?: number | null) =>
  compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0;
