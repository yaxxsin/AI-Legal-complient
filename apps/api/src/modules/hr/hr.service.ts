import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HrService {
  private readonly logger = new Logger(HrService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * BPJS Calculation Logic
   */
  async calculateBpjs(dto: {
    baseSalary: number;
    allowances: number;
    jkkRiskLevel: 'sangat_rendah' | 'rendah' | 'sedang' | 'tinggi' | 'sangat_tinggi';
  }) {
    const totalSalary = dto.baseSalary + dto.allowances;
    
    // Default Caps (2024 assumption, would normally fetch from DB)
    const JP_CAP = 10042300;
    const KES_CAP = 12000000;

    const baseKes = Math.min(totalSalary, KES_CAP);
    const baseJp = Math.min(totalSalary, JP_CAP);

    // JKK Rates
    const jkkRates = {
      sangat_rendah: 0.0024,
      rendah: 0.0054,
      sedang: 0.0089,
      tinggi: 0.0127,
      sangat_tinggi: 0.0174,
    };
    
    const jkkMultiplier = jkkRates[dto.jkkRiskLevel] || 0.0024;

    const calculations = {
      jkk: { employer: totalSalary * jkkMultiplier, employee: 0 },
      jkm: { employer: totalSalary * 0.003, employee: 0 },
      jht: { employer: totalSalary * 0.037, employee: totalSalary * 0.02 },
      jp: { employer: baseJp * 0.02, employee: baseJp * 0.01 },
      kesehatan: { employer: baseKes * 0.04, employee: baseKes * 0.01 },
    };

    const employerTotal = 
      calculations.jkk.employer + 
      calculations.jkm.employer + 
      calculations.jht.employer + 
      calculations.jp.employer + 
      calculations.kesehatan.employer;

    const employeeTotal = 
      calculations.jkk.employee + 
      calculations.jkm.employee + 
      calculations.jht.employee + 
      calculations.jp.employee + 
      calculations.kesehatan.employee;

    return {
      salaryInput: totalSalary,
      breakdown: calculations,
      summary: {
        employerTotal: Math.round(employerTotal),
        employeeTotal: Math.round(employeeTotal),
        takeHomePay: Math.round(totalSalary - employeeTotal),
      }
    };
  }

  /**
   * Severance / Pesangon Calculation Logic (PP 35/2021)
   */
  calculateSeverance(dto: {
    salary: number;
    yearsOfService: number;
    monthsOfService: number; // additional months 
    reasonId: 'phk_efisiensi' | 'phk_merugi' | 'resign' | 'pensiun' | 'meninggal' | 'pelanggaran';
  }) {
    // 1. Calculate length of service completely in years (floor)
    let totalYears = dto.yearsOfService;
    if (dto.monthsOfService > 0) {
      if (totalYears === 0) totalYears = 0; // if it's months only, it handles below
    }

    // Hitung Uang Pesangon (UP)
    // <1 thn = 1 bln
    // 1-<2 = 2 bln...
    // 8thn+ = 9 bln
    let upMultiplier = 0;
    if (totalYears < 1 && dto.monthsOfService > 0) upMultiplier = 1;
    else if (totalYears >= 8) upMultiplier = 9;
    else upMultiplier = totalYears + 1; // if 1 yr = 2x, 2 yr = 3x, etc. wait, UU rules: 1 yr or more but less than 2 = 2 months. 

    // Hitung Uang Penghargaan Masa Kerja (UPMK)
    // 3-<6 = 2 bln
    // 6-<9 = 3 bln...
    // 24th+ = 10 bln
    let upmkMultiplier = 0;
    if (totalYears >= 24) upmkMultiplier = 10;
    else if (totalYears >= 21) upmkMultiplier = 8;
    else if (totalYears >= 18) upmkMultiplier = 7;
    else if (totalYears >= 15) upmkMultiplier = 6;
    else if (totalYears >= 12) upmkMultiplier = 5;
    else if (totalYears >= 9) upmkMultiplier = 4;
    else if (totalYears >= 6) upmkMultiplier = 3;
    else if (totalYears >= 3) upmkMultiplier = 2;

    const baseUP = dto.salary * upMultiplier;
    const baseUPMK = dto.salary * upmkMultiplier;

    // Apply specific reason multipliers based on PP 35/2021
    let modUP = 1;
    let modUPMK = 1;
    let modUPH = 1; // UPH varies but let's assume 1 for base.

    switch (dto.reasonId) {
      case 'phk_efisiensi': // PHK Efisiensi tidak rugi (1x UP, 1x UPMK, UPH)
        modUP = 1; modUPMK = 1;
        break;
      case 'phk_merugi': // Perusahaan rugi (0.5x UP, 1x UPMK, UPH)
        modUP = 0.5; modUPMK = 1;
        break;
      case 'resign': // Resign Sukarela (TIDAK ADA UP dan UPMK, hanya Uang Penggantian Hak/Pisah)
        modUP = 0; modUPMK = 0;
        break;
      case 'pensiun': // Pensiun (1.75x UP, 1x UPMK, UPH)
        modUP = 1.75; modUPMK = 1;
        break;
      case 'pelanggaran': // Pelanggaran (0.5x UP, 1x UPMK)
        modUP = 0.5; modUPMK = 1;
        break;
      case 'meninggal': // Meninggal (2x UP, 1x UPMK)
        modUP = 2; modUPMK = 1;
        break;
    }

    const calculatedUP = baseUP * modUP;
    const calculatedUPMK = baseUPMK * modUPMK;
    const calculatedUPH = dto.salary * 0; // Simplified UPH (cmonly Cuti), 0 default for calculator
    
    return {
      servicePeriod: `${totalYears} Tahun, ${dto.monthsOfService} Bulan`,
      reason: dto.reasonId,
      multipliers: { UP: modUP, UPMK: modUPMK },
      breakdown: {
        up_uang_pesangon: Math.round(calculatedUP),
        upmk_penghargaan_masa_kerja: Math.round(calculatedUPMK),
        uph_penggantian_hak: Math.round(calculatedUPH),
      },
      totalSeverance: Math.round(calculatedUP + calculatedUPMK + calculatedUPH)
    };
  }
}
