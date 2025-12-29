/**
 * Utility per calcolo commissioni RentHubber
 * 
 * Fee fissa dinamica basata sull'importo:
 * - HUBBER: ≤€10 → €0.50 | >€10 → €2.00
 * - RENTER: ≤€8 → €0.50 | >€8 → €2.00
 */

/**
 * Calcola la fee fissa HUBBER in base all'importo
 * @param amount - Importo totale (noleggio + pulizia)
 * @returns Fee fissa in euro
 */
export function calculateHubberFixedFee(amount: number): number {
  return amount <= 10 ? 0.50 : 2.00;
}

/**
 * Calcola la fee fissa RENTER in base all'importo
 * @param amount - Importo totale (noleggio + pulizia)
 * @returns Fee fissa in euro
 */
export function calculateRenterFixedFee(amount: number): number {
  return amount <= 8 ? 0.50 : 2.00;
}

/**
 * Calcola le commissioni complete per hubber
 * @param subtotal - Importo base + pulizia
 * @param variablePercentage - Percentuale commissione variabile (default 10%)
 * @returns Oggetto con variableFee, fixedFee, totalFee
 */
export function calculateHubberFee(
  subtotal: number,
  variablePercentage: number = 10
): {
  variableFee: number;
  fixedFee: number;
  totalFee: number;
} {
  const variableFee = (subtotal * variablePercentage) / 100;
  const fixedFee = calculateHubberFixedFee(subtotal);
  const totalFee = variableFee + fixedFee;

  return { variableFee, fixedFee, totalFee };
}

/**
 * Calcola le commissioni complete per renter
 * @param subtotal - Importo base + pulizia
 * @param variablePercentage - Percentuale commissione variabile (default 10%)
 * @returns Oggetto con variableFee, fixedFee, totalFee
 */
export function calculateRenterFee(
  subtotal: number,
  variablePercentage: number = 10
): {
  variableFee: number;
  fixedFee: number;
  totalFee: number;
} {
  const variableFee = (subtotal * variablePercentage) / 100;
  const fixedFee = calculateRenterFixedFee(subtotal);
  const totalFee = variableFee + fixedFee;

  return { variableFee, fixedFee, totalFee };
}