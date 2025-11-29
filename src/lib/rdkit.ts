import type { CompoundAnalysis } from './drugDiscovery';
import initRDKit from '@rdkit/rdkit';
let RDKit: any | null = null;
let initPromise: Promise<void> | null = null;
export async function ensureRDKit(): Promise<void> {
  if (RDKit) return;
  if (!initPromise) {
    const CDN_BASE = 'https://unpkg.com/@rdkit/rdkit@2021.3.3/Code/MinimalLib/dist';
    initPromise = initRDKit({
      locateFile: (file: string) => `${CDN_BASE}/${file}`,
    })
      .then((module: any) => {
        RDKit = module;
      })
      .catch((err) => {
        console.error('Failed to initialize RDKit:', err);
        throw err;
      });
  }
  return initPromise;
}
export function isRDKitReady(): boolean {
  return !!RDKit;
}
export function computeCompoundAnalysis(smiles: string): CompoundAnalysis | null {
  if (!smiles) return null;
  if (!RDKit) {
    throw new Error('RDKit not initialized');
  }
  let mol: any | null = null;
  try {
    mol = RDKit.get_mol(smiles);
    if (!mol) {
      return { 
        SMILES: smiles,
        MolWt: 0, LogP: 0, TPSA: 0, HBD: 0, HBA: 0, RotBonds: 0, QED: 0,
        Lipinski_violations: 0, Veber_pass: false, Lead_like: false,
        error: 'invalid_smiles'
      };
    }
    let desc: any = mol.get_descriptors?.();
    if (typeof desc === 'string') {
      try { desc = JSON.parse(desc); } catch {  }
    }
    const MolWt = Number(desc?.MolWt ?? mol?.get_molwt?.() ?? 0);
    const TPSA = Number(desc?.TPSA ?? mol?.get_tpsa?.() ?? 0);
    const HBD = Number(desc?.NumHBD ?? desc?.HBD ?? 0);
    const HBA = Number(desc?.NumHBA ?? desc?.HBA ?? 0);
    const RotBonds = Number(desc?.NumRotatableBonds ?? desc?.RotatableBonds ?? 0);
    const LogP = Number(desc?.CrippenClogP ?? desc?.LogP ?? 0);
    let QED = 0;
    try {
      if (typeof RDKit.qed === 'function') {
        QED = Number(RDKit.qed(mol));
      } else if (typeof RDKit.get_qed === 'function') {
        QED = Number(RDKit.get_qed(mol));
      } else if (typeof mol.get_qed === 'function') {
        QED = Number(mol.get_qed());
      }
    } catch {
      QED = 0;
    }
    const rounded = (n: number, d = 2) => Number.isFinite(n) ? Number(n.toFixed(d)) : 0;
    let lip = 0;
    if (MolWt > 500) lip += 1;
    if (LogP > 5) lip += 1;
    if (HBD > 5) lip += 1;
    if (HBA > 10) lip += 1;
    const analysis: CompoundAnalysis = {
      SMILES: smiles,
      MolWt: rounded(MolWt, 2),
      LogP: rounded(LogP, 2),
      TPSA: rounded(TPSA, 2),
      HBD,
      HBA,
      RotBonds,
      QED: rounded(QED, 3),
      Lipinski_violations: lip,
      Veber_pass: TPSA <= 140 && RotBonds <= 10,
      Lead_like: MolWt <= 350 && LogP <= 3 && HBD <= 3 && HBA <= 6 && RotBonds <= 7,
    };
    return analysis;
  } catch (err: any) {
    console.error('Descriptor calculation failed:', err);
    return { 
      SMILES: smiles,
      MolWt: 0, LogP: 0, TPSA: 0, HBD: 0, HBA: 0, RotBonds: 0, QED: 0,
      Lipinski_violations: 0, Veber_pass: false, Lead_like: false,
      error: String(err?.message || err)
    };
  } finally {
    try { mol?.delete?.(); } catch {  }
  }
}
