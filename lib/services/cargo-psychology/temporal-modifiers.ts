/**
 * Temporal Modifiers Service
 *
 * Handles Saudi holidays, Islamic calendar, and temporal patterns
 * Critical for accurate psychology score calculation in Saudi market
 *
 * @module cargo-psychology
 */

import type { TemporalContext, HijriDate, TEMPORAL_MODIFIERS } from "./types";

// ============================================================================
// TEMPORAL MODIFIER SERVICE
// ============================================================================

export class TemporalModifierService {
  /**
   * Get temporal context for a date
   */
  getTemporalContext(date: Date): TemporalContext {
    const hijriDate = this.convertToHijri(date);

    return {
      date,
      dayOfWeek: date.getDay(),
      dayOfMonth: date.getDate(),
      month: date.getMonth() + 1,
      hijriDate,
      isRamadan: this.isRamadan(hijriDate),
      isEidAlFitr: this.isEidAlFitr(hijriDate),
      isEidAlAdha: this.isEidAlAdha(hijriDate),
      isHajjSeason: this.isHajjSeason(hijriDate),
      isNationalDay: this.isNationalDay(date),
      isFoundingDay: this.isFoundingDay(date),
      isEndOfMonth: date.getDate() >= 25,
      isStartOfMonth: date.getDate() <= 5,
      temporalMultiplier: this.calculateTemporalMultiplier(date, hijriDate),
    };
  }

  /**
   * Calculate temporal multiplier for psychology score
   */
  calculateTemporalMultiplier(date: Date, hijriDate: HijriDate): number {
    let multiplier = 1.0;

    // Day of week effects
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 4) {
      // Thursday
      multiplier *= TEMPORAL_MODIFIERS.THURSDAY_EFFECT;
    } else if (dayOfWeek === 5) {
      // Friday
      multiplier *= TEMPORAL_MODIFIERS.FRIDAY;
    } else if (dayOfWeek === 6) {
      // Saturday
      multiplier *= TEMPORAL_MODIFIERS.SATURDAY;
    }

    // End of month (cash flow pressure)
    if (date.getDate() >= 25) {
      multiplier *= TEMPORAL_MODIFIERS.END_OF_MONTH;
    }

    // Start of month (fresh budgets)
    if (date.getDate() <= 5) {
      multiplier *= TEMPORAL_MODIFIERS.START_OF_MONTH;
    }

    // Islamic calendar effects
    if (this.isRamadan(hijriDate)) {
      multiplier *= TEMPORAL_MODIFIERS.RAMADAN;
    }
    if (this.isEidAlFitr(hijriDate)) {
      multiplier *= TEMPORAL_MODIFIERS.EID_AL_FITR;
    }
    if (this.isEidAlAdha(hijriDate)) {
      multiplier *= TEMPORAL_MODIFIERS.EID_AL_ADHA;
    }
    if (this.isHajjSeason(hijriDate)) {
      multiplier *= TEMPORAL_MODIFIERS.HAJJ_SEASON;
    }

    // Saudi national holidays
    if (this.isNationalDay(date)) {
      multiplier *= TEMPORAL_MODIFIERS.NATIONAL_DAY;
    }
    if (this.isFoundingDay(date)) {
      multiplier *= TEMPORAL_MODIFIERS.FOUNDING_DAY;
    }

    return multiplier;
  }

  /**
   * Convert Gregorian date to Hijri (Islamic calendar)
   * Uses approximate calculation (for production, use a proper Hijri library)
   */
  convertToHijri(date: Date): HijriDate {
    // Approximate conversion (for production, use a library like moment-hijri or hijri-date)
    // This is a simplified version
    const gregorianYear = date.getFullYear();
    const gregorianMonth = date.getMonth() + 1;
    const gregorianDay = date.getDate();

    // Approximate: Hijri year ≈ Gregorian year - 579
    // More accurate conversion would use astronomical calculations
    let hijriYear = gregorianYear - 579;
    let hijriMonth = gregorianMonth;
    let hijriDay = gregorianDay;

    // Adjust for month differences (Hijri months are lunar, ~29.5 days)
    // This is simplified - for production use a proper library
    if (hijriDay > 29) {
      hijriDay = 1;
      hijriMonth++;
      if (hijriMonth > 12) {
        hijriMonth = 1;
        hijriYear++;
      }
    }

    return {
      year: hijriYear,
      month: hijriMonth,
      day: hijriDay,
      monthName: this.getHijriMonthName(hijriMonth),
    };
  }

  /**
   * Get Hijri month name
   */
  private getHijriMonthName(month: number): string {
    const months = [
      "Muharram",
      "Safar",
      "Rabi' al-awwal",
      "Rabi' al-thani",
      "Jumada al-awwal",
      "Jumada al-thani",
      "Rajab",
      "Sha'ban",
      "Ramadan",
      "Shawwal",
      "Dhu al-Qi'dah",
      "Dhu al-Hijjah",
    ];
    return months[month - 1] || "Unknown";
  }

  /**
   * Check if date is during Ramadan
   */
  isRamadan(hijriDate: HijriDate): boolean {
    return hijriDate.month === 9; // Ramadan is the 9th month
  }

  /**
   * Check if date is Eid al-Fitr
   */
  isEidAlFitr(hijriDate: HijriDate): boolean {
    // Eid al-Fitr is on 1st of Shawwal (10th month)
    // Also check a few days around it
    return hijriDate.month === 10 && hijriDate.day <= 3;
  }

  /**
   * Check if date is Eid al-Adha
   */
  isEidAlAdha(hijriDate: HijriDate): boolean {
    // Eid al-Adha is on 10th of Dhu al-Hijjah (12th month)
    // Also check a few days around it
    return hijriDate.month === 12 && hijriDate.day >= 10 && hijriDate.day <= 13;
  }

  /**
   * Check if date is during Hajj season
   */
  isHajjSeason(hijriDate: HijriDate): boolean {
    // Hajj is in Dhu al-Hijjah (12th month), typically 8th-12th
    return hijriDate.month === 12 && hijriDate.day >= 8 && hijriDate.day <= 12;
  }

  /**
   * Check if date is Saudi National Day (September 23)
   */
  isNationalDay(date: Date): boolean {
    return date.getMonth() === 8 && date.getDate() === 23; // September 23
  }

  /**
   * Check if date is Saudi Founding Day (February 22)
   */
  isFoundingDay(date: Date): boolean {
    return date.getMonth() === 1 && date.getDate() === 22; // February 22
  }

  /**
   * Get temporal modifier description
   */
  getTemporalModifierDescription(context: TemporalContext): string[] {
    const descriptions: string[] = [];

    if (context.isRamadan) {
      descriptions.push("Ramadan - Reduced working hours");
    }
    if (context.isEidAlFitr) {
      descriptions.push("Eid al-Fitr - Holiday disruption");
    }
    if (context.isEidAlAdha) {
      descriptions.push("Eid al-Adha - Major holiday");
    }
    if (context.isHajjSeason) {
      descriptions.push("Hajj Season - Resource constraints");
    }
    if (context.isNationalDay) {
      descriptions.push("Saudi National Day");
    }
    if (context.isFoundingDay) {
      descriptions.push("Saudi Founding Day");
    }
    if (context.isEndOfMonth) {
      descriptions.push("End of Month - Cash flow pressure");
    }
    if (context.isStartOfMonth) {
      descriptions.push("Start of Month - Fresh budgets");
    }

    const dayNames = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    if (context.dayOfWeek === 4) {
      descriptions.push("Thursday - Pre-weekend effect");
    } else if (context.dayOfWeek === 5) {
      descriptions.push("Friday - Weekend day");
    } else if (context.dayOfWeek === 6) {
      descriptions.push("Saturday - First workday stress");
    }

    return descriptions;
  }
}

// Export singleton instance
export const temporalModifierService = new TemporalModifierService();
