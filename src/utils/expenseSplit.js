import { ValidationError } from "./ApiError";

export function round2(n) {
  return Math.round(Number(n) * 100) / 100;
}

/**
 * Equal split across memberIds; last member gets remainder so sum equals total.
 */
export function equalSplit(memberIds, totalValue) {
  const total = round2(totalValue);
  const n = memberIds.length;
  if (n === 0) throw new ValidationError("Members required");
  const per = Math.floor((total * 100) / n) / 100;
  let allocated = 0;
  const result = [];
  for (let i = 0; i < n - 1; i++) {
    result.push({ userId: memberIds[i], shareAmount: per });
    allocated = round2(allocated + per);
  }
  result.push({
    userId: memberIds[n - 1],
    shareAmount: round2(total - allocated),
  });
  return result;
}
