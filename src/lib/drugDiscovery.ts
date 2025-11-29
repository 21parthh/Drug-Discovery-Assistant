export interface Target {
  ensembl: string;
  symbol: string;
  score?: number;
}
export interface BioActivity {
  type?: string;
  value?: string | number;
  units?: string;
}
export interface CompoundAnalysis {
  SMILES: string;
  MolWt: number;
  LogP: number;
  TPSA: number;
  HBD: number;
  HBA: number;
  RotBonds: number;
  QED: number;
  Lipinski_violations: number;
  Veber_pass: boolean;
  Lead_like: boolean;
  error?: string;
}
export interface HitCompound {
  molecule_chembl_id?: string;
  smiles?: string;
  bioactivity: BioActivity;
  analysis?: CompoundAnalysis;
}
export interface TargetResult {
  symbol: string;
  ensembl: string;
  score?: number;
  chembl_target_id?: string;
  hits: HitCompound[];
  chembl_error?: string;
}
export interface DrugDiscoveryResult {
  efo_id?: string;
  disease_name?: string;
  targets: TargetResult[];
  error?: string;
}
export async function getEfoIdViaGraphQL(diseaseName: string): Promise<string | null> {
  const url = "https://api.platform.opentargets.org/api/v4/graphql";
  const gql = `
    query searchDisease($queryString: String!, $size: Int!) {
      search(queryString: $queryString, entityNames:["disease"], page:{index:0, size:$size}) {
        hits {
          id
          object {
            ... on Disease {
              name
            }
          }
        }
      }
    }`;
  const variables = { queryString: diseaseName, size: 1 };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gql, variables }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const hits = data?.data?.search?.hits || [];
    return hits.length > 0 ? hits[0].id : null;
  } catch (error) {
    console.error('Error fetching EFO ID:', error);
    return null;
  }
}
export async function getAssociatedTargets(efoId: string, size: number = 5) {
  const url = "https://api.platform.opentargets.org/api/v4/graphql";
  const gql = `
    query diseaseTargets($efoId: String!, $size: Int!) {
      disease(efoId: $efoId) {
        name
        associatedTargets(page: {index: 0, size: $size}) {
          rows {
            target {
              id
              approvedSymbol
            }
            score
          }
        }
      }
    }
  `;
  const variables = { efoId, size };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: gql, variables }),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const diseaseData = data?.data?.disease;
    if (!diseaseData) return null;
    return {
      disease: diseaseData.name,
      targets: diseaseData.associatedTargets.rows.map((row: any) => ({
        ensembl: row.target.id,
        symbol: row.target.approvedSymbol,
        score: row.score,
      })),
    };
  } catch (error) {
    console.error('Error fetching targets:', error);
    throw error;
  }
}
export async function getChemblTargetId(geneSymbol: string): Promise<string | null> {
  const url = `https://www.ebi.ac.uk/chembl/api/data/target/search.json?q=${geneSymbol}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const hits = data.targets || [];
    if (hits.length === 0) return null;
    for (const target of hits) {
      const chemblId = target.target_chembl_id;
      if (chemblId) return chemblId;
    }
    return hits[0]?.target_chembl_id || null;
  } catch (error) {
    console.error('Error fetching ChEMBL target:', error);
    return null;
  }
}
export async function getHitCompoundsForChemblTarget(
  chemblTargetId: string, 
  limit: number = 20
): Promise<HitCompound[]> {
  const url = "https://www.ebi.ac.uk/chembl/api/data/activity.json";
  const params = new URLSearchParams({
    target_chembl_id: chemblTargetId,
    limit: limit.toString(),
  });
  try {
    const response = await fetch(`${url}?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const activities = data.activities || [];
    return activities.map((act: any) => ({
      molecule_chembl_id: act.molecule_chembl_id,
      smiles: act.canonical_smiles,
      bioactivity: {
        type: act.standard_type,
        value: act.standard_value,
        units: act.standard_units,
      },
    }));
  } catch (error) {
    console.error('Error fetching hit compounds:', error);
    return [];
  }
}
import { ensureRDKit, computeCompoundAnalysis } from './rdkit';
export function analyzeCompound(smiles: string): CompoundAnalysis | null {
  try {
    return computeCompoundAnalysis(smiles);
  } catch (e) {
    return { 
      SMILES: smiles,
      MolWt: 0, LogP: 0, TPSA: 0, HBD: 0, HBA: 0, RotBonds: 0, QED: 0,
      Lipinski_violations: 0, Veber_pass: false, Lead_like: false,
      error: 'RDKit not initialized'
    };
  }
}
export async function runDrugDiscoveryPipeline(
  diseaseName: string,
  targetsToFetch: number = 5,
  hitsPerTarget: number = 10
): Promise<DrugDiscoveryResult> {
  try {
    const efoId = await getEfoIdViaGraphQL(diseaseName);
    if (!efoId) {
      return { error: `No EFO ID found for '${diseaseName}'`, targets: [] };
    }
    const assocResult = await getAssociatedTargets(efoId, targetsToFetch);
    if (!assocResult) {
      return { error: 'No associated targets found', targets: [] };
    }
    const result: DrugDiscoveryResult = {
      efo_id: efoId,
      disease_name: assocResult.disease,
      targets: [],
    };
    await ensureRDKit();
    for (const target of assocResult.targets) {
      const targetRecord: TargetResult = {
        symbol: target.symbol,
        ensembl: target.ensembl,
        score: target.score,
        hits: [],
      };
      try {
        const chemblId = await getChemblTargetId(target.symbol);
        targetRecord.chembl_target_id = chemblId;
        if (chemblId) {
          const hits = await getHitCompoundsForChemblTarget(chemblId, hitsPerTarget);
          targetRecord.hits = hits.map(hit => ({
            ...hit,
            analysis: hit.smiles ? analyzeCompound(hit.smiles) : undefined,
          }));
        }
      } catch (error) {
        targetRecord.chembl_error = error instanceof Error ? error.message : 'Unknown error';
      }
      result.targets.push(targetRecord);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    return result;
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      targets: [],
    };
  }
}